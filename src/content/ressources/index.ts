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

const NBSP = "\u00a0";

/**
 * Typographie française : espace insécable après « et avant », ? ! : ;
 * (évite un guillemet ou un point d'interrogation seul en début de ligne).
 */
export function frenchTypo(text: string): string {
  return text
    .replace(/« /g, `«${NBSP}`)
    .replace(/ (»|[?!:;])/g, `${NBSP}$1`);
}

/** Applique `frenchTypo` à toutes les chaînes d'une ressource. */
function withTypo<T>(value: T): T {
  if (typeof value === "string") return frenchTypo(value) as T;
  if (Array.isArray(value)) return value.map(withTypo) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, withTypo(v)]),
    ) as T;
  }
  return value;
}

/** Toutes les ressources, la plus récente en premier. */
export const ressources: readonly Ressource[] = ALL.map(withTypo).sort((a, b) =>
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
