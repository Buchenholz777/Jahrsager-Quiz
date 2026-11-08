-- Privater Bucket für Ereignisbilder (nur bei Supabase vorhanden; lokal/PGlite gibt es kein Schema "storage").
-- Ausgeliefert wird ausschließlich über /bild/[id] (Zugriffsprüfung gegen Spoiler); kein öffentlicher Zugriff.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('zeitspur-images', 'zeitspur-images', false, 15728640)
    on conflict (id) do nothing;
  end if;
end $$;
