-- Party: Freunde spielen zeitversetzt denselben, bei der Erstellung festgelegten Aufgabensatz.
alter table games drop constraint if exists games_mode_check;
alter table games add constraint games_mode_check check (mode in ('daily', 'practice', 'party'));

create table parties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  pack_id uuid not null references daily_packs(id),
  -- fixierter Aufgabensatz (Ereignis und Fassung), unabhängig von späteren redaktionellen Änderungen
  rounds jsonb not null,
  creator_player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table party_members (
  party_id uuid not null references parties(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  joined_at timestamptz not null default now(),
  primary key (party_id, player_id)
);

alter table games add column party_id uuid references parties(id) on delete cascade;
-- Übungsspiele und Party-Spiele desselben Pakets dürfen nebeneinander laufen.
drop index if exists games_one_running_practice;
create unique index games_one_running_practice on games(player_id, pack_id) where not official and party_id is null and status = 'laufend';
create unique index games_one_per_party on games(player_id, party_id) where party_id is not null;

alter table parties enable row level security;
alter table party_members enable row level security;
