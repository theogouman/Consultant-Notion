-- ==========================================================================
-- Qualification optionnelle + LinkedIn
-- consultant-notion.fr
--
-- Les liens personnalisés (prospects démarchés par Théo) laissent les 3
-- questions de qualification VIDES : on relâche donc les contraintes NOT NULL
-- sur activity / situation / motivation. Le flux public reste strictement
-- validé côté application (validation.ts inchangée) ; seul le flux pré-rempli
-- insère des valeurs nulles.
--
-- On ajoute aussi `linkedin` (URL du profil, poussée dans la propriété
-- « LinkedIn » du CRM Notion).
-- ==========================================================================

alter table public.bookings alter column activity   drop not null;
alter table public.bookings alter column situation  drop not null;
alter table public.bookings alter column motivation drop not null;

alter table public.bookings
  add column if not exists linkedin text;

comment on column public.bookings.linkedin is
  'URL du profil LinkedIn (liens personnalisés). Poussée dans la propriété « LinkedIn » du CRM Notion. NULL sinon.';
