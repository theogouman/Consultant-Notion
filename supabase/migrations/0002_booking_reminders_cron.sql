-- ==========================================================================
-- Rappel H-3 + purge RGPD — planification pg_cron -> endpoint sécurisé
-- consultant-notion.fr
--
-- ⚠️ NE PAS appliquer tel quel : cette migration dépend de
--   1) l'URL de production déployée (Vercel), et
--   2) de secrets stockés dans Supabase Vault (jamais en clair dans le repo).
--
-- Marche à suivre (une seule fois, après le premier déploiement) :
--
--   -- 1. Activer les extensions (déjà dispo sur le projet)
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
--   -- 2. Stocker l'URL de l'endpoint + le secret cron dans le Vault
--   --    (remplacer par les vraies valeurs ; le secret doit être IDENTIQUE
--   --     à la variable d'env Vercel CRON_SECRET).
--   select vault.create_secret(
--     'https://consultant-notion.fr/api/cron/reminders',
--     'booking_reminders_url'
--   );
--   select vault.create_secret(
--     '<CRON_SECRET identique à Vercel>',
--     'booking_cron_secret'
--   );
--
--   -- 3. Puis exécuter les blocs cron.schedule ci-dessous.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Rappel H-3 : toutes les 15 minutes, POST vers l'endpoint protégé.
-- L'endpoint sélectionne les bookings à rappeler et envoie via Resend.
-- --------------------------------------------------------------------------
select cron.schedule(
  'booking-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets
                where name = 'booking_reminders_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets
                        where name = 'booking_cron_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- --------------------------------------------------------------------------
-- Purge RGPD : chaque nuit, anonymise/supprime les réservations passées
-- de plus de 12 mois (plus aucune finalité de conservation).
-- --------------------------------------------------------------------------
select cron.schedule(
  'booking-purge-old',
  '30 3 * * *',
  $$
  delete from public.bookings
  where end_utc < now() - interval '12 months';
  $$
);

-- Pour retirer un job :  select cron.unschedule('booking-reminders');
