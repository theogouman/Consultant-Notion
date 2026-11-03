/**
 * Tunnel de réservation : suivi de progression + détection d'abandon.
 *
 * Le client (`BookingFlow`) émet une progression best-effort via une session
 * `sid`. On en déduit les abandons (sessions `in_progress` restées inactives,
 * avec un e-mail capté, jamais soumises) pour notifier Théo.
 *
 * Tout est best-effort : jamais bloquant pour la réservation.
 */

import "server-only";
import { getSupabaseAdmin } from "./supabase";
import { getSettings } from "./settings";
import { sendLeadNotConfirmed } from "./resend";
import type { FunnelLogEntry, FunnelPatch, FunnelSession } from "../types";

/** Fenêtre d'inactivité avant de considérer une session comme abandonnée. */
const ABANDON_AFTER_MIN = 25;

/** Upsert best-effort de la progression du tunnel (par `sid`). */
export async function trackFunnel(sid: string, patch: FunnelPatch): Promise<void> {
  if (!sid) return;
  try {
    const row: Record<string, unknown> = { sid };
    if (patch.step !== undefined) row.step = patch.step;
    if (patch.leadName !== undefined) row.lead_name = patch.leadName;
    if (patch.leadEmail !== undefined) row.lead_email = patch.leadEmail;
    if (patch.activity !== undefined) row.activity = patch.activity;
    if (patch.situation !== undefined) row.situation = patch.situation;
    if (patch.motivation !== undefined) row.motivation = patch.motivation;
    if (patch.leadTimezone !== undefined) row.lead_timezone = patch.leadTimezone;
    if (patch.startUtc !== undefined) row.start_utc = patch.startUtc;
    if (patch.acquisitionSource !== undefined) row.acq_source = patch.acquisitionSource;
    if (patch.acquisitionPost !== undefined) row.acq_post = patch.acquisitionPost;
    if (patch.linkCode !== undefined) row.link_code = patch.linkCode;

    const supabase = getSupabaseAdmin();
    await supabase.from("funnel_sessions").upsert(row, { onConflict: "sid" });
  } catch (err) {
    console.error("[funnel] trackFunnel échoué:", err);
  }
}

/** Marque une session comme convertie (réservation aboutie). Best-effort. */
export async function markFunnelConverted(
  sid: string | null | undefined,
  bookingId: string,
): Promise<void> {
  if (!sid) return;
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("funnel_sessions")
      .update({ status: "converted", step: "submitted", booking_id: bookingId })
      .eq("sid", sid);
  } catch (err) {
    console.error("[funnel] markFunnelConverted échoué:", err);
  }
}

/**
 * Balaye les sessions abandonnées : en cours, inactives depuis
 * ABANDON_AFTER_MIN, avec un e-mail capté, non encore notifiées. Les passe en
 * `abandoned` et envoie l'email interne « Un lead n'a pas confirmé ».
 * Renvoie le nombre de sessions notifiées.
 */
export async function sweepAbandonedFunnels(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - ABANDON_AFTER_MIN * 60_000).toISOString();

  const { data, error } = await supabase
    .from("funnel_sessions")
    .select("*")
    .eq("status", "in_progress")
    .is("notified_at", null)
    .not("lead_email", "is", null)
    .lt("updated_at", cutoff)
    .order("updated_at", { ascending: true })
    .limit(50);

  if (error) throw new Error(`Lecture abandons échouée: ${error.message}`);
  const sessions = (data ?? []) as FunnelSession[];
  if (sessions.length === 0) return 0;

  const settings = await getSettings();
  let notified = 0;

  for (const session of sessions) {
    // Verrou anti-doublon : on ne notifie que si le passage à abandoned réussit.
    const { data: locked, error: lockErr } = await supabase
      .from("funnel_sessions")
      .update({ status: "abandoned", notified_at: new Date().toISOString() })
      .eq("id", session.id)
      .is("notified_at", null)
      .select("id")
      .maybeSingle();
    if (lockErr || !locked) continue;

    try {
      await sendLeadNotConfirmed(session, settings);
      notified += 1;
    } catch (err) {
      console.error(`[funnel] email abandon échoué (${session.id}):`, err);
    }
  }

  return notified;
}

/** Archive une entrée de journal (la masque de la vue par défaut). Best-effort. */
export async function archiveFunnelSession(id: string): Promise<void> {
  if (!id) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("funnel_sessions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Archivage journal échoué: ${error.message}`);
}

/** Désarchive une entrée de journal. */
export async function unarchiveFunnelSession(id: string): Promise<void> {
  if (!id) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("funnel_sessions")
    .update({ archived_at: null })
    .eq("id", id);
  if (error) throw new Error(`Désarchivage journal échoué: ${error.message}`);
}

/** Journal admin : sessions récentes + statut réel du booking lié. */
export async function getFunnelLog(limit = 100): Promise<FunnelLogEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("funnel_sessions")
    .select("*, bookings(status)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Lecture journal tunnel échouée: ${error.message}`);

  return (data ?? []).map((row) => {
    const { bookings, ...rest } = row as FunnelSession & {
      bookings: { status: string } | null;
    };
    return {
      ...(rest as FunnelSession),
      booking_status: (bookings?.status ?? null) as FunnelLogEntry["booking_status"],
    };
  });
}
