/**
 * Contenu de l'événement (titre + description) partagé entre l'invitation
 * Google Calendar (HTML) et le fichier .ics du lead (texte).
 */

import "server-only";
import { manageUrl } from "../emails/links";
import { formatDateLong } from "../lib/timezone";
import type { Booking, Settings } from "../types";

/** URL LinkedIn de Théo — configurable en env (défaut à affiner). */
export const LINKEDIN_URL =
  process.env.LINKEDIN_URL || "https://www.linkedin.com/in/theogouman/";

/** Titre de l'invitation : « Notion : <nom> × Théo ». */
export function eventSummary(booking: Booking): string {
  return `Notion : ${booking.lead_name} × Théo`;
}

const OBJECTIVES = [
  "1️⃣ Ton entreprise et son fonctionnement",
  "2️⃣ Ton organisation actuelle et les enjeux liés",
  "3️⃣ Si Notion est la bonne solution pour résoudre ces enjeux",
];

/** Description HTML pour Google Calendar (liens cliquables). */
export function eventDescriptionHtml(booking: Booking, settings: Settings): string {
  const bookedOn = formatDateLong(booking.created_at, settings.host_timezone);
  const mail = `mailto:${settings.reply_to}`;
  const manage = manageUrl(booking);
  return [
    `Cet appel a été planifié le ${bookedOn}.`,
    ``,
    `L'objectif de ces 1h est de comprendre..`,
    ...OBJECTIVES,
    ``,
    `👇🏻 Voici quelques liens rapides pour m'écrire / gérer ce rendez-vous :`,
    ``,
    `⋅ <a href="${mail}">M'écrire un mail ↗</a>`,
    `⋅ <a href="${LINKEDIN_URL}">Voir mon LinkedIn ↗</a>`,
    `⋅ <a href="${manage}">Replanifier / Annuler le rendez-vous ↗</a>`,
  ].join("<br>");
}

/** Description texte pour le fichier .ics (pas de HTML fiable en .ics). */
export function eventDescriptionText(booking: Booking, settings: Settings): string {
  const bookedOn = formatDateLong(booking.created_at, settings.host_timezone);
  return [
    `Cet appel a été planifié le ${bookedOn}.`,
    ``,
    `L'objectif de ces 1h est de comprendre..`,
    ...OBJECTIVES,
    ``,
    `Replanifier / Annuler : ${manageUrl(booking)}`,
    `M'écrire : ${settings.reply_to}`,
    `LinkedIn : ${LINKEDIN_URL}`,
  ].join("\n");
}
