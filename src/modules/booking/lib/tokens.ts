/**
 * Jetons non-devinables pour la gestion d'une réservation (reschedule/cancel).
 * 32 octets aléatoires -> base64url. Ne donne accès qu'à UNE réservation.
 */

import { randomBytes } from "crypto";

/** Jeton de gestion (manage_token) : ~43 caractères base64url. */
export function generateManageToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Clé d'idempotence anti double-clic pour la soumission d'une réservation. */
export function generateIdempotencyKey(): string {
  return randomBytes(16).toString("base64url");
}

/**
 * Code court pour un lien personnalisé (/r/<code>). Alphabet sans caractères
 * ambigus (pas de 0/O/1/I/l) : lisible, partageable, insensible à la confusion.
 * 8 caractères -> ~1e12 combinaisons, largement suffisant et non énumérable.
 */
const LINK_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export function generateLinkCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += LINK_ALPHABET[bytes[i] % LINK_ALPHABET.length];
  }
  return out;
}
