import type { Metadata } from "next";
import { PageEvent } from "@/components/analytics/page-event";
import Link from "next/link";
import { Container, PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "So funktioniert JAHRSAGER – Spielregeln" },
  description:
    "Die Regeln des täglichen Geschichtsquiz: fünf historische Fotos, Jahr schätzen, bis zu 1.000 Punkte pro Ereignis. So berechnet JAHRSAGER deine Punkte.",
  alternates: { canonical: "/so-funktionierts" },
};

const TABLE: [string, number][] = [
  ["Genau getroffen", 1000],
  ["1 Jahr daneben", 950],
  ["3 Jahre daneben", 850],
  ["5 Jahre daneben", 750],
  ["10 Jahre daneben", 500],
  ["20 Jahre oder mehr", 0],
];

export default function RegelnPage() {
  return (
    <Container>
      <PageEvent name="instructions_opened" params={{ page_type: "instructions" }} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "JAHRSAGER", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "So funktioniert’s", item: absoluteUrl("/so-funktionierts") },
          ],
        }}
      />
      <PageHeader eyebrow="Spielanleitung" title="So funktioniert’s" lead="JAHRSAGER ist ein kostenloses Geschichtsquiz im Browser. Jeden Tag spielen alle dieselben fünf Ereignisse." />
      <div className="prose-zs">
        <h2>Der Ablauf</h2>
        <ul>
          <li>Du siehst ein echtes historisches Foto und eine kurze Beschreibung – ohne Zeitangabe.</li>
          <li>Du schätzt das Jahr (1900 bis 2020) mit der Zeitleiste oder per Zahlenfeld und loggst es ein. Es gibt kein Zeitlimit.</li>
          <li>Danach erfährst du das richtige Jahr, deine Punkte und die Geschichte hinter dem Bild.</li>
          <li>Nach fünf Ereignissen siehst du dein Gesamtergebnis und kannst es spoilerfrei teilen.</li>
        </ul>
        <p>Wer gar nicht raten möchte, kann ein Ereignis ohne Tipp auflösen: Das ergibt 0 Punkte, zeigt aber die ganze Erklärung.</p>

        <h2>Die Punkteberechnung</h2>
        <p>
          Pro Ereignis gibt es höchstens 1.000 Punkte, pro Tagespartie also höchstens 5.000. Für jedes Jahr Abstand werden 50 Punkte abgezogen:{" "}
          <code>Punkte = max(0, 1000 − 50 × Abstand in Jahren)</code>.
        </p>
      </div>
      <div className="my-6 max-w-md overflow-hidden rounded-card border border-line bg-card shadow-card">
        <table className="w-full text-left">
          <caption className="sr-only">Punkte nach Abstand zum richtigen Jahr</caption>
          <thead className="bg-paper-2/70 text-sm text-ink-soft">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Abstand</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Punkte</th>
            </tr>
          </thead>
          <tbody>
            {TABLE.map(([l, p]) => (
              <tr key={l} className="border-t border-line">
                <td className="px-4 py-2.5">{l}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{new Intl.NumberFormat("de-DE").format(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="prose-zs">
        <p>Es gibt keinen Zeitbonus – Lesen und Lernen verschlechtern dein Ergebnis nicht. Bei Punktegleichstand bleibt es beim Gleichstand.</p>

        <h2>Tagesrätsel, Übung und Archiv</h2>
        <ul>
          <li>Um 00:00 Uhr (Europe/Berlin) erscheinen fünf neue Ereignisse. Alle spielen dieselben in derselben Reihenfolge.</li>
          <li>Nur dein erster Durchgang zählt als offizielle Tageswertung. Wiederholungen und Archivspiele sind Übung.</li>
          <li>Eine begonnene Partie kannst du auch nach Mitternacht beenden.</li>
          <li>Dein Spielstand geht beim Neuladen nicht verloren.</li>
        </ul>

        <h2>Spielstand und Statistik ohne Anmeldung</h2>
        <p>
          Du brauchst kein Konto. Dein Fortschritt wird über eine zufällige Kennung in einem Cookie diesem Browser zugeordnet. Bei einem Gerätewechsel oder nach dem
          Löschen der Browserdaten kann er verloren gehen. Mehr dazu in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>

        <h2>Bilder und Quellen</h2>
        <p>
          Jedes Ereignis wird redaktionell recherchiert. Wir verwenden nur echte Aufnahmen des jeweiligen Ereignisses, keine nachgestellten oder KI-generierten
          Bilder, und weisen Bildnachweise und Quellen aus. Findest du einen Fehler, kannst du ihn nach der Auflösung melden.
        </p>
      </div>
      <Link href="/spielen" className={buttonVariants({ size: "lg", className: "mt-8" })}>
        Jetzt Tagesrätsel spielen
      </Link>
    </Container>
  );
}
