/**
 * Génération de fichiers .ics (VEVENT) — sans dépendance.
 *
 * UID stable lié à la réservation (idéalement google_event_id) pour que
 * reprogrammation/annulation METTENT À JOUR l'entrée côté lead au lieu de la
 * dupliquer. SEQUENCE incrémenté à chaque changement.
 */

import "server-only";
import { DateTime } from "../lib/timezone";
import { splitGuestEmails } from "../lib/validation";
import type { Booking, Settings } from "../types";

/** Format ICS d'un instant UTC : YYYYMMDDTHHMMSSZ. */
function icsDate(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" }).toFormat("yyyyLLdd'T'HHmmss'Z'");
}

/** Échappe les caractères spéciaux ICS (RFC 5545). */
function esc(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** UID stable : préfixe google_event_id sinon l'id booking. */
function uidFor(booking: Booking): string {
  const base = booking.google_event_id || booking.id;
  return `${base}@consultant-notion.fr`;
}

/** Replie les lignes > 75 octets (RFC 5545) — approximation par caractères. */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 73) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
}

export interface IcsOptions {
  booking: Booking;
  settings: Settings;
  summary: string;
  description: string;
  /** REQUEST (invite/màj) ou CANCEL (annulation). */
  method: "REQUEST" | "CANCEL";
}

/** Construit le contenu d'un fichier .ics pour une réservation. */
export function buildIcs({
  booking,
  settings,
  summary,
  description,
  method,
}: IcsOptions): string {
  const organizerEmail = settings.reply_to;
  const status = method === "CANCEL" ? "CANCELLED" : "CONFIRMED";
  const dtstamp = icsDate(DateTime.utc().toISO()!);

  const attendees: string[] = [
    `ATTENDEE;CN=${esc(booking.lead_name)};RSVP=TRUE:mailto:${booking.lead_email}`,
  ];
  for (const g of splitGuestEmails(booking.guest_email)) {
    attendees.push(`ATTENDEE;RSVP=TRUE:mailto:${g}`);
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//consultant-notion.fr//Booker//FR",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${uidFor(booking)}`,
    `SEQUENCE:${booking.ics_sequence}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${icsDate(booking.start_utc)}`,
    `DTEND:${icsDate(booking.end_utc)}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(description)}`,
    booking.meet_url ? `URL:${booking.meet_url}` : "",
    booking.meet_url ? `LOCATION:${esc(booking.meet_url)}` : "",
    `ORGANIZER;CN=Théo Gouman:mailto:${organizerEmail}`,
    ...attendees,
    `STATUS:${status}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.map(fold).join("\r\n");
}
