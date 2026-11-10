import { describe, expect, it } from "vitest";
import { analyseRejections, classifyReason } from "@/server/pipeline/ablehnungen";

describe("Ablehnungsgründe klassifizieren", () => {
  const cases: [string, string][] = [
    ["Lizenz „CC BY 4.0“ ist nicht in der Allowlist für automatische Freigabe.", "cc_by"],
    ["Urheberrechtlich geschützt (CC BY-SA 4.0); nicht in der Auto-Allowlist.", "cc_by_sa"],
    ["Urheberrechtlich geschützt (CC BY 3.0); nicht in der Auto-Allowlist.", "cc_by"],
    ["Nicht freie Lizenz: CC BY-NC 4.0", "lizenz"],
    ["Keine Lizenzangabe.", "lizenz"],
    ["CC BY 4.0: Regeln nicht vollständig erfüllt: Kein identifizierbarer Urheber bzw. Rechteinhaber.", "urheber"],
    ["CC BY 4.0: Regeln nicht vollständig erfüllt: Herkunft/Berechtigung zur Lizenzvergabe nicht nachvollziehbar.", "rechtekette"],
    ["Urheber-/Credit-Angabe enthält Copyright-Hinweis oder Agentur.", "rechtekette"],
    ["Public domain ohne Nachweis eines Regierungswerks: Rechtsgrundlage manuell prüfen.", "rechtekette"],
    ["Kein Aufnahmedatum in den Commons-Metadaten.", "aufnahmedatum"],
    ["Aufnahme (1962) stammt nicht aus dem Ereignisjahr (1969).", "aufnahmedatum"],
    ["Bildqualität nicht ausreichend.", "bild"],
    ["Bildkontrolle: Foto zeigt das Ereignis nicht.", "bild"],
    ["Weniger als 2 unabhängige Faktenquellen.", "quellen"],
    ["Dublette: apollo-11-1969", "dublette"],
    ["Ereignisjahr 1890 außerhalb 1900–2020.", "sonstige"],
  ];
  for (const [text, cat] of cases) it(`${cat}: ${text.slice(0, 48)}`, () => expect(classifyReason(text)).toBe(cat));

  it("wertet Kandidaten mit mehreren Gründen aus und trennt „theoretisch“ von „allein ausschlaggebend“", () => {
    const r = analyseRejections([
      { decision: "manual_review", reason: "Lizenz „CC BY 4.0“ ist nicht in der Allowlist für automatische Freigabe." },
      { decision: "manual_review", reason: "Lizenz „CC BY 4.0“ ist nicht in der Allowlist für automatische Freigabe. | Kein Aufnahmedatum in den Commons-Metadaten." },
      { decision: "rejected", reason: "Bildqualität nicht ausreichend." },
      { decision: "rejected", reason: "Nicht freie Lizenz: CC BY-NC 4.0" },
    ]);
    expect(r.total).toBe(4);
    expect(r.anyReason.cc_by).toBe(2);
    expect(r.soleReason.cc_by).toBe(1);
    expect(r.licenseOnlyTheoretical).toBe(1); // nur der erste Kandidat wäre allein durch die Lizenzpolitik blockiert
    expect(r.anyReason.aufnahmedatum).toBe(1);
    expect(r.soleReason.lizenz).toBe(1);
  });
});
