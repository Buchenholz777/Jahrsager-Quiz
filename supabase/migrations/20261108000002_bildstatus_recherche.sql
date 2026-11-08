-- Bildstatus und Rechercheblock je Ereignis.
-- image_status trennt: platzhalter (Entwicklungsbild) / recherchiert (Metadaten aus Archiv gesammelt,
-- noch nicht am Original geprüft) / zu_pruefen (offene Widersprüche oder Lücken) / freigegeben
-- (ein Mensch hat Bild, Quelle und Lizenz am Original geprüft).
alter table events
  add column image_status text not null default 'platzhalter'
    check (image_status in ('platzhalter','recherchiert','zu_pruefen','freigegeben')),
  add column research jsonb not null default '{}'::jsonb;
