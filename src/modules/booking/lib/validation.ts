/**
 * Validation légère (sans dépendance) des entrées utilisateur.
 * Renvoie soit { ok: true, value } soit { ok: false, error }.
 */

import type { QualificationInput, Situation } from "../types";

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITUATIONS: Situation[] = ["notion_mal", "pas_outil"];

const MAX = {
  name: 120,
  email: 200,
  activity: 200,
  motivation: 4000,
};

export function isEmail(v: string): boolean {
  return EMAIL_RE.test(v);
}

/**
 * Valide et normalise la charge du formulaire de qualification.
 * Le honeypot `company` doit rester vide (sinon on considère un bot).
 */
export function validateQualification(
  input: Partial<QualificationInput>,
): Validated<QualificationInput> {
  // Honeypot : rempli => bot. On renvoie une erreur générique.
  if (input.company && input.company.trim() !== "") {
    return { ok: false, error: "Requête invalide." };
  }

  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const activity = (input.activity ?? "").trim();
  const motivation = (input.motivation ?? "").trim();
  const situation = input.situation;
  const guestEmailRaw = (input.guestEmail ?? "").trim().toLowerCase();

  if (!name || name.length > MAX.name) {
    return { ok: false, error: "Nom complet requis." };
  }
  if (!email || email.length > MAX.email || !isEmail(email)) {
    return { ok: false, error: "Adresse e-mail invalide." };
  }
  if (!activity || activity.length > MAX.activity) {
    return { ok: false, error: "Activité requise." };
  }
  if (!situation || !SITUATIONS.includes(situation)) {
    return { ok: false, error: "Sélectionnez votre situation." };
  }
  if (!motivation || motivation.length > MAX.motivation) {
    return { ok: false, error: "Motivation requise." };
  }
  if (guestEmailRaw && !isEmail(guestEmailRaw)) {
    return { ok: false, error: "L'e-mail de l'invité est invalide." };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      activity,
      situation,
      motivation,
      guestEmail: guestEmailRaw || undefined,
    },
  };
}

/** Valide un instant ISO (créneau) : doit être une date valide, alignée. */
export function isIsoInstant(v: unknown): v is string {
  return typeof v === "string" && !Number.isNaN(Date.parse(v));
}
