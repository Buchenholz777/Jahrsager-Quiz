import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { Container, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Impressum", alternates: { canonical: "/impressum" } };

export default function ImpressumPage() {
  const name = process.env.NEXT_PUBLIC_OPERATOR_NAME;
  const address = process.env.NEXT_PUBLIC_OPERATOR_ADDRESS;
  const email = process.env.NEXT_PUBLIC_OPERATOR_EMAIL;
  const complete = !!(name && address && email);
  return (
    <Container>
      <PageHeader title="Impressum" />
      {!complete && (
        <div role="note" className="mb-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-sun bg-sun-soft p-4 text-ink">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>Vor dem öffentlichen Launch ausfüllen:</strong> Die Betreiberangaben fehlen noch. Setze <code>NEXT_PUBLIC_OPERATOR_NAME</code>,{" "}
            <code>NEXT_PUBLIC_OPERATOR_ADDRESS</code> und <code>NEXT_PUBLIC_OPERATOR_EMAIL</code> und lasse das Impressum rechtlich prüfen (§ 5 DDG). Es werden bewusst
            keine erfundenen Angaben angezeigt.
          </p>
        </div>
      )}
      <div className="prose-zs">
        <h2>Angaben gemäß § 5 DDG</h2>
        {complete ? (
          <>
            <p>
              {name}
              <br />
              {address?.split(";").map((l, i) => (
                <span key={i}>
                  {l.trim()}
                  <br />
                </span>
              ))}
            </p>
            <h2>Kontakt</h2>
            <p>
              E-Mail: <a href={`mailto:${email}`}>{email}</a>
            </p>
          </>
        ) : (
          <p>[Name und Anschrift des Betreibers – noch nicht hinterlegt]</p>
        )}
        <p className="text-sm text-ink-soft">Weitere Pflichtangaben (z. B. Vertretungsberechtigte, Registereintrag, Umsatzsteuer-ID) sind je nach Rechtsform zu ergänzen.</p>
      </div>
    </Container>
  );
}
