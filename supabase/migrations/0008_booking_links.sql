-- ==========================================================================
-- Liens de planification personnalisés
-- consultant-notion.fr
--
-- Théo crée un lien court (/r/<code>) pour un prospect démarché : prénom, nom
-- et e-mail sont pré-remplis, les questions de qualification sont masquées, et
-- il attache une source d'acquisition (→ « Canal d'acquisition » CRM) et une
-- URL LinkedIn (→ « LinkedIn » CRM). Le prospect n'a qu'à choisir un créneau.
--
-- RLS activé sans policy : accès uniquement via service_role (server-only).
-- ==========================================================================

create table if not exists public.booking_links (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,            -- code court tapé dans l'URL /r/<code>
  first_name   text not null,
  last_name    text not null,
  email        text not null,
  acq_source   text,                            -- texte libre -> « Canal d'acquisition »
  linkedin_url text,                            -- -> propriété « LinkedIn » (url) du CRM
  created_at   timestamptz not null default now(),
  used_at      timestamptz,                     -- 1re conversion
  booking_id   uuid references public.bookings(id) on delete set null
);

create index if not exists booking_links_code_idx
  on public.booking_links (code);

alter table public.booking_links enable row level security;
