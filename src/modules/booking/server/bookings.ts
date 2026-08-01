/**
 * Couche d'accès aux réservations (`bookings`).
 * La base est la source de vérité. L'anti-double-booking repose sur l'index
 * unique partiel `one_active_booking_per_slot` (status = 'confirmed').
 */

import "server-only";
import { getSupabaseAdmin } from "./supabase";
import { generateManageToken } from "../lib/tokens";
import type { Booking, CancelFeedback, QualificationInput } from "../types";

/** Statuts qui « occupent » un créneau pour le calcul de disponibilité. */
const ACTIVE_STATUSES = ["confirmed", "pending_manual"] as const;

/** Réservations actives (confirmées + à traiter) sur un intervalle UTC. */
export async function getActiveBookingsInRange(
  startUtcIso: string,
  endUtcIso: string,
): Promise<Booking[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .in("status", ACTIVE_STATUSES as unknown as string[])
    .gte("start_utc", startUtcIso)
    .lt("start_utc", endUtcIso)
    .order("start_utc", { ascending: true });

  if (error) throw new Error(`Lecture bookings échouée: ${error.message}`);
  return (data ?? []) as Booking[];
}

/** Réservation par jeton de gestion (reschedule/cancel). */
export async function getBookingByToken(token: string): Promise<Booking | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("manage_token", token)
    .maybeSingle();

  if (error) throw new Error(`Lecture booking échouée: ${error.message}`);
  return (data as Booking) ?? null;
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Lecture booking échouée: ${error.message}`);
  return (data as Booking) ?? null;
}

/** Réservations confirmées d'un jour host donné (borne min/max UTC). */
export async function countActiveOnRange(
  startUtcIso: string,
  endUtcIso: string,
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("status", ACTIVE_STATUSES as unknown as string[])
    .gte("start_utc", startUtcIso)
    .lt("start_utc", endUtcIso);
  if (error) throw new Error(`Comptage bookings échoué: ${error.message}`);
  return count ?? 0;
}

export type InsertResult =
  | { ok: true; booking: Booking }
  | { ok: false; reason: "slot_taken" };

/**
 * Insère une réservation CONFIRMÉE. C'est cet INSERT qui « verrouille » le
 * créneau : l'index unique partiel refuse un second confirmed sur le même
 * start_utc (23505) => on renvoie `slot_taken`.
 *
 * Idempotence double-clic : si un booking confirmé existe déjà pour ce même
 * créneau ET ce même e-mail, on le renvoie tel quel (au lieu de `slot_taken`).
 */
export async function insertConfirmedBooking(params: {
  startUtc: string;
  endUtc: string;
  leadTimezone: string;
  input: QualificationInput;
}): Promise<InsertResult> {
  const supabase = getSupabaseAdmin();
  const manage_token = generateManageToken();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      start_utc: params.startUtc,
      end_utc: params.endUtc,
      lead_timezone: params.leadTimezone,
      lead_name: params.input.name,
      lead_email: params.input.email,
      guest_email:
        params.input.guestEmails && params.input.guestEmails.length
          ? params.input.guestEmails.join(", ")
          : null,
      activity: params.input.activity,
      situation: params.input.situation,
      motivation: params.input.motivation,
      status: "confirmed",
      manage_token,
    })
    .select("*")
    .single();

  if (error) {
    // 23505 = violation d'unicité (créneau déjà pris).
    if (error.code === "23505") {
      // Double-clic du même lead sur le même créneau => idempotent.
      const { data: existing } = await supabase
        .from("bookings")
        .select("*")
        .eq("start_utc", params.startUtc)
        .eq("status", "confirmed")
        .eq("lead_email", params.input.email)
        .maybeSingle();
      if (existing) return { ok: true, booking: existing as Booking };
      return { ok: false, reason: "slot_taken" };
    }
    throw new Error(`Insertion booking échouée: ${error.message}`);
  }

  return { ok: true, booking: data as Booking };
}

/** Enregistre les infos Google après création de l'event. */
export async function attachGoogleEvent(
  id: string,
  googleEventId: string,
  meetUrl: string | null,
): Promise<Booking> {
  return patchBooking(id, {
    google_event_id: googleEventId,
    meet_url: meetUrl,
    status: "confirmed",
  });
}

/** Bascule une réservation en `pending_manual` (échec Google -> à traiter). */
export async function markPendingManual(id: string): Promise<Booking> {
  return patchBooking(id, { status: "pending_manual" });
}

/** Patch générique d'une réservation. */
export async function patchBooking(
  id: string,
  patch: Partial<Booking>,
): Promise<Booking> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Mise à jour booking échouée: ${error?.message ?? "inconnu"}`);
  }
  return data as Booking;
}

/**
 * Reprogrammation atomique : met à jour le créneau en s'appuyant sur l'index
 * unique. On tente l'UPDATE ; en cas de 23505, le nouveau créneau est pris.
 */
export async function rescheduleBooking(
  id: string,
  startUtc: string,
  endUtc: string,
): Promise<InsertResult> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update({
      start_utc: startUtc,
      end_utc: endUtc,
      ics_sequence: (await incrementedSequence(id)) as number,
      reminder_sent_at: null, // le rappel doit repartir sur le nouveau créneau
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, reason: "slot_taken" };
    throw new Error(`Reprogrammation échouée: ${error.message}`);
  }
  return { ok: true, booking: data as Booking };
}

/** Incrémente le SEQUENCE ICS (pour mise à jour, pas duplication, côté lead). */
async function incrementedSequence(id: string): Promise<number> {
  const b = await getBookingById(id);
  return (b?.ics_sequence ?? 0) + 1;
}

/** Passe une réservation en `cancelled`. */
export async function cancelBooking(id: string): Promise<Booking> {
  return patchBooking(id, { status: "cancelled" });
}

/**
 * Enregistre le motif d'annulation (questionnaire de rétention) dans la table
 * dédiée `cancellation_feedback`. Best-effort : l'appelant ne bloque pas
 * l'annulation si l'écriture échoue.
 */
export async function insertCancellationFeedback(
  booking: Booking,
  fb: CancelFeedback,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("cancellation_feedback").insert({
    booking_id: booking.id,
    lead_name: booking.lead_name,
    lead_email: booking.lead_email,
    start_utc: booking.start_utc,
    reason: fb.reason,
    better_tool: fb.betterTool ?? null,
    better_tool_other: fb.betterToolOther?.trim() || null,
    better_tool_reason: fb.betterToolReason?.trim() || null,
    wants_callback: fb.wantsCallback ?? null,
    callback_delay: fb.callbackDelay ?? null,
  });
  if (error) {
    throw new Error(`Enregistrement motif annulation échoué: ${error.message}`);
  }
}

/** Réservations à venir (confirmées + pending), pour l'admin. */
export async function getUpcomingBookings(): Promise<Booking[]> {
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .neq("status", "cancelled")
    .gte("start_utc", nowIso)
    .order("start_utc", { ascending: true });
  if (error) throw new Error(`Lecture bookings admin échouée: ${error.message}`);
  return (data ?? []) as Booking[];
}

/** Réservations à rappeler (H-3) : confirmées, non encore rappelées, à venir. */
export async function getBookingsToRemind(reminderHoursBefore: number): Promise<Booking[]> {
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const horizonIso = new Date(now + reminderHoursBefore * 3600_000).toISOString();

  // start_utc entre maintenant et maintenant+H, non rappelé, confirmé.
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gt("start_utc", nowIso)
    .lte("start_utc", horizonIso)
    .order("start_utc", { ascending: true });
  if (error) throw new Error(`Lecture rappels échouée: ${error.message}`);
  return (data ?? []) as Booking[];
}

/** Marque le rappel comme envoyé (anti double-rappel). */
export async function markReminderSent(id: string): Promise<void> {
  await patchBooking(id, { reminder_sent_at: new Date().toISOString() });
}
