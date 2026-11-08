-- SQL-über-HTTPS für Cloudflare Workers: Die App ruft diese Funktion über die Supabase-Data-API (RPC) auf,
-- weil eine direkte, verschlüsselte Postgres-Verbindung von Workers zu Supabase dort nicht zuverlässig funktioniert.
-- Aufrufbar nur mit dem geheimen Schlüssel (service_role); anon/authenticated haben keinen Zugriff.
create or replace function public.app_sql(stmts jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s jsonb; q text; p jsonb; i int; rec record;
  result jsonb := '[]'::jsonb; rws jsonb; n bigint;
begin
  for s in select * from jsonb_array_elements(stmts) loop
    q := s->>'sql';
    p := coalesce(s->'params', '[]'::jsonb);
    for i in reverse jsonb_array_length(p) .. 1 loop
      q := replace(q, '$' || i, quote_nullable(p->>(i - 1)));
    end loop;
    rws := '[]'::jsonb;
    n := 0;
    if q ~* '^\s*(select|with|values|table)\y' or q ~* '\yreturning\y' then
      for rec in execute q loop
        rws := rws || to_jsonb(rec);
        n := n + 1;
      end loop;
    else
      execute q;
      get diagnostics n = row_count;
    end if;
    result := result || jsonb_build_array(jsonb_build_object('rows', rws, 'count', n));
  end loop;
  return result;
end $$;

-- Rollen anon/authenticated/service_role gibt es nur bei Supabase (nicht in der lokalen PGlite-Entwicklungsdatenbank).
do $$
begin
  revoke all on function public.app_sql(jsonb) from public;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.app_sql(jsonb) from anon, authenticated;
    revoke all on all tables in schema public from anon, authenticated;
    grant execute on function public.app_sql(jsonb) to service_role;
  end if;
end $$;
