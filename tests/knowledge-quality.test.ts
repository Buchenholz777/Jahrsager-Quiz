import { describe, expect, it } from "vitest";
import { knowledgeQuality } from "@/server/services/knowledge-quality";
import { eventInput } from "./helpers";

const w = (n: number) => Array.from({ length: n }, (_, i) => "wort" + String.fromCharCode(97 + (i % 26))).join(" ");
const good = () => ({
  ...eventInput(),
  blocked: false,
  is_demo: false,
  image_status: "freigegeben" as const,
  image_is_placeholder: false,
  image_id: "imx",
  image_width: 2000,
  image_height: 1300,
  image_alt: "Foto",
  image_credit_full: "NASA",
  image_license: "Public domain",
  image_source_url: "https://commons.wikimedia.org/wiki/File:x.jpg",
  checks: { rights: true, facts: true, photoMatchesEvent: true },
  sources: [{ label: "A", url: "https://nasa.gov/a" }, { label: "B", url: "https://archives.gov/b" }],
  explanation_what: w(70),
  explanation_why: w(30),
  explanation_detail: w(20),
  background: w(120),
});

describe("Qualitätsschranke Wissensseiten", () => {
  it("gibt vollständige, textstarke Seiten frei", () => {
    const q = knowledgeQuality(good());
    expect(q.problems).toEqual([]);
    expect(q.indexable).toBe(true);
  });
  it("sperrt dünne Seiten (nur Quizauflösung) für die Indexierung", () => {
    const q = knowledgeQuality({ ...good(), background: "" });
    expect(q.indexable).toBe(false);
    expect(q.problems.join(" ")).toMatch(/Hintergrund/);
  });
  it("sperrt bei fehlenden Nachweisen, Demo, Sperre, kleinem Bild und zu wenig Quellen", () => {
    expect(knowledgeQuality({ ...good(), checks: { rights: false, facts: true } }).indexable).toBe(false);
    expect(knowledgeQuality({ ...good(), is_demo: true }).indexable).toBe(false);
    expect(knowledgeQuality({ ...good(), blocked: true }).indexable).toBe(false);
    expect(knowledgeQuality({ ...good(), image_width: 800, image_height: 600 }).indexable).toBe(false);
    expect(knowledgeQuality({ ...good(), sources: [{ label: "A", url: "https://nasa.gov/a" }] }).indexable).toBe(false);
    expect(knowledgeQuality({ ...good(), image_credit_full: "" }).indexable).toBe(false);
  });
});
