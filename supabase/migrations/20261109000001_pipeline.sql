-- Automatisiertes Redaktionssystem: Pipeline-Zustand, Prüfprotokoll, Sperre, Läufe.
-- Zuordnung zu den bestehenden Redaktionsstatus (events.status):
--   candidate/checking  -> (noch nicht angelegt bzw. nur während des Laufs)
--   auto_approved       -> status 'freigegeben' + pipeline_state 'auto_approved'
--   manual_review       -> status 'entwurf'      + pipeline_state 'manual_review'
--   rejected            -> nicht angelegt (pipeline_seen) bzw. gesperrt (blocked)
--   scheduled/published -> status 'eingeplant' / 'veroeffentlicht' (wie bisher)
alter table events
  add column pipeline_state text check (pipeline_state in ('candidate','checking','auto_approved','manual_review','rejected')),
  add column source_id text,
  add column blocked boolean not null default false,
  add column blocked_reason text not null default '',
  add column audit jsonb not null default '[]'::jsonb;
create unique index events_source_id_idx on events(source_id) where source_id is not null;

-- Bereits geprüfte Wikidata-Kandidaten (auch abgelehnte), damit sie nicht erneut recherchiert werden.
create table pipeline_seen (
  source_id text primary key,
  decision text not null,
  reason text not null default '',
  seen_at timestamptz not null default now()
);

create table pipeline_runs (
  id bigint generated always as identity primary key,
  kind text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  summary jsonb not null default '{}'::jsonb,
  error text not null default ''
);

alter table pipeline_seen enable row level security;
alter table pipeline_runs enable row level security;
