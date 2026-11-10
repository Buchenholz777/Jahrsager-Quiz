import { describe, expect, it } from "vitest";
import { buildAttribution, classifyEdits, missingRights, type ImageRights } from "@/lib/bildrechte";
import { assess, buildRights } from "@/server/pipeline/evaluate";
import { autoLicenseClasses, ccByProvenance, evaluateLicense, licenseUsable, parseCreativeCommons, sameDay, type CommonsMeta } from "@/server/pipeline/license";

const EVENT = "2004-05-01";

/** Eine vollständig regelkonforme CC-BY-4.0-Datei einer Institution (Basis für Abwandlungen). */
const institution = (over: Partial<CommonsMeta> = {}): CommonsMeta => ({
  file: "Beispiel.jpg",
  pageUrl: "https://commons.wikimedia.org/wiki/File:Beispiel.jpg",
  url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Beispiel.jpg",
  width: 3000,
  height: 2000,
  mime: "image/jpeg",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0",
  artist: "Anna Beispiel, Finnish Heritage Agency",
  credit: "Finnish Heritage Agency",
  dateOriginal: "2004-05-01",
  copyrighted: true,
  restrictions: "",
  categories: [],
  attribution: "Anna Beispiel, Finnish Heritage Agency, CC BY 4.0",
  attributionRequired: true,
  ...over,
});

const ownWork = (over: Partial<CommonsMeta> = {}): CommonsMeta =>
  institution({ artist: "Max Mustermann", credit: "Own work", attribution: "Max Mustermann", attributionRequired: true, ...over });

describe("CC BY 4.0: Regeln und Herkunft", () => {
  it("erkennt Lizenzfamilie und Version", () => {
    expect(parseCreativeCommons("CC BY 4.0", "https://creativecommons.org/licenses/by/4.0")).toEqual({ family: "by", version: "4.0" });
    expect(parseCreativeCommons("CC BY-SA 3.0", "")).toEqual({ family: "by-sa", version: "3.0" });
    expect(parseCreativeCommons("CC BY 2.0", "")).toEqual({ family: "by", version: "2.0" });
    expect(parseCreativeCommons("CC BY", "")).toEqual({ family: "other", version: "" });
    expect(parseCreativeCommons("Public domain", "")).toBeNull();
  });

  it("alle Regeln erfüllt, aber Automatik aus: zusätzliche Rechteprüfung statt Freigabe", () => {
    const d = evaluateLicense(institution(), { eventYear: 2004, eventDate: EVENT });
    expect(d).toMatchObject({ allowed: false, manual: true, rulesMet: true, licenseClass: "cc-by-4.0" });
    expect(d.basis).toContain("Institutionelle Herkunft");
    expect(licenseUsable(institution(), 2004, EVENT)).toBe(true); // Bildsuche darf es finden
  });

  it("Automatik standardmäßig AUS, nur mit ausdrücklichem Schalter AN", () => {
    expect(autoLicenseClasses({})).not.toContain("cc-by-4.0");
    expect(autoLicenseClasses({ AUTO_APPROVE_CC_BY_4: "false" })).not.toContain("cc-by-4.0");
    expect(autoLicenseClasses({ AUTO_APPROVE_CC_BY_4: "true" })).toContain("cc-by-4.0");
    const on = evaluateLicense(institution(), { eventYear: 2004, eventDate: EVENT, auto: autoLicenseClasses({ AUTO_APPROVE_CC_BY_4: "true" }) });
    expect(on).toMatchObject({ allowed: true, manual: false, licenseClass: "cc-by-4.0" });
  });

  it("Institution allein genügt nicht: weniger als zwei unabhängige Bestätigungen => keine Regelerfüllung", () => {
    const m = institution({ artist: "Finnish Heritage Agency", credit: "Museum", dateOriginal: "2004", attributionRequired: null, attribution: "" });
    const p = ccByProvenance(m, { eventYear: 2004, eventDate: EVENT });
    expect(p.ok).toBe(false);
    expect(p.problems.join(" ")).toContain("Grundlage allein genügt nicht");
  });

  it("„Eigenes Werk“: nur ab 1995, am Ereignistag, mit benanntem Urheber und Bestätigungen", () => {
    expect(ccByProvenance(ownWork(), { eventYear: 2004, eventDate: EVENT }).ok).toBe(true);
    // Ereignis vor 1995
    expect(ccByProvenance(ownWork({ dateOriginal: "1969-07-20" }), { eventYear: 1969, eventDate: "1969-07-20" }).ok).toBe(false);
    // falscher Aufnahmetag (nur Jahr)
    expect(ccByProvenance(ownWork({ dateOriginal: "2004" }), { eventYear: 2004, eventDate: EVENT }).ok).toBe(false);
    // Urheber unbekannt
    expect(ccByProvenance(ownWork({ artist: "Unknown author" }), { eventYear: 2004, eventDate: EVENT }).ok).toBe(false);
    // nur ein Einzelname und keine Attribution: zu wenige Bestätigungen
    const weak = ownWork({ artist: "Max", attribution: "", attributionRequired: null });
    expect(ccByProvenance(weak, { eventYear: 2004, eventDate: EVENT }).ok).toBe(false);
  });

  it("fehlender Urheber, fehlende Quelle, fehlender Lizenzlink, falsche Version", () => {
    const ctx = { eventYear: 2004, eventDate: EVENT };
    expect(ccByProvenance(institution({ artist: "" }), ctx).problems.join(" ")).toContain("Urheber");
    expect(ccByProvenance(institution({ pageUrl: "" }), ctx).problems.join(" ")).toContain("Originalquelle");
    expect(ccByProvenance(institution({ url: "" }), ctx).problems.join(" ")).toContain("Original-Datei-URL");
    expect(ccByProvenance(institution({ licenseUrl: "" }), ctx).problems.join(" ")).toContain("Link zum Lizenztext");
    expect(ccByProvenance(institution({ license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0" }), ctx).problems.join(" ")).toContain("CC BY 4.0");
  });

  it("widersprüchliche Rechteinformationen führen nie zur Regelerfüllung", () => {
    const ctx = { eventYear: 2004, eventDate: EVENT };
    // Commons: „nicht urheberrechtlich geschützt“, aber CC BY
    expect(ccByProvenance(institution({ copyrighted: false }), ctx).ok).toBe(false);
    // Agentur im Credit
    expect(ccByProvenance(institution({ credit: "Getty Images" }), ctx).ok).toBe(false);
    // zusätzliche Einschränkung
    expect(ccByProvenance(institution({ restrictions: "personality rights" }), ctx).ok).toBe(false);
    expect(evaluateLicense(institution({ restrictions: "trademarked" }), { eventYear: 2004, eventDate: EVENT })).toMatchObject({ allowed: false, manual: true, rulesMet: false });
  });

  it("Tagesvergleich versteht ISO- und Textdaten", () => {
    expect(sameDay("2004-05-01", "2004-05-01")).toBe(true);
    expect(sameDay("1 May 2004", "2004-05-01")).toBe(true);
    expect(sameDay("1. Mai 2004", "2004-05-01")).toBe(true);
    expect(sameDay("21 May 2004", "2004-05-01")).toBe(false);
    expect(sameDay("2004", "2004-05-01")).toBe(false);
  });
});

describe("Weitere Lizenzen", () => {
  const ctx = { eventYear: 2004, eventDate: EVENT };
  it("CC BY 2.0/3.0 und BY-SA sind erkannt, aber nie unbeaufsichtigt freigegeben (auch nicht mit eingeschalteter CC-BY-4.0-Automatik)", () => {
    const auto = autoLicenseClasses({ AUTO_APPROVE_CC_BY_4: "true" });
    for (const [lic, url] of [
      ["CC BY 2.0", "https://creativecommons.org/licenses/by/2.0"],
      ["CC BY 3.0", "https://creativecommons.org/licenses/by/3.0"],
      ["CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0"],
      ["CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0"],
    ]) {
      const d = evaluateLicense(institution({ license: lic, licenseUrl: url }), { ...ctx, auto });
      expect(d.allowed, lic).toBe(false);
      expect(d.manual, lic).toBe(true);
    }
  });
  it("NC/ND und andere ungeeignete Lizenzen bleiben ausgeschlossen", () => {
    for (const lic of ["CC BY-NC 4.0", "CC BY-ND 4.0", "CC BY-NC-SA 3.0", "Fair use", "All rights reserved", "Non-free"]) {
      expect(evaluateLicense(institution({ license: lic, licenseUrl: "" }), ctx), lic).toMatchObject({ allowed: false, manual: false });
    }
    expect(evaluateLicense(institution({ license: "" }), ctx)).toMatchObject({ allowed: false, manual: false });
  });
  it("unklares Public Domain gilt nicht als Nachweis", () => {
    const d = evaluateLicense(institution({ license: "Public domain", licenseUrl: "", artist: "Unbekannt", credit: "Archiv", copyrighted: false }), ctx);
    expect(d).toMatchObject({ allowed: false, manual: true });
    expect(d.reasons.join(" ")).toContain("Unklare Public-Domain");
  });
  it("CC0 und US-Regierungswerke bleiben automatisch freigabefähig", () => {
    expect(evaluateLicense(institution({ license: "CC0", licenseUrl: "", copyrighted: false }), ctx).allowed).toBe(true);
    expect(evaluateLicense(institution({ license: "Public domain", licenseUrl: "", artist: "NASA", credit: "NASA", copyrighted: false }), ctx).allowed).toBe(true);
  });
});

describe("Bildnachweis und Rechtedaten", () => {
  const lic = evaluateLicense(institution(), { eventYear: 2004, eventDate: EVENT });
  const rights = (over: Partial<ImageRights> = {}): ImageRights => ({ ...buildRights(institution({ title: "Fest in Helsinki" }), lic, classifyEdits([]), "auto"), ...over });

  it("erzeugt die Namensnennung mit Titel, Urheber, Quelle, Lizenz und Link", () => {
    const a = buildAttribution(rights());
    expect(a.missing).toEqual([]);
    expect(a.full).toContain("„Fest in Helsinki“");
    expect(a.full).toContain("Anna Beispiel");
    expect(a.full).toContain("https://commons.wikimedia.org/wiki/File:Beispiel.jpg");
    expect(a.full).toContain("CC BY 4.0 (https://creativecommons.org/licenses/by/4.0)");
    expect(a.short).toContain("CC BY 4.0");
  });
  it("Pflichtangaben fehlen => Liste der Lücken", () => {
    expect(missingRights(rights({ author: "" }))).toContain("Urheber");
    expect(missingRights(rights({ licenseUrl: "" }))).toContain("Link zum Lizenztext");
    expect(missingRights(rights({ licenseVersion: "" }))).toContain("Lizenzversion");
    expect(missingRights(rights({ originalSourceUrl: "" }))).toContain("Originalquelle");
    expect(missingRights(rights({ rightsCheckedAt: "" }))).toContain("Datum der Rechteprüfung");
    expect(missingRights(null)).toHaveLength(1);
    // CC0 braucht keine Namensnennung
    expect(missingRights(rights({ license: "CC0", author: "", licenseVersion: "", licenseUrl: "" }))).toEqual([]);
  });
  it("trennt technische Anpassungen von lizenzrelevanten Bearbeitungen und weist Zuschnitte aus", () => {
    const e = classifyEdits(["Auf 2000 px skaliert, in WebP konvertiert, Metadaten entfernt.", "Unterer Rand abgeschnitten (Zuschnitt)."]);
    expect(e.technical).toHaveLength(1);
    expect(e.licenseRelevant).toHaveLength(1);
    expect(buildAttribution(rights({ edits: e })).full).toContain("Bearbeitung: Unterer Rand abgeschnitten");
    expect(buildAttribution(rights()).full).not.toContain("Bearbeitung");
  });
  it("Rechteinhaber wird genannt, wenn er vom Urheber abweicht", () => {
    expect(buildAttribution(rights({ rightsHolder: "Stiftung X" })).full).toContain("Rechteinhaber: Stiftung X");
  });
});

describe("Gesamtentscheidung mit Rechtedaten", () => {
  const draft = null;
  const base = (meta: CommonsMeta, over = {}) => assess({ eventDate: EVENT, meta, wikipediaUrl: "https://de.wikipedia.org/wiki/X", externalSources: ["https://a.org/1", "https://b.net/2"], draft, duplicate: null, ...over });

  it("CC BY 4.0 (Regeln erfüllt) landet in „Zusätzliche Rechteprüfung“ und enthält vollständige Rechtedaten und Audit", () => {
    const a = base(institution());
    expect(a.decision).toBe("manual_review");
    expect(a.rights.status).toBe("rechtepruefung_erforderlich");
    expect(a.rights.licenseVersion).toBe("4.0");
    const steps = a.audit.map((x) => x.step);
    for (const s of ["lizenz", "bilddatei", "bearbeitung", "bildnachweis", "rechtepruefung"]) expect(steps).toContain(s);
    expect(a.rights.checkedBy).toBe("auto");
  });
  it("lizenzrelevante Bearbeitung verhindert die automatische Freigabe", () => {
    const a = base(institution({ license: "CC0", licenseUrl: "", copyrighted: false }), { edits: ["Zuschnitt: unteres Drittel entfernt"] });
    expect(a.decision).toBe("manual_review");
    expect(a.reasons.join(" ")).toContain("zugeschnitten");
  });
  it("CC0 ohne Bearbeitung bleibt automatisch freigabefähig mit Status „freigabefähig“", () => {
    const a = base(institution({ license: "CC0", licenseUrl: "", copyrighted: false, artist: "Jemand", credit: "Archiv" }));
    expect(a.rights.status).toBe("manual_review" === a.decision ? "rechtepruefung_erforderlich" : a.rights.status);
    expect(["auto_approved", "manual_review"]).toContain(a.decision); // ohne Textentwurf: manuell; Lizenz selbst ist erlaubt
    expect(a.audit.find((x) => x.step === "lizenz")!.decision).toBe("ok");
  });
  it("NC-Lizenz wird abgelehnt", () => {
    expect(base(institution({ license: "CC BY-NC 4.0" })).decision).toBe("rejected");
  });
});
