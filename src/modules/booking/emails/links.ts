/**
 * Liens utilitaires pour les e-mails : gestion tokenisée + add-to-calendar.
 */

import { DateTime } from "../lib/timezone";
import type { Booking } from "../types";

/** Base URL publique (sans slash final). */
export function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "https://consultant-notion.fr").replace(
    /\/$/,
    "",
  );
}

/** Lien de gestion (reprogrammer / annuler) — ne concerne que cette résa. */
export function manageUrl(booking: Booking): string {
  return `${baseUrl()}/rdv/manage/${booking.manage_token}`;
}

function icsStamp(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" }).toFormat("yyyyLLdd'T'HHmmss'Z'");
}

/** Lien « ajouter à Google Agenda ». */
export function googleCalendarUrl(booking: Booking, title: string, details: string): string {
  const dates = `${icsStamp(booking.start_utc)}/${icsStamp(booking.end_utc)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details: booking.meet_url ? `${details}\n\nLien Meet : ${booking.meet_url}` : details,
    location: booking.meet_url ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Lien « ajouter à Outlook (web) ». */
export function outlookCalendarUrl(booking: Booking, title: string, details: string): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: booking.start_utc,
    enddt: booking.end_utc,
    subject: title,
    body: booking.meet_url ? `${details}\n\nLien Meet : ${booking.meet_url}` : details,
    location: booking.meet_url ?? "",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
