-- ==========================================================================
-- Canal d'acquisition — origine du lead (paramètres d'URL `source` et `post`)
-- consultant-notion.fr
--
-- Le site capture `?source=` / `?post=` à l'arrivée sur la landing, les
-- conserve le temps de l'onglet, puis les enregistre ici à la réservation.
-- La valeur formatée « source⎜post » est ensuite poussée dans la propriété
-- « Canal d'acquisition » du CRM Notion et rappelée dans la notification
-- interne.
--
-- Colonnes nullables : une réservation sans attribution (accès direct) reste
-- parfaitement valide.
-- ==========================================================================

alter table public.bookings
  add column if not exists acq_source text,
  add column if not exists acq_post   text;

comment on column public.bookings.acq_source is
  'Paramètre d''URL `source` capturé à l''arrivée (ex. linkedin). NULL si accès direct.';
comment on column public.bookings.acq_post is
  'Paramètre d''URL `post` capturé à l''arrivée (ex. carrousel-notion-crm). NULL si absent.';

-- Lecture des stats d'acquisition (« combien de RDV via LinkedIn ce mois-ci ? »).
create index if not exists bookings_acq_source_idx
  on public.bookings (acq_source)
  where acq_source is not null;
