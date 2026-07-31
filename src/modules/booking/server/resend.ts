/**
 * Envoi des e-mails via Resend (100 % des mails lead + notifications internes).
 * Resend est indépendant de Google : une alerte peut partir même si Google est
 * down.
 */

import "server-only";
import { Resend } from "resend";
import { buildIcs } from "./ics";
import { eventSummary, eventDescriptionText } from "./event-content";
import { splitGuestEmails } from "../lib/validation";
import {
  confirmationEmail,
  internalNotificationEmail,
  rescheduleEmail,
  cancellationEmail,
  internalCancellationEmail,
  reminderEmail,
  pendingManualAlertEmail,
  type EmailContent,
} from "../emails/templates";
import type { Booking, Settings } from "../types";

let cached: Resend | null = null;
function client(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY manquant.");
  cached = new Resend(key);
  return cached;
}

/** Destinataires lead (+ invités éventuels), dédupliqués. */
function leadRecipients(booking: Booking): string[] {
  const set = new Set<string>([booking.lead_email]);
  for (const g of splitGuestEmails(booking.guest_email)) set.add(g);
  return [...set];
}

interface SendArgs {
  settings: Settings;
  to: string[];
  content: EmailContent;
  ics?: { filename: string; content: string };
}

async function send({ settings, to, content, ics }: SendArgs): Promise<void> {
  await client().emails.send({
    from: settings.sender_from,
    to,
    replyTo: settings.reply_to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    attachments: ics
      ? [{ filename: ics.filename, content: Buffer.from(ics.content).toString("base64") }]
      : undefined,
  });
}

function icsFor(
  booking: Booking,
  settings: Settings,
  method: "REQUEST" | "CANCEL",
): { filename: string; content: string } {
  return {
    filename: "rendez-vous.ics",
    content: buildIcs({
      booking,
      settings,
      summary: eventSummary(booking),
      description: eventDescriptionText(booking, settings),
      method,
    }),
  };
}

/** Confirmation (lead + guest) avec .ics + notification interne à Théo. */
export async function sendConfirmation(booking: Booking, settings: Settings): Promise<void> {
  await Promise.allSettled([
    send({
      settings,
      to: leadRecipients(booking),
      content: confirmationEmail(booking),
      ics: icsFor(booking, settings, "REQUEST"),
    }),
    send({
      settings,
      to: [settings.reply_to],
      content: internalNotificationEmail(booking),
    }),
  ]);
}

/** Reprogrammation (lead + guest) avec nouveau .ics (SEQUENCE incrémenté). */
export async function sendReschedule(booking: Booking, settings: Settings): Promise<void> {
  await send({
    settings,
    to: leadRecipients(booking),
    content: rescheduleEmail(booking),
    ics: icsFor(booking, settings, "REQUEST"),
  });
}

/** Annulation (lead) + notification interne à Théo, avec .ics CANCEL. */
export async function sendCancellation(booking: Booking, settings: Settings): Promise<void> {
  await Promise.allSettled([
    send({
      settings,
      to: leadRecipients(booking),
      content: cancellationEmail(booking),
      ics: icsFor(booking, settings, "CANCEL"),
    }),
    send({
      settings,
      to: [settings.reply_to],
      content: internalCancellationEmail(booking),
    }),
  ]);
}

/** Rappel H-3 (lead + guest). */
export async function sendReminder(booking: Booking, settings: Settings): Promise<void> {
  await send({
    settings,
    to: leadRecipients(booking),
    content: reminderEmail(booking),
  });
}

/** Alerte interne : la création Google a échoué -> à traiter à la main. */
export async function sendPendingManualAlert(
  booking: Booking,
  settings: Settings,
): Promise<void> {
  await send({
    settings,
    to: [settings.reply_to],
    content: pendingManualAlertEmail(booking),
  });
}
