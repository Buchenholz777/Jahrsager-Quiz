// Erzeugt content/recherche/ereigniskarten-recherche.md aus content/ereigniskarten.ts
import fs from "node:fs";
import path from "node:path";
import { PAKETE } from "../content/ereigniskarten";
import { IMAGE_STATUS_LABELS } from "../src/server/types";

const out: string[] = [];
const L = (s = "") => out.push(s);

L("# Ereigniskarten und Bilddatensätze – Rechercheübersicht");
L();
L("> Automatisch erzeugt mit `npm run research:report` aus `content/ereigniskarten.ts`. Nicht von Hand ändern.");
L();
L("## So sind die Status zu lesen");
L();
L("| Status | Bedeutung |");
L("|---|---|");
L(`| **${IMAGE_STATUS_LABELS.recherchiert}** | Urheber, Lizenz und Datum stammen aus Archiv-/Commons-Metadaten. Die Originalseite des Archivs war bei der Recherche teils nicht lesbar. Kein Mensch hat das Bild angesehen. |`);
L(`| **${IMAGE_STATUS_LABELS.zu_pruefen}** | Es gibt offene Widersprüche oder Lücken (z. B. unklarer Urheber, nur Jahr statt Tag, geringe Auflösung). |`);
L(`| **${IMAGE_STATUS_LABELS.freigegeben}** | Ein Mensch hat Bild, Urheber, Lizenz und Datum am Original geprüft. **Aktuell hat keine Karte diesen Status.** |`);
L();
L("Im Spiel ist derzeit für **jede** Karte ein generierter Platzhalter sichtbar. Das Kandidatenbild wird erst über den Redaktionsbereich (Button „Kandidatenbild importieren“) oder `npm run images:import -- --yes` geladen und bleibt danach „noch zu prüfen“.");
L();
L("Die **Faktenquellen** sind getrennt bewertet: „Primärquellen“ = Seiten von Institutionen (NASA, NPS, Smithsonian, Bundesregierung, Land Berlin, Apple Newsroom, King Institute, Stiftung Berliner Mauer, Panama Canal Authority, Olympedia …); „teilweise Hilfsquellen“ = mindestens ein zentraler Fakt stützt sich nur auf Wikipedia.");
L();
L("## Übersicht");
L();
L("| Paket | Pos. | Ereignis | Jahr | Themenfeld | Stufe | Bildstatus | Fakten |");
L("|---|---|---|---|---|---|---|---|");
PAKETE.forEach((pack, pi) =>
  pack.forEach((c, i) =>
    L(
      `| ${pi + 1} | ${i + 1} | ${c.public_title} | ${c.correct_year} | ${c.category} | ${c.difficulty} | ${IMAGE_STATUS_LABELS[c.imageStatus]} | ${
        c.research.factsStatus === "primaerquellen" ? "Primärquellen" : "teilweise Hilfsquellen"
      } |`,
    ),
  ),
);
L();

PAKETE.forEach((pack, pi) => {
  L(`## Paket ${pi + 1}`);
  L();
  for (const c of pack) {
    const im = c.research.image!;
    L(`### ${c.public_title} (${c.correct_year})`);
    L();
    L("**Bilddatensatz**");
    L();
    L("| Feld | Wert |");
    L("|---|---|");
    L(`| Bildstatus | ${IMAGE_STATUS_LABELS[c.imageStatus]} |`);
    L(`| Quellenlink (Commons) | [${im.commonsFile}](${im.commonsUrl}) |`);
    L(`| Originalquelle | [${im.originalUrl}](${im.originalUrl}) – ${im.originalReadable ? "bei der Recherche gelesen" : "bei der Recherche NICHT lesbar"} |`);
    L(`| Urheber | ${im.author}${im.authorNote ? ` (${im.authorNote})` : ""} |`);
    L(`| Lizenz | [${im.license}](${im.licenseUrl}) |`);
    L(`| Aufnahmedatum | ${im.photoDate}${im.photoDateNote ? ` – ${im.photoDateNote}` : ""} |`);
    L(`| Ereignisjahr | ${c.correct_year}${c.exact_date ? ` (${c.exact_date})` : ""} |`);
    L(`| Bildnachweis (vor dem Tipp) | ${im.creditShort} |`);
    L(`| Bildnachweis (vollständig) | ${im.creditFull} |`);
    L(`| Maße | ${im.width} × ${im.height} px |`);
    L();
    L("**Faktenquellen**");
    L();
    for (const s of c.sources) L(`- ${s.url ? `[${s.label}](${s.url})` : s.label}`);
    L();
    L("**Offene Prüfpunkte**");
    L();
    for (const o of c.research.openPoints ?? []) L(`- ${o}`);
    if (im.risks.length) for (const r of im.risks) L(`- Risiko: ${r}`);
    L();
  }
});

const file = path.join(process.cwd(), "content", "recherche", "ereigniskarten-recherche.md");
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, out.join("\n") + "\n", "utf8");
console.log(`Geschrieben: ${path.relative(process.cwd(), file)}`);
