-- Versionierte Tagespakete: Ein Paket für ein Datum kann durch eine neue Fassung ersetzt werden.
-- Bereits begonnene/abgeschlossene Partien behalten ihr ursprüngliches Paket (games.pack_id bleibt unverändert);
-- neue Partien nutzen die aktuelle (nicht ersetzte) Fassung. Je Datum ist genau eine Fassung aktiv.
do $$
declare c text;
begin
  select conname into c from pg_constraint where conrelid = 'daily_packs'::regclass and contype = 'u'
    and pg_get_constraintdef(oid) = 'UNIQUE (pack_date)';
  if c is not null then execute format('alter table daily_packs drop constraint %I', c); end if;
end $$;
alter table daily_packs add column revision int not null default 1, add column superseded_at timestamptz;
create unique index daily_packs_active_date on daily_packs(pack_date) where superseded_at is null;
