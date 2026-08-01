/**
 * Templates d'e-mails (voix de Théo : direct, concret, sobre, vouvoiement,
 * sans emojis ni tics LinkedIn — une info claire, un CTA).
 *
 * Chaque builder renvoie { subject, html, text }. Le HTML est auto-porté
 * (styles inline) pour un rendu fiable en clients mail.
 */

import {
  formatSlotLong,
  formatSlotBanner,
  formatWeekday,
  timezoneAbbrev,
} from "../lib/timezone";
import {
  manageUrl,
  baseUrl,
  googleCalendarUrl,
  outlookCalendarUrl,
} from "./links";
import { summarizeCancelFeedback } from "../lib/cancel";
import type { Booking, CancelFeedback } from "../types";

/** Liens « découvrir mon travail » (configurables en env — défauts à affiner). */
const YOUTUBE_URL = process.env.YOUTUBE_URL || "https://www.youtube.com/@theogouman";
const LINKEDIN_URL = process.env.LINKEDIN_URL || "https://www.linkedin.com/in/theogouman/";
const CASE_STUDIES_URL = baseUrl();

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
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media only screen and (max-width:480px){.ps-cell{display:block!important;width:100%!important;padding:0 0 8px 0!important}}</style></head>
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

/** URL absolue d'un asset (les images d'e-mail doivent être hébergées). */
function asset(path: string): string {
  return `${baseUrl()}/images/Annexes/${path}`;
}

/**
 * Bouton d'e-mail avec icône PNG à gauche (rendu fiable, Gmail inclus).
 * variant: "primary" (fond corail), "solid" (fond sombre) ou "soft" (fond gris).
 */
function iconButton(
  href: string,
  label: string,
  iconFile: string,
  variant: "primary" | "solid" | "soft" = "soft",
  iconSize = 15,
): string {
  const styles =
    variant === "primary"
      ? `background:${BRAND};color:#ffffff;border:1px solid ${BRAND};`
      : variant === "solid"
        ? `background:#111111;color:#ffffff;border:1px solid #111111;`
        : `background:#f5f5f5;color:${INK};border:1px solid #e5e7eb;`;
  return `<a href="${href}" style="display:inline-block;text-decoration:none;font-weight:600;font-size:13px;line-height:${iconSize}px;padding:7px 13px;border-radius:10px;${styles}">
<img src="${asset(iconFile)}" width="${iconSize}" height="${iconSize}" alt="" style="vertical-align:middle;border:0;margin-right:7px;">
<span style="vertical-align:middle;">${label}</span></a>`;
}

/** Bouton PS pleine largeur (rempli sa cellule de tableau). */
function psButton(href: string, label: string, iconFile: string): string {
  return `<a href="${href}" style="display:block;text-align:center;text-decoration:none;font-size:12.5px;font-weight:500;color:${INK};background:#f5f5f5;border:1px solid #e5e7eb;padding:8px 10px;border-radius:10px;">
<img src="${asset(iconFile)}" width="14" height="14" alt="" style="vertical-align:middle;border:0;margin-right:6px;">
<span style="vertical-align:middle;">${label}</span></a>`;
}

/** Encadré gris arrondi pour la date (comme sur la page de confirmation). */
function dateChip(text: string): string {
  return `<span style="display:inline-block;background:#f5f5f5;border-radius:10px;padding:4px 12px;font-weight:600;color:${INK};">${text}</span>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${INK};">${text}</p>`;
}

/** Échappe le HTML (texte libre issu d'un formulaire public). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  const banner = formatSlotBanner(booking.start_utc, booking.lead_timezone);
  const weekday = formatWeekday(booking.start_utc, booking.lead_timezone);
  const manage = manageUrl(booking);

  // Image entière (pas de recadrage circulaire) : léger arrondi seulement.
  const avatar = `<img src="${asset("theo-avatar-email.png")}" width="44" height="44" alt="Théo Gouman" style="border-radius:10px;display:block;border:0;">`;

  const meetBlock = booking.meet_url
    ? p(iconButton(booking.meet_url, "Rejoindre le Google Meet", "google-meet-icon-sm.png", "solid"))
    : "";

  const html = layout(
    `<div style="margin:0 0 20px;">${avatar}</div>` +
      `<h1 style="margin:0 0 20px;font-size:21px;font-weight:700;letter-spacing:-0.02em;line-height:1.35;color:${INK};">Notre rendez-vous est confirmé pour le ${dateChip(banner)}</h1>` +
      p("Hello,<br>C'est Théo Gouman, consultant Notion.") +
      p("Je me permets de t'écrire pour te donner quelques informations suite à l'appel que tu viens de confirmer.") +
      p("Déjà, l'appel aura lieu sur Google Meet. Voici le lien sur lequel on se connectera :") +
      meetBlock +
      p("Si entre-temps tu as besoin de replanifier notre appel, tu peux passer par ce lien 👇🏻") +
      p(iconButton(manage, "Replanifier / Annuler le rendez-vous", "clock-icon.png", "soft")) +
      p("Assure-toi d'avoir bien 1h de libre pour qu'on prenne bien le temps d'évoquer tous les sujets.") +
      `<p style="margin:0 0 8px;font-size:15px;line-height:1.65;color:${INK};">L'objectif de ce créneau est de comprendre...</p>` +
      `<p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:${INK};">1️⃣ Ton entreprise et son fonctionnement</p>` +
      `<p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:${INK};">2️⃣ Ton organisation actuelle et les enjeux liés</p>` +
      `<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:${INK};">3️⃣ Si Notion est la bonne solution pour résoudre ces enjeux</p>` +
      p(`À ${weekday} ! :)<br>Théo`) +
      `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">` +
      `<p style="margin:0 0 12px;font-size:14px;color:${MUTED};">PS : Voici quelques liens pour découvrir mon travail 👇🏻</p>` +
      // Sur desktop : 3 boutons sur une seule ligne (table). Sur mobile : ils
      // s'empilent (media query .ps-cell dans le <head>).
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td class="ps-cell" width="33.33%" valign="middle" style="padding:0 4px 0 0;">${psButton(YOUTUBE_URL, "Voir les vidéos YouTube →", "youtube-icon.png")}</td>
<td class="ps-cell" width="33.33%" valign="middle" style="padding:0 2px;">${psButton(LINKEDIN_URL, "Voir mon LinkedIn →", "linkedin-icon.png")}</td>
<td class="ps-cell" width="33.33%" valign="middle" style="padding:0 0 0 4px;">${psButton(CASE_STUDIES_URL, "Voir mes études de cas →", "bookmark-fill.png")}</td>
</tr></table>`,
  );

  const text = `Hello,

C'est Théo Gouman, consultant Notion.

Notre rendez-vous est confirmé pour le ${banner}.

L'appel aura lieu sur Google Meet.${booking.meet_url ? `\nLien : ${booking.meet_url}` : ""}

Besoin de replanifier ? ${manage}

L'objectif de ce créneau (1h) est de comprendre :
1. Ton entreprise et son fonctionnement
2. Ton organisation actuelle et les enjeux liés
3. Si Notion est la bonne solution pour résoudre ces enjeux

À ${weekday} ! :)
Théo

PS : YouTube ${YOUTUBE_URL} · LinkedIn ${LINKEDIN_URL} · Études de cas ${CASE_STUDIES_URL}`;

  return { subject: "Notre rendez-vous est confirmé", html, text };
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
export function internalCancellationEmail(
  booking: Booking,
  feedback?: CancelFeedback,
): EmailContent {
  const lines = feedback ? summarizeCancelFeedback(feedback) : [];

  // Bloc « retour d'annulation » (free-text échappé : formulaire public).
  const feedbackHtml = lines.length
    ? `<div style="margin:4px 0 4px;padding:14px 16px;background:#f5f5f5;border-radius:12px;">` +
      lines
        .map(
          (l) =>
            `<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:${INK};">${escapeHtml(l)}</p>`,
        )
        .join("") +
      `</div>`
    : "";

  const html = layout(
    `<h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${INK};">Annulation</h1>` +
      p(
        `${booking.lead_name} (${booking.lead_email}) a annulé son appel du <strong>${slotLine(booking)}</strong>.`,
      ) +
      feedbackHtml,
  );

  const text =
    `${booking.lead_name} (${booking.lead_email}) a annulé son appel du ${slotLine(booking)}.` +
    (lines.length ? `\n\n${lines.join("\n")}` : "");

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
