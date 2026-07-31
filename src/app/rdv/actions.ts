"use server";

/**
 * Server Actions du booker public (route /rdv).
 * Toute la logique sensible (Google, Supabase, Resend) reste côté serveur.
 */

import { headers } from "next/headers";
import { computeAvailability } from "@/modules/booking/server/availability";
import { createBooking } from "@/modules/booking/server/flow";
import { validateQualification } from "@/modules/booking/lib/validation";
import { rateLimit, clientIp } from "@/modules/booking/lib/rate-limit";
import type { AvailableDay, QualificationInput } from "@/modules/booking/types";

export interface AvailabilityResult {
  days: AvailableDay[];
  leadTimezone: string;
  hostTimezone: string;
}

/** Disponibilités calculées pour le fuseau du lead. */
export async function getAvailabilityAction(
  leadTimezone: string,
): Promise<AvailabilityResult> {
  return computeAvailability(leadTimezone);
}

export type BookingActionResult =
  | { ok: true; status: "confirmed" | "pending_manual"; manageToken: string; meetUrl: string | null }
  | { ok: false; error: string; code: "slot_taken" | "unavailable" | "invalid" | "rate_limited" | "server" };

export interface CreateBookingArgs extends QualificationInput {
  startUtc: string;
  leadTimezone: string;
}

/** Crée une réservation (revalidation + Google + Resend gérés côté serveur). */
export async function createBookingAction(
  args: CreateBookingArgs,
): Promise<BookingActionResult> {
  // Rate-limit léger par IP (anti-abus) — 8 tentatives / 10 min.
  const h = await headers();
  const ip = clientIp(h);
  if (!rateLimit(`book:${ip}`, 8, 10 * 60_000)) {
    return { ok: false, code: "rate_limited", error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  // Validation + honeypot.
  const valid = validateQualification(args);
  if (!valid.ok) {
    return { ok: false, code: "invalid", error: valid.error };
  }

  if (!args.startUtc || Number.isNaN(Date.parse(args.startUtc))) {
    return { ok: false, code: "invalid", error: "Créneau invalide." };
  }

  try {
    const outcome = await createBooking(valid.value, args.startUtc, args.leadTimezone);

    switch (outcome.status) {
      case "confirmed":
        return {
          ok: true,
          status: "confirmed",
          manageToken: outcome.booking.manage_token,
          meetUrl: outcome.booking.meet_url,
        };
      case "pending_manual":
        return {
          ok: true,
          status: "pending_manual",
          manageToken: outcome.booking.manage_token,
          meetUrl: null,
        };
      case "slot_taken":
        return {
          ok: false,
          code: "slot_taken",
          error: "Ce créneau vient d'être pris. Choisissez-en un autre.",
        };
      case "unavailable":
        return {
          ok: false,
          code: "unavailable",
          error: "Ce créneau n'est plus disponible. Choisissez-en un autre.",
        };
    }
  } catch (err) {
    console.error("[rdv] createBookingAction:", err);
    return { ok: false, code: "server", error: "Une erreur est survenue. Réessayez." };
  }
}
