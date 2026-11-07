/**
 * Registre des ressources publiées sous /ressources.
 *
 * Ajouter une ressource : créer `<slug>.ts` dans ce dossier (type `Ressource`),
 * puis l'ajouter au tableau ci-dessous. L'index, la page, le sitemap et
 * l'image OpenGraph sont générés automatiquement.
 */
import type { Ressource } from "./types";
import { memoireIaNotion } from "./memoire-ia-notion";

const ALL: Ressource[] = [memoireIaNotion];

/** Toutes les ressources, la plus récente en premier. */
export const ressources: readonly Ressource[] = [...ALL].sort((a, b) =>
  b.datePublication.localeCompare(a.datePublication),
);

export function getRessource(slug: string): Ressource | undefined {
  return ressources.find((r) => r.slug === slug);
}

/** Date affichée en français, ex. « 7 novembre 2026 ». */
export function formatDateFr(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export type { Ressource, RessourceSection, RessourceMedia } from "./types";
