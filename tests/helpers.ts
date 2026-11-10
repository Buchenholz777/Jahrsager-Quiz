import { createMemoryDb, type Db } from "@/server/db/client";
import { seedDemo } from "@/server/seed";
import { todayKey } from "@/server/clock";
import { createEvent, emptyEventInput } from "@/server/services/events";
import type { EventInput } from "@/server/types";

/** Mittag in Berlin am 8. November 2026 (Winterzeit). */
export const NOON = new Date("2026-11-08T11:00:00Z");
export const TODAY = todayKey(NOON);

export async function freshDb(): Promise<Db> {
  const db = await createMemoryDb();
  await seedDemo(db, TODAY, { writeImages: false });
  return db;
}

export async function newPlayer(db: Db): Promise<string> {
  return (await db.one<{ id: string }>("insert into players default values returning id"))!.id;
}

export function eventInput(over: Partial<EventInput> = {}): EventInput {
  const n = Math.random().toString(36).slice(2, 8);
  return {
    ...emptyEventInput(),
    slug: `test-${n}`,
    category: "politik",
    neutral_title: "Eine Szene auf dem Platz",
    description:
      "Menschen versammeln sich auf einem großen Platz und hören einem Redner zu. Fahnen wehen im Wind, und viele Zuschauer halten ihre Kameras in die Höhe. Der Anlass wird später viel diskutiert und prägt die Erinnerung an diese Zeit.",
    image_alt: "Platzhalter: Menschenmenge auf einem Platz",
    image_credit_short: "Platzhalter",
    correct_year: 1960,
    public_title: "Testereignis",
    explanation_what: "Was geschah.",
    explanation_why: "Warum es wichtig war.",
    explanation_detail: "Ein Detail.",
    sources: [{ label: "Quelle", url: "https://example.org/quelle" }],
    research: { bedeutung: { verdict: "weltgeschichtlich", reason: "Das Testereignis veränderte nachweislich die Verhältnisse in mehreren Ländern und markiert einen Wendepunkt.", checkedBy: "admin" } },
    image_id: "phtest",
    image_ext: "svg",
    image_width: 1200,
    image_height: 800,
    image_is_placeholder: true,
    image_credit_full: "Platzhalter",
    image_license: "Eigene Grafik",
    image_source_url: "n/a",
    checks: { rights: true, facts: true, photoMatchesEvent: true },
    image_status: "freigegeben",
    is_demo: true,
    ...over,
  };
}

export async function makeEvents(db: Db, cats = ["politik", "technik", "sport", "kultur", "wissenschaft"]) {
  const out = [];
  for (const [i, c] of cats.entries()) {
    out.push(await createEvent(db, eventInput({ category: c, correct_year: 1920 + i * 10 })));
  }
  return out;
}
