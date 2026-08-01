-- ==========================================================================
-- Booker maison — motifs d'annulation (questionnaire de rétention)
-- consultant-notion.fr
--
-- Table dédiée aux retours collectés quand un lead annule son rendez-vous.
-- Découplée de `bookings` : on garde l'historique des motifs même si la
-- réservation est supprimée (on delete set null), et une résa pourrait en
-- théorie être annulée/reprise plusieurs fois.
--
-- Sécurité : RLS activé SANS policy => accès anon/authenticated refusé.
-- L'app écrit uniquement via la service_role key (server-only).
-- ==========================================================================

create table if not exists public.cancellation_feedback (
  id                 uuid primary key default gen_random_uuid(),
  -- Lien vers la réservation (facultatif : conservé même si la résa disparaît).
  booking_id         uuid references public.bookings(id) on delete set null,
  -- Snapshot lead + créneau annulé (self-contained pour l'analyse).
  lead_name          text,
  lead_email         text,
  start_utc          timestamptz,
  -- Motif principal (1re question).
  reason             text not null
                       check (reason in ('not_available', 'other_consultant', 'better_tool', 'no_time')),
  -- Branche « meilleur outil ».
  better_tool        text
                       check (better_tool is null or better_tool in ('asana', 'clickup', 'custom_ai', 'other')),
  better_tool_other  text,
  better_tool_reason text,
  -- Branche « plus le temps ».
  wants_callback     boolean,
  callback_delay     text
                       check (callback_delay is null or callback_delay in ('1m', '3m', '6m')),
  created_at         timestamptz not null default now()
);

-- Analyse par motif.
create index if not exists cancellation_feedback_reason_idx
  on public.cancellation_feedback (reason);

-- Relances « rappelle-moi dans X mois » : retrouver rapidement les demandes.
create index if not exists cancellation_feedback_callback_idx
  on public.cancellation_feedback (callback_delay)
  where wants_callback = true;

alter table public.cancellation_feedback enable row level security;
