-- ==========================================================================
-- Booker maison — schéma de base (settings + bookings)
-- consultant-notion.fr
--
-- Principes :
--   - Stockage TOUJOURS en UTC (timestamptz). Aucune arithmétique d'offset
--     manuelle : les conversions se font côté app avec Luxon.
--   - Pas de Supabase Auth : l'accès se fait exclusivement côté serveur via la
--     service_role key. RLS est activé SANS policy => tout accès anon/authenticated
--     est refusé par défaut (le service_role bypass RLS).
-- ==========================================================================

-- gen_random_uuid() vient de pgcrypto (déjà installé côté extensions).
create extension if not exists pgcrypto with schema extensions;
-- moddatetime : met à jour automatiquement updated_at.
create extension if not exists moddatetime with schema extensions;

-- --------------------------------------------------------------------------
-- Table settings : ligne unique de configuration, éditée depuis l'admin.
-- --------------------------------------------------------------------------
create table if not exists public.settings (
  id                    int primary key default 1,
  call_duration_min     int  not null default 60,
  slot_granularity_min  int  not null default 30,
  buffer_before_min     int  not null default 0,
  buffer_after_min      int  not null default 10,
  min_notice_hours      int  not null default 24,
  max_advance_days      int  not null default 21,
  max_per_day           int  not null default 3,
  weekly_availability   jsonb not null default '{}'::jsonb,
  host_timezone         text not null default 'Europe/Paris',
  reminder_hours_before int  not null default 3,
  sender_from           text not null default 'rdv@consultant-notion.fr',
  reply_to              text not null default 'theo@gouman.fr',
  updated_at            timestamptz not null default now(),
  -- Ligne unique : id figé à 1.
  constraint settings_singleton check (id = 1)
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function extensions.moddatetime(updated_at);

-- --------------------------------------------------------------------------
-- Table bookings : une réservation = une ligne. Source de vérité.
-- --------------------------------------------------------------------------
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  start_utc        timestamptz not null,
  end_utc          timestamptz not null,
  lead_timezone    text not null,
  lead_name        text not null,
  lead_email       text not null,
  guest_email      text,
  activity         text not null,
  situation        text not null,
  motivation       text not null,
  status           text not null default 'confirmed'
                     check (status in ('confirmed', 'cancelled', 'pending_manual')),
  google_event_id  text,
  meet_url         text,
  manage_token     text not null unique,
  ics_sequence     int  not null default 0,
  reminder_sent_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function extensions.moddatetime(updated_at);

-- Anti-double-booking : un seul créneau confirmé par start_utc.
-- Le second INSERT concurrent échoue (=> message « créneau vient d'être pris »).
create unique index if not exists one_active_booking_per_slot
  on public.bookings (start_utc)
  where status = 'confirmed';

-- Accès rapides côté app.
create index if not exists bookings_status_start_idx
  on public.bookings (status, start_utc);
create index if not exists bookings_manage_token_idx
  on public.bookings (manage_token);

-- --------------------------------------------------------------------------
-- Sécurité : RLS activé, aucune policy => tout accès public refusé.
-- L'app accède uniquement via la service_role key (server-only).
-- --------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.bookings enable row level security;

-- --------------------------------------------------------------------------
-- Seed : ligne settings unique + planning de départ (heure host, Europe/Paris).
-- Lun–Ven 09:00–12:00 et 14:00–18:00. Week-end fermé. Éditable en admin ensuite.
-- --------------------------------------------------------------------------
insert into public.settings (id, weekly_availability)
values (
  1,
  '{
    "mon": [{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}],
    "tue": [{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}],
    "wed": [{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}],
    "thu": [{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}],
    "fri": [{"start":"09:00","end":"12:00"},{"start":"14:00","end":"18:00"}],
    "sat": [],
    "sun": []
  }'::jsonb
)
on conflict (id) do nothing;
