import type { Db } from "../db/client";
import { now as clockNow, todayKey } from "../clock";
import { demoAllowed, publishDuePacks } from "./packs";

export interface ShowcaseEvent {
  slug: string;
  title: string;
  year: number;
  category: string;
  knowledge: boolean;
  alt: string;
  creditShort: string;
  license: string;
  licenseUrl: string;
  image: { id: string; ext: string; width: number; height: number };
}

/** Bevorzugte Motive für die Bildkomposition (Vielfalt: Raumfahrt, Luftfahrt, Politik, Gesellschaft). */
const HERO_ORDER = ["apollo-11-mondlandung", "erster-motorflug-der-brueder-wright", "mauerbau-in-berlin", "kennedy-in-berlin", "hubble-teleskop-ausgesetzt"];
const TEASER_ORDER = ["wunder-von-bern", "hubble-teleskop-ausgesetzt", "sonnenfinsternis-expedition", "kennedy-in-berlin", "fliessband-bei-ford", "vorstellung-des-ersten-iphone", "live-aid"];

/**
 * Ereignisse mit echtem Foto für Startseite (Bildkomposition, Teaser) – ohne Platzhalter und ohne Spoiler:
 *  - nur Ereignisse, die bereits veröffentlicht sind UND in keinem heutigen oder zukünftigen Tagespaket vorkommen,
 *  - Produktionsinhalte nur mit Bildstatus „freigegeben“,
 *  - Demo-Inhalte nur, wenn ALLOW_DEMO_CONTENT=true (dort bleibt der Bildstatus „noch zu prüfen“ dokumentiert).
 * Gibt es keine geeigneten Ereignisse, bleiben die Listen leer (die Seite zeigt dann keine Bilder, keine Platzhalter).
 */
export async function getShowcase(db: Db, at: Date = clockNow()): Promise<{ hero: ShowcaseEvent[]; teaser: ShowcaseEvent[] }> {
  const today = todayKey(at);
  await publishDuePacks(db, today);
  const rows = await db.query<{
    slug: string;
    public_title: string;
    correct_year: number;
    category: string;
    knowledge_enabled: boolean;
    image_alt: string;
    image_credit_short: string;
    image_license: string;
    image_license_url: string;
    image_id: string;
    image_ext: string;
    image_width: number;
    image_height: number;
    past: boolean;
  }>(
    `select e.slug, e.public_title, e.correct_year, e.category, e.knowledge_enabled, e.image_alt, e.image_credit_short,
            e.image_license, e.image_license_url, e.image_id, e.image_ext, e.image_width, e.image_height,
            exists (select 1 from daily_pack_events pe join daily_packs p on p.id = pe.pack_id where pe.event_id = e.id and p.pack_date < $1) as past
     from events e
     where e.image_id is not null and not e.image_is_placeholder and not e.blocked
       and ((not e.is_demo and e.image_status = 'freigegeben') or (e.is_demo and $2::boolean))
       and (
         (e.status = 'veroeffentlicht' and exists (select 1 from daily_pack_events pe join daily_packs p on p.id = pe.pack_id where pe.event_id = e.id and p.pack_date < $1))
         or (e.homepage_showcase and e.status in ('freigegeben', 'veroeffentlicht'))
       )
       and not exists (select 1 from daily_pack_events pe join daily_packs p on p.id = pe.pack_id where pe.event_id = e.id and p.pack_date >= $1)`,
    [today, demoAllowed()],
  );
  const all: ShowcaseEvent[] = rows.map((r) => ({
    slug: r.slug,
    title: r.public_title,
    year: r.correct_year,
    category: r.category,
    knowledge: r.knowledge_enabled && r.past, // Wissensseite gibt es erst nach einem vergangenen Tagesrätsel
    alt: r.image_alt,
    creditShort: r.image_credit_short,
    license: r.image_license,
    licenseUrl: r.image_license_url,
    image: { id: r.image_id, ext: r.image_ext, width: r.image_width, height: r.image_height },
  }));
  const rank = (order: string[]) => (e: ShowcaseEvent) => (order.includes(e.slug) ? order.indexOf(e.slug) : 99);
  const hero = [...all].sort((a, b) => rank(HERO_ORDER)(a) - rank(HERO_ORDER)(b)).slice(0, 4);
  const heroSlugs = new Set(hero.map((h) => h.slug));
  const teaser = all
    .filter((e) => e.knowledge && !heroSlugs.has(e.slug))
    .sort((a, b) => rank(TEASER_ORDER)(a) - rank(TEASER_ORDER)(b))
    .slice(0, 3);
  return { hero, teaser };
}
