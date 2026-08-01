"use server";

/**
 * Server Actions de gestion d'une réservation (reprogrammer / annuler).
 * L'autorisation repose uniquement sur le jeton (manage_token) : chaque action
 * relit la réservation par ce jeton côté serveur.
 */

import { computeAvailability } from "@/modules/booking/server/availability";
import { getBookingByToken } from "@/modules/booking/server/bookings";
import { rescheduleExisting, cancelExisting } from "@/modules/booking/server/flow";
import type { AvailabilityResult } from "@/app/rdv/actions";
import type { CancelFeedback } from "@/modules/booking/types";

/** Disponibilités pour la reprogrammation (fuseau du lead). */
export async function getManageAvailabilityAction(
  token: string,
  leadTimezone: string,
): Promise<AvailabilityResult> {
  const booking = await getBookingByToken(token);
  if (!booking) return { days: [], leadTimezone, hostTimezone: "Europe/Paris" };
  return computeAvailability(leadTimezone || booking.lead_timezone);
}

export type ManageResult =
  | { ok: true; kind: "rescheduled"; startUtc: string; meetUrl: string | null }
  | { ok: true; kind: "cancelled" }
  | { ok: false; error: string; code: "not_found" | "slot_taken" | "unavailable" | "server" };

/** Reprogramme la réservation liée au jeton vers un nouveau créneau. */
export async function rescheduleAction(
  token: string,
  startUtc: string,
): Promise<ManageResult> {
  const booking = await getBookingByToken(token);
  if (!booking) return { ok: false, code: "not_found", error: "Réservation introuvable." };
  if (!startUtc || Number.isNaN(Date.parse(startUtc))) {
    return { ok: false, code: "unavailable", error: "Créneau invalide." };
  }

  try {
    const res = await rescheduleExisting(booking.id, startUtc);
    switch (res.status) {
      case "confirmed":
        return { ok: true, kind: "rescheduled", startUtc: res.booking.start_utc, meetUrl: res.booking.meet_url };
      case "slot_taken":
        return { ok: false, code: "slot_taken", error: "Ce créneau vient d'être pris. Choisissez-en un autre." };
      case "unavailable":
        return { ok: false, code: "unavailable", error: "Ce créneau n'est plus disponible." };
      case "not_found":
        return { ok: false, code: "not_found", error: "Réservation introuvable." };
    }
  } catch (err) {
    console.error("[manage] rescheduleAction:", err);
    return { ok: false, code: "server", error: "Une erreur est survenue. Réessayez." };
  }
}

/** Annule la réservation liée au jeton (avec retour d'annulation facultatif). */
export async function cancelAction(
  token: string,
  feedback?: CancelFeedback,
): Promise<ManageResult> {
  const booking = await getBookingByToken(token);
  if (!booking) return { ok: false, code: "not_found", error: "Réservation introuvable." };

  try {
    await cancelExisting(booking.id, feedback);
    return { ok: true, kind: "cancelled" };
  } catch (err) {
    console.error("[manage] cancelAction:", err);
    return { ok: false, code: "server", error: "Une erreur est survenue. Réessayez." };
  }
}
