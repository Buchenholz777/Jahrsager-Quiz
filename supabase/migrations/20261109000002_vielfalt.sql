-- Vielfalt: Unterkategorie, Schlagwörter, Region, Land und Themenschlüssel (für Ähnlichkeitsprüfung) je Ereignis.
-- Das Jahrzehnt ergibt sich aus correct_year. Hauptkategorie bleibt events.category (jetzt zwölf Themenfelder plus Altwert „kultur“).
alter table events
  add column subcategory text not null default '',
  add column tags jsonb not null default '[]'::jsonb,
  add column region text not null default '' check (region in ('','europa','nordamerika','suedamerika','afrika','asien','ozeanien','global')),
  add column country text not null default '',
  add column topic_key text not null default '';
create index events_topic_key_idx on events(topic_key) where topic_key <> '';
