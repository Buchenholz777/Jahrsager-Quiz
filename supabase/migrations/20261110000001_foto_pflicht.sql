-- Grundregel des Spiels: Ohne passendes Foto gibt es kein freigegebenes, eingeplantes oder veröffentlichtes Ereignis.
-- Zusätzliche Absicherung in der Datenbank (die Anwendung prüft dasselbe bereits vor der Freigabe).
create or replace function public.foto_pflicht() returns trigger language plpgsql as $$
begin
  if new.status in ('freigegeben', 'eingeplant', 'veroeffentlicht') and (new.image_id is null or new.image_ext is null) then
    raise exception 'Ereignis % ohne Foto kann nicht den Status % haben', new.slug, new.status using errcode = '23514';
  end if;
  return new;
end $$;

drop trigger if exists events_foto_pflicht on public.events;
create trigger events_foto_pflicht before insert or update of status, image_id, image_ext on public.events
  for each row execute function public.foto_pflicht();
