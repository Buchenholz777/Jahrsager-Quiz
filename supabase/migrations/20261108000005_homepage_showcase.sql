-- Ausdrückliche Freigabe eines Ereignisses für die Startseite (Bildkomposition/Teaser), unabhängig vom Tagesrätsel.
-- Solche Ereignisse dürfen in kein Tagespaket eingeplant werden (sonst wäre die Lösung vorab sichtbar).
alter table events add column homepage_showcase boolean not null default false;
