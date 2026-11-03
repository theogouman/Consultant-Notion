-- 0010 — Type de lien de planification : permanent ou ponctuel.
--
-- - « one_time » (ponctuel, défaut) : une fois l'appel réservé, revenir sur
--   l'URL ne permet plus de planifier un nouvel appel — on propose de MODIFIER
--   le créneau existant (vue de gestion du rendez-vous).
-- - « permanent » : le lien reste réutilisable (chaque visite peut planifier).

alter table public.booking_links
  add column if not exists kind text not null default 'one_time'
  check (kind in ('permanent', 'one_time'));
