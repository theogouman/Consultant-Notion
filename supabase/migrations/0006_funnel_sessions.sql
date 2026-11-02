-- ==========================================================================
-- Tunnel de réservation — sessions & abandons
-- consultant-notion.fr
--
-- Capture la progression d'un visiteur dans le booker MÊME s'il ne confirme
-- jamais (abandon). Une ligne par session client (`sid`). Alimente :
--   - le journal /admin (tags abouti / non confirmé / abandonné),
--   - l'email interne « Un lead n'a pas confirmé » (balayage par le cron).
--
-- RLS activé sans policy : accès uniquement via service_role (server-only).
-- ==========================================================================

create table if not exists public.funnel_sessions (
  id             uuid primary key default gen_random_uuid(),
  sid            text not null unique,            -- id de session généré côté client
  status         text not null default 'in_progress'
                   check (status in ('in_progress', 'converted', 'abandoned')),
  step           text,                            -- slot_selected | form_started | form_completed | submitted
  lead_name      text,
  lead_email     text,
  activity       text,
  situation      text,
  motivation     text,
  lead_timezone  text,
  start_utc      timestamptz,                     -- créneau choisi (si atteint)
  acq_source     text,
  acq_post       text,
  link_code      text,                            -- si issu d'un lien personnalisé
  booking_id     uuid references public.bookings(id) on delete set null,
  notified_at    timestamptz,                     -- dédup de l'email d'abandon
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger funnel_sessions_set_updated_at
  before update on public.funnel_sessions
  for each row execute function extensions.moddatetime(updated_at);

-- Balayage des abandons : sessions en cours, inactives, non encore notifiées.
create index if not exists funnel_sessions_sweep_idx
  on public.funnel_sessions (updated_at)
  where status = 'in_progress' and notified_at is null;

-- Lecture du journal admin (récent d'abord).
create index if not exists funnel_sessions_created_idx
  on public.funnel_sessions (created_at desc);

alter table public.funnel_sessions enable row level security;

-- --------------------------------------------------------------------------
-- Purge RGPD : supprime les sessions de tunnel de plus de 6 mois.
-- (pg_cron déjà activé — cf. migration 0002. Idempotent : on déprogramme
--  d'abord un éventuel job existant du même nom.)
-- --------------------------------------------------------------------------
-- select cron.unschedule('funnel-purge-old');  -- si déjà présent
-- select cron.schedule(
--   'funnel-purge-old',
--   '45 3 * * *',
--   $$ delete from public.funnel_sessions where created_at < now() - interval '6 months'; $$
-- );
