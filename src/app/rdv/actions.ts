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
import { trackFunnel, markFunnelConverted } from "@/modules/booking/server/funnel";
import { getBookingLinkByCode, markLinkUsed } from "@/modules/booking/server/links";
import type {
  AvailableDay,
  FunnelPatch,
  QualificationInput,
} from "@/modules/booking/types";

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
  /** Session de tunnel (pour marquer la conversion). */
  sid?: string;
}

/** Suivi best-effort de la progression dans le tunnel (jamais bloquant). */
export async function trackFunnelAction(sid: string, patch: FunnelPatch): Promise<void> {
  await trackFunnel(sid, patch);
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
        await markFunnelConverted(args.sid, outcome.booking.id);
        return {
          ok: true,
          status: "confirmed",
          manageToken: outcome.booking.manage_token,
          meetUrl: outcome.booking.meet_url,
        };
      case "pending_manual":
        await markFunnelConverted(args.sid, outcome.booking.id);
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

/**
 * Réservation depuis un lien personnalisé (/r/<code>). Les infos (nom, e-mail,
 * source, LinkedIn) viennent du lien côté SERVEUR — pas du client. Les 3
 * questions de qualification restent vides.
 */
/** Infos éditables côté client dans l'écran de résumé d'un lien personnalisé. */
export interface PrefilledOverrides {
  name?: string;
  email?: string;
  guestEmails?: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createPrefilledBookingAction(
  code: string,
  startUtc: string,
  leadTimezone: string,
  sid?: string,
  overrides?: PrefilledOverrides,
): Promise<BookingActionResult> {
  const h = await headers();
  const ip = clientIp(h);
  if (!rateLimit(`book:${ip}`, 8, 10 * 60_000)) {
    return { ok: false, code: "rate_limited", error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  if (!startUtc || Number.isNaN(Date.parse(startUtc))) {
    return { ok: false, code: "invalid", error: "Créneau invalide." };
  }

  try {
    const link = await getBookingLinkByCode(code);
    if (!link) {
      return { ok: false, code: "invalid", error: "Lien invalide ou expiré." };
    }

    // Le prospect peut corriger son nom / e-mail et ajouter des invités ; la
    // source d'acquisition et le LinkedIn restent ceux du lien (jamais exposés
    // au client). Les 3 questions de qualification restent vides.
    const name = (overrides?.name ?? "").trim() || `${link.first_name} ${link.last_name}`.trim();
    if (!name) {
      return { ok: false, code: "invalid", error: "Le nom est requis." };
    }

    const email = (overrides?.email ?? "").trim() || link.email;
    if (!EMAIL_RE.test(email)) {
      return { ok: false, code: "invalid", error: "Adresse e-mail invalide." };
    }

    const guestEmails = (overrides?.guestEmails ?? [])
      .map((g) => g.trim())
      .filter(Boolean);
    if (guestEmails.length > 5) {
      return { ok: false, code: "invalid", error: "5 invités maximum." };
    }
    for (const g of guestEmails) {
      if (!EMAIL_RE.test(g)) {
        return { ok: false, code: "invalid", error: "L'e-mail d'un invité est invalide." };
      }
    }

    const input: QualificationInput = {
      name,
      email,
      activity: null,
      situation: null,
      motivation: null,
      guestEmails,
      acquisitionSource: link.acq_source,
      acquisitionPost: null,
      linkedin: link.linkedin_url,
    };

    const outcome = await createBooking(input, startUtc, leadTimezone);
    switch (outcome.status) {
      case "confirmed":
      case "pending_manual":
        await markLinkUsed(code, outcome.booking.id);
        await markFunnelConverted(sid, outcome.booking.id);
        return {
          ok: true,
          status: outcome.status,
          manageToken: outcome.booking.manage_token,
          meetUrl: outcome.status === "confirmed" ? outcome.booking.meet_url : null,
        };
      case "slot_taken":
        return { ok: false, code: "slot_taken", error: "Ce créneau vient d'être pris. Choisissez-en un autre." };
      case "unavailable":
        return { ok: false, code: "unavailable", error: "Ce créneau n'est plus disponible. Choisissez-en un autre." };
    }
  } catch (err) {
    console.error("[rdv] createPrefilledBookingAction:", err);
    return { ok: false, code: "server", error: "Une erreur est survenue. Réessayez." };
  }
}
