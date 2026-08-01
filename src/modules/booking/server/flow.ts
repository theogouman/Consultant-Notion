/**
 * Orchestration des flux métier (réservation / reprogrammation / annulation).
 * Regroupe la logique du brief §5 et §6 pour garder les Server Actions minces.
 */

import "server-only";
import { after } from "next/server";
import { getSettings } from "./settings";
import { DateTime } from "../lib/timezone";
import {
  isWithinBookableWindow,
  invalidateAvailabilityCache,
} from "./availability";
import {
  insertConfirmedBooking,
  attachGoogleEvent,
  markPendingManual,
  rescheduleBooking,
  cancelBooking,
  getBookingById,
  insertCancellationFeedback,
} from "./bookings";
import { createEvent, updateEventTime, deleteEvent } from "./google";
import {
  sendConfirmation,
  sendReschedule,
  sendCancellation,
  sendPendingManualAlert,
} from "./resend";
import { generateIdempotencyKey } from "../lib/tokens";
import { splitGuestEmails } from "../lib/validation";
import { eventSummary, eventDescriptionHtml } from "./event-content";
import type { Booking, CancelFeedback, QualificationInput } from "../types";

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

  // a. Garde-fou PUR (sans réseau) : refuse un créneau passé / hors fenêtre.
  //    On NE relance PAS le calcul complet de disponibilité (freebusy) ici : il
  //    coûte autant que le chargement du calendrier et alourdit la confirmation.
  //    L'anti-double-booking est garanti par l'index unique partiel à l'insert.
  if (!isWithinBookableWindow(startUtcIso, settings)) {
    return { status: "unavailable" };
  }

  // Fin calculée à partir de la durée (pas de nouvel appel getSettings).
  const endUtcIso = DateTime.fromISO(startUtcIso, { zone: "utc" })
    .plus({ minutes: settings.call_duration_min })
    .toISO()!;

  // b/c. Insertion CONFIRMÉE : l'index unique partiel arbitre la concurrence.
  const inserted = await insertConfirmedBooking({
    startUtc: startUtcIso,
    endUtc: endUtcIso,
    leadTimezone,
    input,
  });
  if (!inserted.ok) return { status: "slot_taken" };

  // Le créneau vient d'être pris -> les disponibilités en cache sont périmées.
  invalidateAvailabilityCache();

  let booking = inserted.booking;

  // c/d. Création de l'event Google (Meet obligatoire). Fallback si échec.
  try {
    const attendees = [{ email: booking.lead_email }];
    for (const g of splitGuestEmails(booking.guest_email)) attendees.push({ email: g });

    const event = await createEvent({
      summary: eventSummary(booking),
      description: eventDescriptionHtml(booking, settings),
      startUtc: booking.start_utc,
      endUtc: booking.end_utc,
      attendees,
      requestId: generateIdempotencyKey(),
    });

    booking = await attachGoogleEvent(booking.id, event.id, event.meetUrl);

    // e. Mails de confirmation + notification interne EN ARRIÈRE-PLAN : le lead
    //    arrive sur l'écran de confirmation sans attendre Resend.
    const confirmed = booking;
    after(async () => {
      try {
        await sendConfirmation(confirmed, settings);
      } catch (mailErr) {
        console.error("[booking] Échec e-mail confirmation:", mailErr);
      }
    });
    return { status: "confirmed", booking };
  } catch (err) {
    // Fallback Google indisponible : on conserve la ligne en pending_manual.
    console.error("[booking] Échec création event Google:", err);
    booking = await markPendingManual(booking.id);
    // Alerte interne en arrière-plan (Resend est indépendant de Google).
    const pending = booking;
    after(async () => {
      try {
        await sendPendingManualAlert(pending, settings);
      } catch (mailErr) {
        console.error("[booking] Échec alerte pending_manual:", mailErr);
      }
    });
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

  // Chemin critique minimal : on calcule la fin à partir de la durée (pas de
  // recalcul de disponibilité/freebusy ici — l'index unique arbitre les
  // conflits, et les créneaux affichés viennent d'être calculés). Cela rend la
  // confirmation quasi instantanée.
  const endUtcIso = DateTime.fromISO(startUtcIso, { zone: "utc" })
    .plus({ minutes: settings.call_duration_min })
    .toISO()!;

  const result = await rescheduleBooking(bookingId, startUtcIso, endUtcIso);
  if (!result.ok) return { status: "slot_taken" };

  // Ancien et nouveau créneaux ont changé de statut -> cache périmé.
  invalidateAvailabilityCache();

  const booking = result.booking;

  // Travail non bloquant (Google + e-mail) exécuté APRÈS la réponse, pour que
  // l'utilisateur arrive immédiatement sur l'écran de confirmation.
  after(async () => {
    if (booking.google_event_id) {
      try {
        await updateEventTime(booking.google_event_id, booking.start_utc, booking.end_utc);
      } catch (err) {
        console.error("[booking] Échec update event Google (reschedule):", err);
      }
    }
    try {
      await sendReschedule(booking, settings);
    } catch (err) {
      console.error("[booking] Échec e-mail reprogrammation:", err);
    }
  });

  return { status: "confirmed", booking };
}

export type CancelOutcome =
  | { status: "cancelled"; booking: Booking }
  | { status: "not_found" };

/** Annulation (§6) : supprimer l'event Google -> statut cancelled -> mails.
 *  `feedback` (facultatif) = retour du questionnaire d'annulation -> notif Théo. */
export async function cancelExisting(
  bookingId: string,
  feedback?: CancelFeedback,
): Promise<CancelOutcome> {
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
  // Le créneau se libère -> cache de disponibilités périmé.
  invalidateAvailabilityCache();

  // Enregistrement du motif (best-effort : ne bloque pas l'annulation).
  if (feedback) {
    try {
      await insertCancellationFeedback(booking, feedback);
    } catch (err) {
      console.error("[booking] Échec enregistrement motif annulation:", err);
    }
  }

  await sendCancellation(booking, settings, feedback);
  return { status: "cancelled", booking };
}
