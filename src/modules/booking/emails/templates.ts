/**
 * Templates d'e-mails (voix de Théo : direct, concret, sobre, vouvoiement,
 * sans emojis ni tics LinkedIn — une info claire, un CTA).
 *
 * Chaque builder renvoie { subject, html, text }. Le HTML est auto-porté
 * (styles inline) pour un rendu fiable en clients mail.
 */

import { formatSlotLong, timezoneAbbrev } from "../lib/timezone";
import {
  manageUrl,
  googleCalendarUrl,
  outlookCalendarUrl,
} from "./links";
import type { Booking } from "../types";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const SITUATION_LABEL: Record<string, string> = {
  notion_mal: "On utilise déjà Notion, mais mal",
  pas_outil: "On n'a pas d'outil d'organisation",
};

const BRAND = "#e0625a";
const INK = "#111111";
const MUTED = "#52525b";

function layout(bodyHtml: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2f2;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="padding:32px 32px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
${bodyHtml}
</td></tr>
<tr><td style="padding:24px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${MUTED};font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;">
Théo Gouman — Consultant Notion pour TPE et PME<br>
consultant-notion.fr
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:12px;">${label}</a>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${INK};">${text}</p>`;
}

function slotLine(booking: Booking): string {
  const when = formatSlotLong(booking.start_utc, booking.lead_timezone);
  const tz = timezoneAbbrev(booking.start_utc, booking.lead_timezone);
  return `${when} (${tz})`;
}

function addToCalendarBlock(booking: Booking, title: string, details: string): string {
  const g = googleCalendarUrl(booking, title, details);
  const o = outlookCalendarUrl(booking, title, details);
  return `<p style="margin:0 0 8px;font-size:13px;color:${MUTED};">Ajouter à votre agenda :
<a href="${g}" style="color:${BRAND};">Google</a> ·
<a href="${o}" style="color:${BRAND};">Outlook</a> ·
Apple (fichier .ics joint)</p>`;
}

function manageBlock(booking: Booking): string {
  const url = manageUrl(booking);
  return `<p style="margin:16px 0 0;font-size:13px;color:${MUTED};">Besoin de changer ? Vous pouvez
<a href="${url}" style="color:${BRAND};">reprogrammer ou annuler</a> à tout moment.</p>`;
}

/* -------------------------------------------------------------------------- */
/* 1. Confirmation (lead + guest)                                             */
/* -------------------------------------------------------------------------- */
export function confirmationEmail(booking: Booking): EmailContent {
  const title = "Appel de qualification — Théo Gouman";
  const details = "Appel de qualification avec Théo Gouman.";
  const meet = booking.meet_url
    ? `${p(`Le rendez-vous se tiendra en visio : ${button(booking.meet_url, "Rejoindre le Meet")}`)}`
    : "";

  const html = layout(
    `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${INK};">C'est confirmé.</h1>` +
      p(`Bonjour ${booking.lead_name},`) +
      p(`Votre appel est réservé pour le <strong>${slotLine(booking)}</strong>.`) +
      meet +
      addToCalendarBlock(booking, title, details) +
      manageBlock(booking) +
      p("À très vite.<br>Théo"),
  );

  const text = `Bonjour ${booking.lead_name},

Votre appel est réservé pour le ${slotLine(booking)}.
${booking.meet_url ? `Lien Meet : ${booking.meet_url}\n` : ""}
Reprogrammer ou annuler : ${manageUrl(booking)}

À très vite.
Théo`;

  return { subject: "Votre appel est confirmé", html, text };
}

/* -------------------------------------------------------------------------- */
/* 2. Notification interne (Théo)                                             */
/* -------------------------------------------------------------------------- */
export function internalNotificationEmail(booking: Booking): EmailContent {
  const situation = SITUATION_LABEL[booking.situation] ?? booking.situation;
  const rows = [
    ["Nom", booking.lead_name],
    ["E-mail", booking.lead_email],
    ["Invité(s)", booking.guest_email ?? "—"],
    ["Créneau", slotLine(booking)],
    ["Activité", booking.activity],
    ["Situation", situation],
    ["Motivation", booking.motivation],
    ["Meet", booking.meet_url ?? "—"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:${MUTED};font-size:14px;vertical-align:top;white-space:nowrap;">${k}</td><td style="padding:6px 0;color:${INK};font-size:14px;">${v}</td></tr>`,
    )
    .join("");

  const html = layout(
    `<h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${INK};">Nouvelle réservation</h1>` +
      `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${rows}</table>`,
  );

  const text = `Nouvelle réservation

Nom : ${booking.lead_name}
E-mail : ${booking.lead_email}
Invité : ${booking.guest_email ?? "—"}
Créneau : ${slotLine(booking)}
Activité : ${booking.activity}
Situation : ${situation}
Motivation : ${booking.motivation}
Meet : ${booking.meet_url ?? "—"}`;

  return { subject: `Nouvelle résa — ${booking.lead_name}`, html, text };
}

/* -------------------------------------------------------------------------- */
/* 3. Reprogrammation (lead + guest)                                          */
/* -------------------------------------------------------------------------- */
export function rescheduleEmail(booking: Booking): EmailContent {
  const title = "Appel de qualification — Théo Gouman";
  const details = "Appel de qualification avec Théo Gouman.";
  const meet = booking.meet_url
    ? p(`Le lien reste le même : ${button(booking.meet_url, "Rejoindre le Meet")}`)
    : "";

  const html = layout(
    `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${INK};">Votre appel a été déplacé.</h1>` +
      p(`Bonjour ${booking.lead_name},`) +
      p(`Nouveau créneau : <strong>${slotLine(booking)}</strong>.`) +
      meet +
      addToCalendarBlock(booking, title, details) +
      manageBlock(booking) +
      p("À très vite.<br>Théo"),
  );

  const text = `Bonjour ${booking.lead_name},

Votre appel a été déplacé.
Nouveau créneau : ${slotLine(booking)}.
${booking.meet_url ? `Lien Meet : ${booking.meet_url}\n` : ""}
Reprogrammer ou annuler : ${manageUrl(booking)}

À très vite.
Théo`;

  return { subject: "Votre appel a été déplacé", html, text };
}

/* -------------------------------------------------------------------------- */
/* 4a. Annulation (lead)                                                      */
/* -------------------------------------------------------------------------- */
export function cancellationEmail(booking: Booking): EmailContent {
  const html = layout(
    `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${INK};">Votre appel est annulé.</h1>` +
      p(`Bonjour ${booking.lead_name},`) +
      p(`Votre appel du <strong>${slotLine(booking)}</strong> a bien été annulé.`) +
      p(
        `Si vous souhaitez reprendre rendez-vous, c'est ici : <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://consultant-notion.fr"}/rdv" style="color:${BRAND};">réserver un créneau</a>.`,
      ) +
      p("Théo"),
  );

  const text = `Bonjour ${booking.lead_name},

Votre appel du ${slotLine(booking)} a bien été annulé.
Pour reprendre rendez-vous : ${process.env.NEXT_PUBLIC_BASE_URL || "https://consultant-notion.fr"}/rdv

Théo`;

  return { subject: "Votre appel est annulé", html, text };
}

/* -------------------------------------------------------------------------- */
/* 4b. Notification interne d'annulation (Théo)                               */
/* -------------------------------------------------------------------------- */
export function internalCancellationEmail(booking: Booking): EmailContent {
  const html = layout(
    `<h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${INK};">Annulation</h1>` +
      p(
        `${booking.lead_name} (${booking.lead_email}) a annulé son appel du <strong>${slotLine(booking)}</strong>.`,
      ),
  );
  const text = `${booking.lead_name} (${booking.lead_email}) a annulé son appel du ${slotLine(booking)}.`;
  return { subject: `Annulation — ${booking.lead_name}`, html, text };
}

/* -------------------------------------------------------------------------- */
/* 5. Rappel H-3 (lead + guest)                                               */
/* -------------------------------------------------------------------------- */
export function reminderEmail(booking: Booking): EmailContent {
  const meet = booking.meet_url
    ? p(`${button(booking.meet_url, "Rejoindre le Meet")}`)
    : "";
  const html = layout(
    `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${INK};">Votre appel, c'est bientôt.</h1>` +
      p(`Bonjour ${booking.lead_name},`) +
      p(`Petit rappel : votre appel est prévu <strong>${slotLine(booking)}</strong>.`) +
      meet +
      manageBlock(booking) +
      p("À tout à l'heure.<br>Théo"),
  );

  const text = `Bonjour ${booking.lead_name},

Petit rappel : votre appel est prévu ${slotLine(booking)}.
${booking.meet_url ? `Lien Meet : ${booking.meet_url}\n` : ""}
Reprogrammer ou annuler : ${manageUrl(booking)}

À tout à l'heure.
Théo`;

  return { subject: "Rappel : votre appel approche", html, text };
}

/* -------------------------------------------------------------------------- */
/* Alerte interne : échec création Google (pending_manual)                    */
/* -------------------------------------------------------------------------- */
export function pendingManualAlertEmail(booking: Booking): EmailContent {
  const html = layout(
    `<h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND};">À traiter à la main</h1>` +
      p(
        `Un lead n'a pas pu confirmer automatiquement (échec de la création de l'invitation Google). La réservation est enregistrée en base mais l'agenda n'a pas été mis à jour.`,
      ) +
      p(
        `<strong>${booking.lead_name}</strong> (${booking.lead_email})<br>Créneau souhaité : <strong>${slotLine(booking)}</strong>`,
      ) +
      p("Merci de créer l'événement manuellement et de recontacter le lead."),
  );
  const text = `À traiter à la main — échec création Google.

${booking.lead_name} (${booking.lead_email})
Créneau souhaité : ${slotLine(booking)}

Créer l'événement manuellement et recontacter le lead.`;
  return { subject: `[Action requise] Résa à confirmer — ${booking.lead_name}`, html, text };
}
