-- 0009 — Archivage manuel des entrées du journal (funnel_sessions).
-- Permet de masquer certaines entrées du journal /admin sans les supprimer.

alter table public.funnel_sessions
  add column if not exists archived_at timestamptz;

-- Index partiel : la vue par défaut ne liste que les entrées NON archivées.
create index if not exists funnel_sessions_active_idx
  on public.funnel_sessions (created_at desc)
  where archived_at is null;
