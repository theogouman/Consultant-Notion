-- ==========================================================================
-- Booker maison — synchronisation Notion (CRM + notes de réunion)
-- consultant-notion.fr
--
-- On mémorise, par réservation, les IDs des pages Notion créées, pour pouvoir
-- les mettre à jour / archiver ensuite (reprogrammation, annulation).
-- Sync best-effort : ces colonnes restent NULL si Notion n'est pas configuré
-- ou si la sync a échoué (à rattraper). `notion_sync_error` trace le dernier
-- échec pour le suivi.
-- ==========================================================================

alter table public.bookings
  add column if not exists crm_page_id       text,
  add column if not exists meeting_page_id    text,
  add column if not exists notion_synced_at   timestamptz,
  add column if not exists notion_sync_error  text;
