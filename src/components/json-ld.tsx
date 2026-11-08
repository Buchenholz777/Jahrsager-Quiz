/** Strukturierte Daten (Schema.org). Nur für tatsächlich passende Typen verwenden. */
export function JsonLd({ data }: { data: object | object[] }) {
  // "<" wird maskiert, damit keine Skript-Tags aus Inhalten ausbrechen können
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
