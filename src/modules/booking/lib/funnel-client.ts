"use client";

/**
 * Identifiant de session du tunnel, côté client. Généré une fois et conservé
 * en sessionStorage pour relier la progression (best-effort) d'un visiteur.
 */

const STORAGE_KEY = "nc:funnel:sid";
let cached: string | null = null;

export function getFunnelSid(): string {
  if (cached) return cached;
  try {
    let v = sessionStorage.getItem(STORAGE_KEY);
    if (!v) {
      v = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, v);
    }
    cached = v;
    return v;
  } catch {
    // Mode privé / stockage bloqué : id en mémoire pour la session courante.
    if (!cached) cached = crypto.randomUUID();
    return cached;
  }
}
