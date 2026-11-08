"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORIES, DIFFICULTY_LABELS } from "@/lib/constants";
import { IMAGE_STATUSES, IMAGE_STATUS_LABELS } from "@/server/types";
import type { EventRow } from "@/server/types";
import { saveEventAction, type FormState } from "../actions";

const initial: FormState = { messages: [] };
const input = "mt-1 w-full rounded-xl border-2 border-line bg-card px-3 py-2.5 focus:border-ink";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      {children}
    </label>
  );
}

export function EventForm({ event }: { event: EventRow | null }) {
  const [state, action, pending] = useActionState(saveEventAction, initial);
  const e = event;
  const live = e?.status === "eingeplant" || e?.status === "veroeffentlicht";
  const sources = (e?.sources ?? []).map((s) => (s.url ? `${s.label} | ${s.url}` : s.label)).join("\n");

  return (
    <form action={action} encType="multipart/form-data" className="space-y-8">
      {e && <input type="hidden" name="id" value={e.id} />}

      <fieldset className="space-y-4 rounded-card border border-line bg-card p-5">
        <legend className="px-2 font-display text-xl font-semibold">Vor dem Tipp sichtbar (keine Zeitangaben!)</legend>
        <Field label="Neutrale Überschrift" hint="Ohne Jahr, Datum, Jahrzehnt oder Jubiläumszahl.">
          <input name="neutral_title" required defaultValue={e?.neutral_title} className={input} />
        </Field>
        <Field label="Beschreibung (ca. 30–55 Wörter)" hint="Was geschieht, wer ist beteiligt, warum bemerkenswert – ohne rechnerische Hinweise.">
          <textarea name="description" required rows={5} defaultValue={e?.description} className={input} />
        </Field>
        <Field label="Alternativtext des Bildes" hint="Beschreibt sichtbaren Inhalt, ohne das Lösungsjahr.">
          <input name="image_alt" required defaultValue={e?.image_alt} className={input} />
        </Field>
        <Field label="Kurz-Bildnachweis (direkt am Foto)" hint="Muss frei von Zeitangaben sein; vollständiger Nachweis folgt unten.">
          <input name="image_credit_short" defaultValue={e?.image_credit_short} className={input} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 rounded-card border border-line bg-card p-5">
        <legend className="px-2 font-display text-xl font-semibold">Ereignis und Lösung</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ereignisjahr (1900–2020)">
            <input name="correct_year" type="number" min={1900} max={2020} required defaultValue={e?.correct_year ?? ""} className={input} />
          </Field>
          <Field label="Genaues Datum (optional)" hint="JJJJ-MM-TT">
            <input name="exact_date" defaultValue={e?.exact_date ?? ""} placeholder="1969-07-20" className={input} />
          </Field>
          <Field label="Aufnahmedatum" hint="Wann entstand das Foto? Muss zum Ereignis passen.">
            <input name="photo_date" defaultValue={e?.photo_date ?? ""} className={input} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Slug (URL)">
            <input name="slug" required defaultValue={e?.slug} placeholder="apollo-11-mondlandung" className={input} />
          </Field>
          <Field label="Themenfeld">
            <select name="category" defaultValue={e?.category ?? "politik"} className={input}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Schwierigkeit (Einschätzung)">
            <select name="difficulty" defaultValue={e?.difficulty ?? 2} className={input}>
              {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Titel der Auflösung (öffentlicher Titel)">
          <input name="public_title" required defaultValue={e?.public_title} className={input} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 rounded-card border border-line bg-card p-5">
        <legend className="px-2 font-display text-xl font-semibold">Auflösung (nach dem Tipp)</legend>
        <Field label="Was geschah? (2–3 Sätze)"><textarea name="explanation_what" required rows={3} defaultValue={e?.explanation_what} className={input} /></Field>
        <Field label="Warum ist es bedeutsam?"><textarea name="explanation_why" required rows={3} defaultValue={e?.explanation_why} className={input} /></Field>
        <Field label="Ein Detail zum Mitnehmen"><textarea name="explanation_detail" required rows={2} defaultValue={e?.explanation_detail} className={input} /></Field>
        <Field label="Historischer Hintergrund (für die Wissensseite)"><textarea name="background" rows={4} defaultValue={e?.background} className={input} /></Field>
        <Field label="Faktenquellen" hint="Eine pro Zeile: „Titel | https://url“. Erfinde keine Quellen.">
          <textarea name="sources" rows={4} defaultValue={sources} className={input} />
        </Field>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="knowledge_enabled" defaultChecked={e?.knowledge_enabled} className="size-5" />
          <span className="text-sm">Eigene Wissensseite (/geschichte/…) nach Ende des Tagesrätsels veröffentlichen</span>
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-card border border-line bg-card p-5">
        <legend className="px-2 font-display text-xl font-semibold">Bild und Rechte</legend>
        {e?.image_id && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/bild/${e.image_id}${e.image_ext === "svg" ? "" : "?w=800"}`} alt={e.image_alt} className="max-h-60 rounded-xl border border-line" />
        )}
        {e?.image_is_placeholder && <p className="rounded-xl bg-sun-soft p-3 text-sm text-ink">Aktuelles Bild ist ein Platzhalter und kann nicht für Produktionsinhalte freigegeben werden.</p>}
        <Field label="Bildstatus" hint="„Redaktionell freigegeben“ nur setzen, wenn ein Mensch Bild, Urheber, Lizenz und Datum am Original geprüft hat.">
          <select name="image_status" defaultValue={e?.image_status ?? "platzhalter"} className={input}>
            {IMAGE_STATUSES.map((s) => <option key={s} value={s}>{IMAGE_STATUS_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field label="Bild hochladen (JPEG, PNG, WebP, max. 12 MB)" hint="Metadaten werden entfernt, es entstehen optimierte WebP-Varianten.">
          <input type="file" name="image_file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fotograf/in"><input name="image_photographer" defaultValue={e?.image_photographer} className={input} /></Field>
          <Field label="Institution/Archiv"><input name="image_institution" defaultValue={e?.image_institution} className={input} /></Field>
        </div>
        <Field label="Vollständiger Bildnachweis"><input name="image_credit_full" defaultValue={e?.image_credit_full} className={input} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lizenz / Nutzungsbedingungen"><input name="image_license" defaultValue={e?.image_license} className={input} /></Field>
          <Field label="Lizenz-URL"><input name="image_license_url" defaultValue={e?.image_license_url} className={input} /></Field>
        </div>
        <Field label="Originalfundstelle (URL)"><input name="image_source_url" defaultValue={e?.image_source_url} className={input} /></Field>
        <Field label="Dokumentierte Bearbeitungen" hint="z. B. „Zuschnitt“, „Kontrastanpassung“ – oder „keine“.">
          <input name="image_edits" defaultValue={e?.image_edits} className={input} />
        </Field>
      </fieldset>

      <fieldset className="space-y-3 rounded-card border border-line bg-card p-5">
        <legend className="px-2 font-display text-xl font-semibold">Prüfbestätigungen</legend>
        {[
          ["check_rights", "Bildrechte und Nutzungsbedingungen sind für die Veröffentlichung auf einer (später werbefinanzierten) Website geprüft.", e?.checks.rights],
          ["check_facts", "Ereignisjahr und Erklärungen sind gegen die genannten Quellen geprüft.", e?.checks.facts],
          ["check_photo", "Das Foto entstand nachweislich während dieses Ereignisses (kein späteres Denkmal, keine Nachstellung, kein Upload-Datum als Lösung).", e?.checks.photoMatchesEvent],
        ].map(([n, label, v]) => (
          <label key={n as string} className="flex items-start gap-3">
            <input type="checkbox" name={n as string} defaultChecked={!!v} className="mt-1 size-5" />
            <span className="text-sm">{label as string}</span>
          </label>
        ))}
      </fieldset>

      {live && (
        <Field label="Änderungsnotiz (Pflicht, da eingeplant/veröffentlicht)" hint="Wird in der Versionshistorie gespeichert. Bereits gespielte Partien behalten ihre Fassung.">
          <input name="note" className={input} />
        </Field>
      )}

      <div aria-live="polite">
        {state.messages.length > 0 && (
          <ul className={`rounded-xl p-4 text-sm font-medium ${state.ok ? "bg-good-soft text-good" : "bg-sun-soft text-ink"}`} role={state.ok ? "status" : "alert"}>
            {state.messages.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="save" disabled={pending}>Speichern</Button>
        {(!e || e.status === "entwurf") && <Button type="submit" name="intent" value="pruefung" variant="secondary" disabled={pending}>Speichern &amp; zur Prüfung</Button>}
        {e?.status === "in_pruefung" && <Button type="submit" name="intent" value="freigeben" variant="secondary" disabled={pending}>Speichern &amp; freigeben</Button>}
        {(e?.status === "in_pruefung" || e?.status === "freigegeben") && <Button type="submit" name="intent" value="entwurf" variant="ghost" disabled={pending}>Zurück zum Entwurf</Button>}
      </div>
    </form>
  );
}
