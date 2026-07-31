/**
 * Orchestration des flux métier (réservation / reprogrammation / annulation).
 * Regroupe la logique du brief §5 et §6 pour garder les Server Actions minces.
 */

import "server-only";
import { getSettings } from "./settings";
import {
  isSlotStillAvailable,
  slotEndFor,
} from "./availability";
import {
  insertConfirmedBooking,
  attachGoogleEvent,
  markPendingManual,
  rescheduleBooking,
  cancelBooking,
  getBookingById,
} from "./bookings";
import { createEvent, updateEventTime, deleteEvent } from "./google";
import {
  sendConfirmation,
  sendReschedule,
  sendCancellation,
  sendPendingManualAlert,
} from "./resend";
import { generateIdempotencyKey } from "../lib/tokens";
import type { Booking, QualificationInput } from "../types";

export type CreateOutcome =
  | { status: "confirmed"; booking: Booking }
  | { status: "pending_manual"; booking: Booking }
  | { status: "slot_taken" }
  | { status: "unavailable" };

/**
 * Crée une réservation (§5). Le créneau n'est ferme qu'ici, à la soumission.
 *   a. Revalider la disponibilité.
 *   b/c/d. Insérer confirmé (verrou) -> créer l'event Google -> attacher Meet.
 *   e. Envoyer les mails via Resend.
 * Fallback : si Google échoue, on garde la ligne en pending_manual + alerte.
 */
export async function createBooking(
  input: QualificationInput,
  startUtcIso: string,
  leadTimezone: string,
): Promise<CreateOutcome> {
  const settings = await getSettings();

  // a. Revalidation (freebusy + bookings) juste avant d'écrire.
  const available = await isSlotStillAvailable(startUtcIso, leadTimezone);
  if (!available) return { status: "unavailable" };

  const endUtcIso = await slotEndFor(startUtcIso);

  // b/c. Insertion CONFIRMÉE : l'index unique partiel arbitre la concurrence.
  const inserted = await insertConfirmedBooking({
    startUtc: startUtcIso,
    endUtc: endUtcIso,
    leadTimezone,
    input,
  });
  if (!inserted.ok) return { status: "slot_taken" };

  let booking = inserted.booking;

  // c/d. Création de l'event Google (Meet obligatoire). Fallback si échec.
  try {
    const attendees = [{ email: booking.lead_email }];
    if (booking.guest_email) attendees.push({ email: booking.guest_email });

    const event = await createEvent({
      summary: "Appel de qualification — Théo Gouman",
      description: buildEventDescription(booking),
      startUtc: booking.start_utc,
      endUtc: booking.end_utc,
      attendees,
      requestId: generateIdempotencyKey(),
    });

    booking = await attachGoogleEvent(booking.id, event.id, event.meetUrl);

    // e. Mails de confirmation + notification interne.
    await sendConfirmation(booking, settings);
    return { status: "confirmed", booking };
  } catch (err) {
    // Fallback Google indisponible : on conserve la ligne en pending_manual.
    console.error("[booking] Échec création event Google:", err);
    booking = await markPendingManual(booking.id);
    // Resend est indépendant de Google -> l'alerte part quand même.
    try {
      await sendPendingManualAlert(booking, settings);
    } catch (mailErr) {
      console.error("[booking] Échec alerte pending_manual:", mailErr);
    }
    return { status: "pending_manual", booking };
  }
}

export type RescheduleOutcome =
  | { status: "confirmed"; booking: Booking }
  | { status: "slot_taken" }
  | { status: "unavailable" }
  | { status: "not_found" };

/** Reprogrammation (§6) : nouveau créneau -> update Google -> update base -> mail. */
export async function rescheduleExisting(
  bookingId: string,
  startUtcIso: string,
): Promise<RescheduleOutcome> {
  const settings = await getSettings();
  const current = await getBookingById(bookingId);
  if (!current || current.status === "cancelled") return { status: "not_found" };

  const available = await isSlotStillAvailable(startUtcIso, current.lead_timezone);
  if (!available) return { status: "unavailable" };

  const endUtcIso = await slotEndFor(startUtcIso);

  const result = await rescheduleBooking(bookingId, startUtcIso, endUtcIso);
  if (!result.ok) return { status: "slot_taken" };

  let booking = result.booking;

  // Mise à jour de l'event Google (même event, SEQUENCE ICS incrémenté).
  if (booking.google_event_id) {
    try {
      await updateEventTime(booking.google_event_id, booking.start_utc, booking.end_utc);
    } catch (err) {
      console.error("[booking] Échec update event Google (reschedule):", err);
    }
  }

  await sendReschedule(booking, settings);
  booking = (await getBookingById(bookingId)) ?? booking;
  return { status: "confirmed", booking };
}

export type CancelOutcome =
  | { status: "cancelled"; booking: Booking }
  | { status: "not_found" };

/** Annulation (§6) : supprimer l'event Google -> statut cancelled -> mails. */
export async function cancelExisting(bookingId: string): Promise<CancelOutcome> {
  const settings = await getSettings();
  const current = await getBookingById(bookingId);
  if (!current) return { status: "not_found" };
  if (current.status === "cancelled") return { status: "cancelled", booking: current };

  if (current.google_event_id) {
    try {
      await deleteEvent(current.google_event_id);
    } catch (err) {
      console.error("[booking] Échec suppression event Google (cancel):", err);
    }
  }

  const booking = await cancelBooking(bookingId);
  await sendCancellation(booking, settings);
  return { status: "cancelled", booking };
}

function buildEventDescription(booking: Booking): string {
  const situation =
    booking.situation === "notion_mal"
      ? "On utilise déjà Notion, mais mal"
      : "On n'a pas d'outil d'organisation";
  return [
    `Activité : ${booking.activity}`,
    `Situation : ${situation}`,
    `Motivation : ${booking.motivation}`,
  ].join("\n");
}
