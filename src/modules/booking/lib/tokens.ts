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
