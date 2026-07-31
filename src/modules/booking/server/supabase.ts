/**
 * Client Supabase server-only (service_role).
 *
 * ⚠️ Ne JAMAIS importer ce module côté client : la service_role key bypass RLS.
 * Toutes les tables du booker ont RLS activé sans policy => seul ce client
 * (server) peut lire/écrire.
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (variables d'environnement).",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
