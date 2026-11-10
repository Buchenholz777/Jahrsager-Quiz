"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ADMIN_COOKIE, CATEGORY_KEYS, REGIONS } from "@/lib/constants";
import { importCandidateImage } from "@/server/services/image-import";
import { checkAdminPassword, createAdminToken, rateLimit } from "@/server/auth";
import { requireAdminAction } from "@/server/admin-session";
import { getDb } from "@/server/db/client";
import { processUpload } from "@/server/images";
import { blockEvent, unblockEvent } from "@/server/pipeline/admin";
import { createEvent, getEvent, transitionEvent, updateEvent, emptyEventInput } from "@/server/services/events";
import { schedulePack, unschedulePack } from "@/server/services/packs";
import { resolveReport } from "@/server/services/reports";
import { AppError, IMAGE_STATUSES, type EventInput, type ImageStatus, type Source } from "@/server/types";

export type FormState = { ok?: boolean; messages: string[] };

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? "lokal";
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000)) return { messages: ["Zu viele Versuche. Bitte warte 15 Minuten."] };
  const pw = String(fd.get("password") ?? "");
  // Konstante Mindestverzögerung gegen Zeitmessungen/Brute-Force
  await new Promise((r) => setTimeout(r, 400));
  if (!checkAdminPassword(pw)) return { messages: ["Anmeldung fehlgeschlagen."] };
  (await cookies()).set(ADMIN_COOKIE, await createAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  redirect("/admin");
}

export async function logoutAction() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

const cb = (fd: FormData, k: string) => fd.get(k) === "on";
const optStr = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

const EventForm = z.object({
  slug: z.string().trim().min(3, "Slug: mindestens 3 Zeichen").max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: nur Kleinbuchstaben, Ziffern und Bindestriche"),
  category: z.enum(CATEGORY_KEYS as [string, ...string[]], { message: "Themenfeld wählen" }),
  difficulty: z.coerce.number().int().min(1).max(3),
  subcategory: z.string().trim().max(80),
  region: z.enum(["", ...Object.keys(REGIONS)] as [string, ...string[]], { message: "Region wählen" }),
  country: z.string().trim().max(60),
  topic_key: z.string().trim().max(60),
  neutral_title: z.string().trim().min(3, "Neutrale Überschrift fehlt").max(90),
  description: z.string().trim().min(10, "Beschreibung fehlt").max(900),
  image_alt: z.string().trim().min(5, "Alternativtext fehlt").max(300),
  image_credit_short: z.string().trim().max(120),
  correct_year: z.coerce.number({ message: "Ereignisjahr fehlt" }).int().min(1900, "Jahr ab 1900").max(2020, "Jahr bis 2020"),
  exact_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum als JJJJ-MM-TT").nullable(),
  photo_date: z.string().trim().max(60).nullable(),
  public_title: z.string().trim().min(3, "Titel der Auflösung fehlt").max(120),
  explanation_what: z.string().trim().min(5, "„Was geschah?“ fehlt").max(1200),
  explanation_why: z.string().trim().min(5, "„Warum bedeutsam?“ fehlt").max(1200),
  explanation_detail: z.string().trim().min(5, "Detail fehlt").max(1200),
  background: z.string().trim().max(3000),
  image_photographer: z.string().trim().max(200),
  image_institution: z.string().trim().max(200),
  image_credit_full: z.string().trim().max(400),
  image_license: z.string().trim().max(200),
  image_license_url: z.string().trim().max(500),
  image_source_url: z.string().trim().max(500),
  image_edits: z.string().trim().max(500),
});

function parseSources(raw: string): Source[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, url] = l.split("|").map((s) => s.trim());
      return url ? { label, url } : { label };
    });
}

export async function saveEventAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdminAction();
  const db = await getDb();
  const id = optStr(fd.get("id"));
  const intent = String(fd.get("intent") ?? "save");
  const existing = id ? await getEvent(db, id) : null;
  if (id && !existing) return { messages: ["Ereignis nicht gefunden."] };

  const parsed = EventForm.safeParse({
    ...Object.fromEntries(fd.entries()),
    exact_date: optStr(fd.get("exact_date")),
    photo_date: optStr(fd.get("photo_date")),
  });
  if (!parsed.success) return { messages: parsed.error.issues.map((i) => i.message) };
  const f = parsed.data;

  let image = {
    image_id: existing?.image_id ?? null,
    image_ext: existing?.image_ext ?? null,
    image_width: existing?.image_width ?? null,
    image_height: existing?.image_height ?? null,
    image_is_placeholder: existing?.image_is_placeholder ?? false,
  };
  const rawStatus = String(fd.get("image_status") ?? "");
  let imageStatus: ImageStatus = (IMAGE_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as ImageStatus) : (existing?.image_status ?? "platzhalter");
  const file = fd.get("image_file");
  try {
    if (file instanceof File && file.size > 0) {
      const up = await processUpload(Buffer.from(await file.arrayBuffer()));
      image = { image_id: up.id, image_ext: up.ext, image_width: up.width, image_height: up.height, image_is_placeholder: false };
      if (imageStatus === "platzhalter" || imageStatus === "freigegeben") imageStatus = "zu_pruefen"; // neues Bild = erneut prüfen
    }
    const input: EventInput = {
      ...(existing ? { ...existing } : emptyEventInput()),
      ...f,
      exact_date: f.exact_date,
      photo_date: f.photo_date,
      sources: parseSources(String(fd.get("sources") ?? "")),
      ...image,
      image_status: imageStatus,
      checks: { rights: cb(fd, "check_rights"), facts: cb(fd, "check_facts"), photoMatchesEvent: cb(fd, "check_photo") },
      tags: String(fd.get("tags") ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
      knowledge_enabled: cb(fd, "knowledge_enabled"),
      homepage_showcase: cb(fd, "homepage_showcase"),
      is_demo: existing ? existing.is_demo : false,
    } as EventInput;
    // nur editierbare Felder weitergeben
    const note = String(fd.get("note") ?? "");
    const saved = existing ? await updateEvent(db, existing.id, input, note) : await createEvent(db, input, "Angelegt");
    if (intent === "pruefung") await transitionEvent(db, saved.id, "in_pruefung");
    else if (intent === "freigeben") await transitionEvent(db, saved.id, "freigegeben");
    else if (intent === "entwurf") await transitionEvent(db, saved.id, "entwurf");
    revalidatePath("/admin/ereignisse");
    if (!existing) redirect(`/admin/ereignisse/${saved.id}?gespeichert=1`);
    return { ok: true, messages: [intent === "save" ? "Gespeichert." : "Gespeichert und Status geändert."] };
  } catch (e) {
    if (e instanceof AppError) return { messages: [e.message] };
    throw e;
  }
}

export async function scheduleAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdminAction();
  const date = String(fd.get("date") ?? "");
  const ids = [1, 2, 3, 4, 5].map((i) => String(fd.get(`event${i}`) ?? ""));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { messages: ["Bitte ein Datum wählen."] };
  if (ids.some((i) => !i)) return { messages: ["Bitte fünf Ereignisse wählen."] };
  try {
    const pack = await schedulePack(await getDb(), { date, eventIds: ids });
    revalidatePath("/admin/pakete");
    return { ok: true, messages: [`Tagespaket #${pack.number} für ${date} eingeplant.`] };
  } catch (e) {
    if (e instanceof AppError) return { messages: [e.message] };
    throw e;
  }
}

export async function unscheduleAction(fd: FormData) {
  await requireAdminAction();
  await unschedulePack(await getDb(), String(fd.get("id")));
  revalidatePath("/admin/pakete");
}

export async function blockEventAction(fd: FormData) {
  await requireAdminAction();
  await blockEvent(await getDb(), String(fd.get("id")), String(fd.get("reason") ?? ""));
  revalidatePath("/admin/automatik");
}

export async function unblockEventAction(fd: FormData) {
  await requireAdminAction();
  await unblockEvent(await getDb(), String(fd.get("id")));
  revalidatePath("/admin/automatik");
}

export async function resolveReportAction(fd: FormData) {
  await requireAdminAction();
  const status = fd.get("status") === "verworfen" ? "verworfen" : "bearbeitet";
  await resolveReport(await getDb(), String(fd.get("id")), status, String(fd.get("note") ?? ""));
  revalidatePath("/admin/meldungen");
}

export async function importImageAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdminAction();
  try {
    const ev = await importCandidateImage(await getDb(), String(fd.get("id")));
    revalidatePath(`/admin/ereignisse/${ev.id}`);
    return { ok: true, messages: ["Kandidatenbild importiert. Bildstatus: „noch zu prüfen“ – bitte Bild, Urheber, Lizenz und Datum am Original prüfen."] };
  } catch (e) {
    if (e instanceof AppError) return { messages: [e.message] };
    return { messages: ["Import fehlgeschlagen: " + (e as Error).message] };
  }
}

/** Freigabe-Assistent: bestätigt nach eigener Prüfung des Admins Bild, Rechte, Fakten und Datum und gibt das Ereignis frei. */
export async function approveQuickAction(fd: FormData) {
  await requireAdminAction();
  const db = await getDb();
  const id = String(fd.get("id"));
  let fehler = "";
  try {
    const ev = await getEvent(db, id);
    if (!ev || ev.blocked) throw new AppError("NICHT_GEFUNDEN", "Ereignis nicht gefunden oder gesperrt.", 404);
    if (!cb(fd, "check_rights") || !cb(fd, "check_photo") || !cb(fd, "check_facts")) throw new AppError("BESTAETIGUNG", "Alle drei Bestätigungen sind nötig.");
    const input = {
      ...ev,
      image_alt: String(fd.get("image_alt") ?? "").trim(),
      image_status: "freigegeben",
      checks: { rights: true, facts: true, photoMatchesEvent: true },
      homepage_showcase: cb(fd, "homepage_showcase"),
    } as EventInput;
    await updateEvent(db, id, input, "Freigabe-Assistent: Bild, Rechte, Fakten und Datum vom Admin geprüft");
    if (ev.status === "entwurf") await transitionEvent(db, id, "in_pruefung");
    await transitionEvent(db, id, "freigegeben");
    const entry = { at: new Date().toISOString(), actor: "admin", step: "freigabe-assistent", decision: "ok", rules: ["Bild, Urheber, Lizenz, Quelle, Aufnahmedatum und Fakten vom Admin geprüft und bestätigt."] };
    await db.run("update events set pipeline_state = null, audit = audit || $2::jsonb where id = $1", [id, JSON.stringify([entry])]);
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    fehler = e.message;
  }
  revalidatePath("/admin/freigabe");
  revalidatePath("/admin/automatik");
  if (fehler) redirect(`/admin/freigabe?fehler=${encodeURIComponent(fehler)}`);
}

/**
 * Sammel-Freigabe: gibt alle Entwürfe MIT echtem Foto frei, nachdem der Admin die drei Prüfungen für den ganzen Stapel ausdrücklich bestätigt hat.
 * Jedes Ereignis durchläuft dieselben Prüfungen wie die Einzelfreigabe (Foto im Speicher, Lizenz, Quelle, Texte); was sie nicht besteht, wird übersprungen und genannt.
 */
export async function approveAllAction(fd: FormData) {
  await requireAdminAction();
  const db = await getDb();
  let msg = "";
  let isError = false;
  try {
    if (!cb(fd, "check_rights") || !cb(fd, "check_photo") || !cb(fd, "check_facts")) throw new AppError("BESTAETIGUNG", "Alle drei Bestätigungen sind nötig.");
    const rows = await db.query<{ id: string; neutral_title: string }>(
      "select id, neutral_title from events where status = 'entwurf' and image_id is not null and not image_is_placeholder and not blocked and not is_demo order by created_at",
    );
    const done: string[] = [];
    const skipped: string[] = [];
    for (const r of rows) {
      try {
        const ev = await getEvent(db, r.id);
        if (!ev) continue;
        const input = { ...ev, image_status: "freigegeben", checks: { rights: true, facts: true, photoMatchesEvent: true } } as EventInput;
        await updateEvent(db, r.id, input, "Sammel-Freigabe: Bild, Rechte, Fakten und Datum vom Admin bestätigt");
        await transitionEvent(db, r.id, "in_pruefung");
        await transitionEvent(db, r.id, "freigegeben");
        const entry = { at: new Date().toISOString(), actor: "admin", step: "sammel-freigabe", decision: "ok", rules: ["Vom Admin als Stapel bestätigt (Bild, Rechte, Fakten, Datum)."] };
        await db.run("update events set pipeline_state = null, audit = audit || $2::jsonb where id = $1", [r.id, JSON.stringify([entry])]);
        done.push(r.neutral_title);
      } catch (e) {
        skipped.push(`${r.neutral_title}: ${e instanceof AppError ? e.message : "Fehler"}`);
      }
    }
    msg = `${done.length} freigegeben${skipped.length ? `. Übersprungen (${skipped.length}): ${skipped.join(" | ")}` : "."}`;
    isError = skipped.length > 0 && done.length === 0;
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    msg = e.message;
    isError = true;
  }
  revalidatePath("/admin/freigabe");
  revalidatePath("/admin/automatik");
  redirect(`/admin/freigabe?${isError ? "fehler" : "ok"}=${encodeURIComponent(msg)}`);
}
