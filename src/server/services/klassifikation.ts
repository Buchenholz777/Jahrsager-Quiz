/** Zuordnung der bereits vorhandenen Ereignisse zu den zwölf Themenfeldern samt Vielfalts-Metadaten (Stand 9. November 2026). */
export interface Klass {
  category: string;
  subcategory: string;
  region: string;
  country: string;
  tags: string[];
  topic_key: string;
}
const k = (category: string, subcategory: string, region: string, country: string, topic_key: string, ...tags: string[]): Klass => ({ category, subcategory, region, country, tags, topic_key });

export const KLASSIFIKATION: Record<string, Klass> = {
  "suedpol-amundsen-1911": k("entdeckung", "Polarforschung", "global", "", "polarexpedition", "polarforschung", "expedition", "antarktis"),
  "lindbergh-paris-1927": k("technik", "Luftfahrt", "europa", "Frankreich", "luftfahrt-pioniere", "luftfahrt", "atlantik", "flug"),
  "jesse-owens-1936": k("sport", "Olympische Spiele", "europa", "Deutschland", "olympia-1936", "olympia", "leichtathletik"),
  "berliner-luftbruecke-1948": k("politik", "Kalter Krieg", "europa", "Deutschland", "luftbruecke", "kalter-krieg", "berlin", "luftbruecke"),
  "marsch-washington-1963": k("gesellschaft", "Bürgerrechte", "nordamerika", "USA", "us-buergerrechte", "buergerrechte", "demonstration"),
  "nixon-ruecktritt-1974": k("politik", "Watergate", "nordamerika", "USA", "watergate", "watergate", "praesident", "ruecktritt"),
  "shuttle-columbia-start-1981": k("raumfahrt", "Space Shuttle", "nordamerika", "USA", "space-shuttle", "raumfahrt", "space-shuttle"),
  "hubble-start-1990": k("raumfahrt", "Astronomie", "nordamerika", "USA", "hubble", "raumfahrt", "teleskop"),
  "humangenom-entwurf-2000": k("wissenschaft", "Genetik", "nordamerika", "USA", "humangenom", "genetik", "genom", "medizin"),
  "frauen-ausseneinsatz-iss-2019": k("raumfahrt", "Raumstation", "global", "", "iss-ausseneinsatz", "raumfahrt", "iss", "frauen"),
  "landung-in-der-normandie-1944": k("politik", "Zweiter Weltkrieg", "europa", "Frankreich", "d-day", "weltkrieg", "invasion", "d-day"),
  "apollo-11-1969": k("raumfahrt", "Mondprogramm", "nordamerika", "USA", "apollo", "raumfahrt", "apollo", "mond"),
  "apollo-17-1972": k("raumfahrt", "Mondprogramm", "nordamerika", "USA", "apollo", "raumfahrt", "apollo", "mond"),
  "voyager-1-1977": k("raumfahrt", "Raumsonden", "nordamerika", "USA", "raumsonden", "raumfahrt", "raumsonde"),
  "cassini-huygens-1997": k("raumfahrt", "Raumsonden", "global", "", "raumsonden", "raumfahrt", "raumsonde", "saturn"),
  "space-shuttle-challenger-1986": k("raumfahrt", "Space Shuttle", "nordamerika", "USA", "space-shuttle", "raumfahrt", "space-shuttle", "unglueck"),
};
