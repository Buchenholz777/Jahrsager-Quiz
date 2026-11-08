import type { EventInput } from "@/server/types";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/server/db/client";
import { checkAdminPassword, createAdminToken, hashPassword, rateLimit, verifyAdminToken } from "@/server/auth";
import { createEvent, eventProblems, getEvent, listRevisions, transitionEvent, updateEvent } from "@/server/services/events";
import { answerRound, getGameState, startGame } from "@/server/services/games";
import { getPublicPack, getTodayPack, publishDuePacks, schedulePack, unschedulePack, validatePack } from "@/server/services/packs";
import { getKnowledge, listKnowledge } from "@/server/services/knowledge";
import { classifyReferrer, sanitizeProps } from "@/server/services/analytics";
import { eventInput, freshDb, makeEvents, newPlayer, NOON, TODAY } from "./helpers";

describe("Admin-Authentifizierung und Berechtigungen", () => {
  it("akzeptiert gültige und lehnt manipulierte/abgelaufene Sitzungen ab", async () => {
    const now = 1_800_000_000_000;
    const t = await createAdminToken(now);
    expect(await verifyAdminToken(t, now + 1000)).toBe(true);
    expect(await verifyAdminToken(t, now + 13 * 3600_000)).toBe(false); // abgelaufen
    const [exp, sig] = t.split(".");
    expect(await verifyAdminToken(`${Number(exp) + 99999999}.${sig}`, now)).toBe(false); // Ablauf verlängert
    expect(await verifyAdminToken(`${exp}.${"0".repeat(sig.length)}`, now)).toBe(false);
    for (const bad of [undefined, null, "", "abc", "123.", ".abc", "x.y"]) expect(await verifyAdminToken(bad as string, now)).toBe(false);
  });
  it("prüft Passwörter (Klartext nur lokal, Hash bevorzugt)", () => {
    expect(checkAdminPassword("test-passwort")).toBe(true);
    expect(checkAdminPassword("falsch")).toBe(false);
    expect(checkAdminPassword("")).toBe(false);
    const prev = process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD_HASH = hashPassword("ein-langes-passwort-123");
    expect(checkAdminPassword("ein-langes-passwort-123")).toBe(true);
    expect(checkAdminPassword("test-passwort")).toBe(false); // Hash überschreibt Klartext
    process.env.ADMIN_PASSWORD_HASH = prev ?? "";
  });
  it("begrenzt Anmeldeversuche", () => {
    const k = `t${Math.random()}`;
    const r = Array.from({ length: 6 }, () => rateLimit(k, 5, 60_000, 1000));
    expect(r).toEqual([true, true, true, true, true, false]);
    expect(rateLimit(k, 5, 60_000, 1000 + 61_000)).toBe(true);
  });
  it("schützt /admin per Proxy (ohne Sitzung Umleitung zur Anmeldung)", async () => {
    const { proxy } = await import("@/proxy");
    const { NextRequest } = await import("next/server");
    const res = await proxy(new NextRequest("http://localhost:3000/admin/ereignisse"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login");
    const ok = await proxy(new NextRequest("http://localhost:3000/admin/ereignisse", { headers: { cookie: `zs_admin=${await createAdminToken()}` } }));
    expect(ok.headers.get("location")).toBeNull();
    const login = await proxy(new NextRequest("http://localhost:3000/admin/login"));
    expect(login.headers.get("location")).toBeNull();
  });
});

describe("Redaktionsworkflow", () => {
  let db: Db;
  beforeAll(async () => {
    db = await freshDb();
  });

  it("verlangt für die Prüfung vollständige Felder ohne Zeitangaben", async () => {
    const bad = await createEvent(db, eventInput({ description: "Im Jahr 1960 versammeln sich Menschen auf einem großen Platz und hören einem Redner zu, während viele Zuschauer Kameras in die Höhe halten." }));
    await expect(transitionEvent(db, bad.id, "in_pruefung")).rejects.toMatchObject({ code: "PRUEFUNG_FEHLGESCHLAGEN" });
    const ok = await createEvent(db, eventInput());
    expect((await transitionEvent(db, ok.id, "in_pruefung")).status).toBe("in_pruefung");
  });

  it("verweigert die Freigabe ohne Prüfbestätigungen und bei Platzhalterbildern in Produktionsinhalten", async () => {
    const e = await createEvent(db, eventInput({ checks: {} }));
    await transitionEvent(db, e.id, "in_pruefung");
    await expect(transitionEvent(db, e.id, "freigegeben")).rejects.toMatchObject({ code: "FREIGABE_VERWEIGERT" });

    const prod = await createEvent(db, eventInput({ is_demo: false, image_is_placeholder: true }));
    expect(eventProblems(prod, "approval").join(" ")).toContain("Platzhalter");
    const real = await createEvent(db, eventInput({ is_demo: false, image_is_placeholder: false }));
    await transitionEvent(db, real.id, "in_pruefung");
    expect((await transitionEvent(db, real.id, "freigegeben")).status).toBe("freigegeben");
  });

  it("verbietet unzulässige Statuswechsel", async () => {
    const e = await createEvent(db, eventInput());
    await expect(transitionEvent(db, e.id, "freigegeben")).rejects.toMatchObject({ code: "STATUS_UNZULAESSIG" });
    await expect(transitionEvent(db, e.id, "veroeffentlicht")).rejects.toMatchObject({ code: "STATUS_UNZULAESSIG" });
  });

  it("versioniert Änderungen und verlangt bei Live-Inhalten eine Notiz", async () => {
    const e = await createEvent(db, eventInput());
    const v2 = await updateEvent(db, e.id, { ...eventInput(), ...pick(e), explanation_what: "Geänderte Erklärung." }, "Korrektur");
    expect(v2.version).toBe(2);
    expect((await listRevisions(db, e.id)).map((r) => r.version)).toEqual([2, 1]);
    expect((await updateEvent(db, e.id, pick(v2))).version).toBe(2); // keine Änderung → keine neue Version
    await db.run("update events set status = 'veroeffentlicht' where id = $1", [e.id]);
    await expect(updateEvent(db, e.id, { ...pick(v2), explanation_what: "Noch mal." }, "")).rejects.toMatchObject({ code: "NOTIZ_FEHLT" });
    expect((await updateEvent(db, e.id, { ...pick(v2), explanation_what: "Noch mal." }, "Tippfehler korrigiert")).version).toBe(3);
  });

  it("lässt begonnene Partien mit ihrer bisherigen Fassung fortfahren", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    const before = s.rounds[0].question.description;
    const ev = (await getTodayPack(db, NOON))!.events[0];
    await updateEvent(db, ev.id, { ...pick(ev), description: "Völlig neuer Text für den Test, der ausreichend lang ist und keine Zeitangaben enthält." }, "Testkorrektur");
    const again = await getGameState(db, p, s.gameId, NOON);
    expect(again!.rounds[0].question.description).toBe(before);
    const { state } = await answerRound(db, p, s.gameId, 1, 1950, NOON);
    expect(state.rounds[0].result?.correct).toBe(ev.correct_year); // abgeschlossenes Ergebnis bleibt unverändert
    const fresh = await newPlayer(db);
    expect((await startGame(db, fresh, {}, NOON)).rounds[0].question.description).toContain("Völlig neuer Text"); // neue Partien nutzen neue Fassung
  });
});

describe("Tagespakete, Veröffentlichung und Wissensseiten", () => {
  let db: Db;
  beforeAll(async () => {
    db = await freshDb();
  });
  afterEach(() => {
    process.env.ALLOW_DEMO_CONTENT = "true";
  });

  it("validiert Zusammensetzung: fünf unterschiedliche, freigegebene Ereignisse aus ≥ 3 Themenfeldern", async () => {
    const evs = await makeEvents(db);
    expect(validatePack(evs).errors.join(" ")).toContain("nicht freigegeben");
    for (const e of evs) await db.run("update events set status = 'freigegeben' where id = $1", [e.id]);
    const approved = await Promise.all(evs.map((e) => getEvent(db, e.id)));
    expect(validatePack(approved as never).errors).toEqual([]);
    const sameCat = await makeEvents(db, ["politik", "politik", "politik", "politik", "politik"]);
    for (const e of sameCat) await db.run("update events set status = 'freigegeben' where id = $1", [e.id]);
    const sc = await Promise.all(sameCat.map((e) => getEvent(db, e.id)));
    expect(validatePack(sc as never).errors.join(" ")).toContain("drei Themenfelder");
    expect(validatePack(approved!.slice(0, 4) as never).errors.join(" ")).toContain("genau 5");
    expect(validatePack([approved[0], approved[0], ...approved.slice(2)] as never).errors.join(" ")).toContain("nur einmal");
  });

  it("plant ein Paket ein, veröffentlicht es zum Stichtag und hält es vorher geheim", async () => {
    const evs = await makeEvents(db);
    for (const e of evs) await db.run("update events set status = 'freigegeben' where id = $1", [e.id]);
    await expect(schedulePack(db, { date: "2026-11-01", eventIds: evs.map((e) => e.id) }, NOON)).rejects.toMatchObject({ code: "DATUM_VERGANGEN" });
    await expect(schedulePack(db, { date: TODAY, eventIds: evs.map((e) => e.id) }, NOON)).rejects.toMatchObject({ code: "DATUM_BELEGT" });
    const pack = await schedulePack(db, { date: "2026-11-10", eventIds: evs.map((e) => e.id) }, NOON);
    expect((await getEvent(db, evs[0].id))!.status).toBe("eingeplant");
    // vor dem Stichtag: nicht spielbar, keine Wissensseite
    expect(await getPublicPack(db, pack.number, NOON)).toBeNull();
    await db.run("update events set knowledge_enabled = true where id = $1", [evs[0].id]);
    expect(await getKnowledge(db, evs[0].slug, NOON)).toBeNull();
    // am Stichtag: spielbar, aber Wissensseite erst NACH dem Tagesrätsel
    const day = new Date("2026-11-10T11:00:00Z");
    expect(await getPublicPack(db, pack.number, day)).not.toBeNull();
    expect((await getEvent(db, evs[0].id))!.status).toBe("veroeffentlicht");
    expect(await getKnowledge(db, evs[0].slug, day)).toBeNull();
    const next = new Date("2026-11-11T11:00:00Z");
    expect((await getKnowledge(db, evs[0].slug, next))?.public_title).toBe("Testereignis");
  });

  it("nimmt zukünftige Pakete zurück, aber keine laufenden", async () => {
    const evs = await makeEvents(db);
    for (const e of evs) await db.run("update events set status = 'freigegeben' where id = $1", [e.id]);
    const pack = await schedulePack(db, { date: "2026-12-24", eventIds: evs.map((e) => e.id) }, NOON);
    await unschedulePack(db, pack.id, NOON);
    expect((await getEvent(db, evs[0].id))!.status).toBe("freigegeben");
    const today = await getTodayPack(db, NOON);
    await expect(unschedulePack(db, today!.pack.id, NOON)).rejects.toMatchObject({ code: "PAKET_AKTIV" });
  });

  it("zeigt Wissensseiten nicht für das heutige Rätsel", async () => {
    const todayEvents = (await getTodayPack(db, NOON))!.events;
    const list = await listKnowledge(db, NOON);
    for (const e of todayEvents) expect(list.find((k) => k.id === e.id)).toBeUndefined();
    expect(list.length).toBeGreaterThan(0);
  });

  it("blendet Demo-Inhalte aus, wenn ALLOW_DEMO_CONTENT=false", async () => {
    process.env.ALLOW_DEMO_CONTENT = "false";
    expect(await getTodayPack(db, NOON)).toBeNull();
    expect(await getPublicPack(db, 1, NOON)).toBeNull();
    expect(await listKnowledge(db, NOON)).toEqual([]);
    await expect(startGame(db, await newPlayer(db), {}, NOON)).rejects.toMatchObject({ code: "KEIN_PAKET" });
  });

  it("veröffentlicht fällige Pakete idempotent", async () => {
    await publishDuePacks(db, TODAY);
    await publishDuePacks(db, TODAY);
    const n = await db.one<{ n: number }>("select count(*)::int as n from events where status = 'eingeplant' and id in (select event_id from daily_pack_events dpe join daily_packs p on p.id = dpe.pack_id where p.pack_date <= $1)", [TODAY]);
    expect(n!.n).toBe(0);
  });
});

describe("Datensparsame Messung", () => {
  it("entfernt Query-Strings und unerlaubte Felder", () => {
    expect(sanitizeProps({ path: "/geschichte/x?token=abc#frag", userId: "123", ip: "1.2.3.4", round: 3 })).toEqual({ path: "/geschichte/x", round: 3 });
  });
  it("kategorisiert Referrer grob, ohne Hosts zu speichern", () => {
    expect(classifyReferrer("https://www.google.de/search?q=x", "zeitspur.de", false)).toBe("suche");
    expect(classifyReferrer("https://l.facebook.com/", "zeitspur.de", false)).toBe("sozial");
    expect(classifyReferrer("", "zeitspur.de", false)).toBe("direkt");
    expect(classifyReferrer("https://zeitspur.de/x", "zeitspur.de", false)).toBe("direkt");
    expect(classifyReferrer("https://blog.example/post", "zeitspur.de", false)).toBe("sonstige");
    expect(classifyReferrer("", "zeitspur.de", true)).toBe("teilen");
  });
});

function pick(e: Awaited<ReturnType<typeof createEvent>>): EventInput {
  const { id, status, version, created_at, updated_at, published_at, ...rest } = e;
  void id; void status; void version; void created_at; void updated_at; void published_at;
  return rest as unknown as EventInput;
}
