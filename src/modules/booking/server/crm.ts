/**
 * Synchronisation CRM (Notion) — best-effort.
 *
 * À chaque réservation confirmée, le lead atterrit dans la base « CRM @Gouman »
 * avec son canal d'acquisition (`source⎜post`, cf. lib/acquisition).
 *
 * Règles :
 *   - Fiche déjà présente (même e-mail) : on ne réécrit rien, sauf « Canal
 *     d'acquisition » s'il est encore vide. Un lead revenu par un autre post ne
 *     doit pas écraser son attribution d'origine, et son État (Client, En
 *     discussion...) ne doit jamais régresser vers « Rdv Pris ».
 *   - Fiche absente : création avec Nom / E-mail / Job / État = « Rdv Pris ».
 *
 * Rien ici ne doit jamais faire échouer une réservation : toutes les erreurs
 * sont avalées et journalisées. L'appel se fait hors du chemin critique
 * (`after()` dans flow.ts).
 *
 * Prérequis côté Notion : la base doit être partagée avec l'intégration qui
 * porte `NOTION_API_TOKEN` (Notion → ⋯ → Connexions → ajouter l'intégration).
 */

import "server-only";
import { createPage, queryDatabaseAll, updatePage, getRichText } from "@/lib/notion/client";
import { formatAcquisitionChannel } from "../lib/acquisition";
import type { Booking } from "../types";

/** Base CRM (« CRM @Gouman »). Surchargeable par variable d'environnement. */
const DEFAULT_CRM_DATABASE_ID = "70703f6c7f4a45df865150c9f3ec8fb3";

/** Noms EXACTS des propriétés dans la base CRM — renommer là-bas casse ici. */
const PROP = {
  name: "Nom",
  email: "E-mail",
  job: "Job",
  status: "État",
  channel: "Canal d'acquisition",
} as const;

/** Statut posé sur une fiche créée depuis le booker. */
const STATUS_BOOKED = "Rdv Pris";

function databaseId(): string {
  return process.env.NOTION_CRM_DATABASE_ID || DEFAULT_CRM_DATABASE_ID;
}

/** Fiche existante pour cet e-mail (insensible à la casse côté Notion). */
async function findByEmail(email: string): Promise<{ id: string; properties: unknown } | null> {
  const pages = await queryDatabaseAll(
    databaseId(),
    {
      filter: { property: PROP.email, email: { equals: email } },
    },
    { noStore: true },
  );
  const page = pages[0];
  return page ? { id: page.id, properties: page.properties } : null;
}

/**
 * Pousse la réservation dans le CRM. Ne lève jamais : renvoie simplement
 * `false` si rien n'a pu être écrit (token absent, base non partagée, API KO).
 */
export async function syncBookingToCrm(booking: Booking): Promise<boolean> {
  const channel = formatAcquisitionChannel({
    source: booking.acq_source,
    post: booking.acq_post,
  });

  try {
    const existing = await findByEmail(booking.lead_email);

    if (existing) {
      // Attribution déjà connue -> on n'y touche pas (premier contact gagnant).
      const current = getRichText(existing.properties, PROP.channel);
      if (!channel || current) return true;

      const updated = await updatePage(existing.id, {
        [PROP.channel]: { rich_text: [{ text: { content: channel } }] },
      });
      return Boolean(updated);
    }

    const created = await createPage(databaseId(), {
      [PROP.name]: { title: [{ text: { content: booking.lead_name } }] },
      [PROP.email]: { email: booking.lead_email },
      [PROP.job]: { rich_text: [{ text: { content: booking.activity } }] },
      [PROP.status]: { status: { name: STATUS_BOOKED } },
      ...(channel
        ? { [PROP.channel]: { rich_text: [{ text: { content: channel } }] } }
        : {}),
    });
    return Boolean(created);
  } catch (err) {
    console.error("[crm] Synchronisation Notion échouée :", err);
    return false;
  }
}
