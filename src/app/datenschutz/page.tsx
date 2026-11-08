import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { Container, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Datenschutz", alternates: { canonical: "/datenschutz" } };

export default function DatenschutzPage() {
  return (
    <Container>
      <PageHeader title="Datenschutzerklärung" />
      <div role="note" className="mb-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-sun bg-sun-soft p-4 text-ink">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          <strong>Entwurf – rechtlich noch nicht geprüft.</strong> Dieser Text beschreibt die tatsächliche technische Datenverarbeitung der Anwendung, ist aber{" "}
          <em>keine</em> rechtssichere Endfassung. Vor dem öffentlichen Launch müssen Verantwortlicher, Hosting-Anbieter, Rechtsgrundlagen und Fristen ergänzt und von einer
          fachkundigen Stelle geprüft werden.
        </p>
      </div>
      <div className="prose-zs">
        <h2>Verantwortlicher</h2>
        <p>[Name und Kontaktdaten des Betreibers – siehe Impressum, noch zu ergänzen]</p>

        <h2>Was technisch passiert</h2>
        <h3>Spielstand (technisch erforderliches Cookie)</h3>
        <p>
          Beim ersten Spielstart wird ein Cookie mit einer zufälligen Kennung (<code>zs_pid</code>) gesetzt, damit dein Spielstand, deine Statistik und deine Teilnahmeserie
          ohne Konto gespeichert werden können. Das Cookie ist für die von dir gewünschte Funktion erforderlich, enthält keine Klarnamen und wird nicht für Werbung verwendet.
          Gespeichert werden serverseitig: die Kennung, deine Tipps, Punkte und Zeitpunkte. Löschst du das Cookie, erhältst du eine neue Kennung; der alte Spielstand ist dann für dich
          nicht mehr erreichbar.
        </p>
        <h3>Datensparsame Reichweitenmessung</h3>
        <p>
          Wir zählen aggregiert, z. B. Aufrufe der Startseite, gestartete und abgeschlossene Partien, Nutzung des Archivs, der Teilen-Funktion und eine grobe Herkunftskategorie
          (Suche, Teilen, sozial, direkt). Dabei werden <strong>keine IP-Adressen, keine Cookies, keine Kennungen und keine Referrer-Adressen</strong> gespeichert. Signale wie „Do Not Track“
          und „Global Privacy Control“ werden berücksichtigt.
        </p>
        <h3>Server-Logs und Hosting</h3>
        <p>Der Hosting-Anbieter verarbeitet technisch bedingt IP-Adressen in Server-Logs. [Anbieter, Auftragsverarbeitung, Speicherdauer – noch zu ergänzen]</p>
        <h3>Fehlermeldungen</h3>
        <p>Wenn du einen sachlichen Fehler meldest, speichern wir deinen Text und den Bezug zum Ereignis. Bitte gib keine personenbezogenen Daten ein.</p>
        <h3>Externe Dienste</h3>
        <p>Es werden keine externen Tracking- oder Werbedienste und keine externen Schriftarten geladen. Schriften werden von unserem eigenen Server ausgeliefert.</p>

        <h2>Deine Rechte</h2>
        <p>[Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Beschwerde bei einer Aufsichtsbehörde – Text vor dem Launch ergänzen]</p>
      </div>
    </Container>
  );
}
