/**
 * Canal d'acquisition — traçabilité de l'origine du lead.
 *
 * Deux paramètres d'URL, lus au chargement de la page et conservés le temps de
 * l'onglet (sessionStorage) pour survivre à la navigation interne :
 *   - `source` : d'où vient le clic (ex. `linkedin`, `youtube`, `newsletter`)
 *   - `post`   : quelle publication précisément (ex. `carrousel-notion-crm`)
 *
 * À la réservation, la valeur formatée `source⎜post` part dans le CRM Notion
 * (propriété « Canal d'acquisition ») et dans la notification interne.
 *
 * Ce fichier est isomorphe : les fonctions pures (sanitize / format) servent
 * côté serveur, les fonctions de capture ne touchent au DOM que côté client.
 */

/** Séparateur exact demandé entre la source et la publication. */
export const CHANNEL_SEPARATOR = "⎜";

/** Clé de persistance (onglet courant uniquement). */
const STORAGE_KEY = "nc:acquisition";

/** Longueur max d'un paramètre (au-delà : tronqué, jamais rejeté). */
const MAX_LEN = 120;

export interface Acquisition {
  source: string | null;
  post: string | null;
}

export const EMPTY_ACQUISITION: Acquisition = { source: null, post: null };

/**
 * Normalise un paramètre : chaîne, sans caractères de contrôle, trimée et
 * bornée. Renvoie `null` si vide — un paramètre absent et un paramètre vide
 * sont traités à l'identique.
 */
export function sanitizeAcquisitionParam(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const clean = raw
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LEN)
    .trim();
  return clean || null;
}

/**
 * Valeur écrite dans « Canal d'acquisition » :
 *   - les deux présents  -> `source⎜post`
 *   - un seul présent    -> la valeur seule (pas de séparateur orphelin)
 *   - aucun des deux     -> chaîne vide (propriété laissée vide)
 */
export function formatAcquisitionChannel(acq: Acquisition): string {
  const source = sanitizeAcquisitionParam(acq.source);
  const post = sanitizeAcquisitionParam(acq.post);
  if (source && post) return `${source}${CHANNEL_SEPARATOR}${post}`;
  return source ?? post ?? "";
}

/* -------------------------------------------------------------------------- */
/* Capture côté client                                                         */
/* -------------------------------------------------------------------------- */

/** Repli mémoire : sessionStorage peut être indisponible (mode restreint). */
let memory: Acquisition = EMPTY_ACQUISITION;

function hasValue(acq: Acquisition): boolean {
  return Boolean(acq.source || acq.post);
}

function readStorage(): Acquisition | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Acquisition>;
    return {
      source: sanitizeAcquisitionParam(parsed.source),
      post: sanitizeAcquisitionParam(parsed.post),
    };
  } catch {
    return null;
  }
}

function writeStorage(acq: Acquisition): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(acq));
  } catch {
    /* stockage indisponible : le repli mémoire suffit pour la visite en cours. */
  }
}

/**
 * Lit `?source=` / `?post=` dans l'URL et les mémorise pour l'onglet.
 * Premier contact gagnant : une visite ultérieure sans paramètre conserve
 * l'attribution déjà capturée.
 */
export function captureAcquisitionFromUrl(search?: string): Acquisition {
  if (typeof window === "undefined") return EMPTY_ACQUISITION;

  const params = new URLSearchParams(search ?? window.location.search);
  const fromUrl: Acquisition = {
    source: sanitizeAcquisitionParam(params.get("source")),
    post: sanitizeAcquisitionParam(params.get("post")),
  };

  if (hasValue(fromUrl)) {
    memory = fromUrl;
    writeStorage(fromUrl);
    return memory;
  }

  return getAcquisition();
}

/** Attribution retenue pour la visite (URL déjà capturée, ou onglet en cours). */
export function getAcquisition(): Acquisition {
  if (hasValue(memory)) return memory;
  if (typeof window === "undefined") return EMPTY_ACQUISITION;
  const stored = readStorage();
  if (stored && hasValue(stored)) memory = stored;
  return memory;
}
