/**
 * Physique du morph iOS (§6 du brief).
 * Repris tel quel de Notion-Club/Infrastructure (src/modules/ressources/lib/spring.ts).
 * Ressort critiquement amorti (ζ=1, aucun rebond), durée 482 ms,
 * easing échantillonné en linear().
 */

export const SPRING_EASING =
  "linear(0 0%, 0.0418 4.2%, 0.1361 8.3%, 0.251 12.5%, 0.368 16.7%, 0.4772 20.8%, 0.5742 25%, 0.6573 29.2%, 0.7269 33.3%, 0.7841 37.5%, 0.8305 41.7%, 0.8677 45.8%, 0.8973 50%, 0.9206 54.2%, 0.9388 58.3%, 0.9531 62.5%, 0.9641 66.7%, 0.9726 70.8%, 0.9791 75%, 0.9841 79.2%, 0.988 83.3%, 0.9909 87.5%, 0.9931 91.7%, 0.9948 95.8%, 1 100%)";

export const SPRING_DURATION = 482;

export const FADE_OUT_EASING = "cubic-bezier(0.4, 0, 1, 1)";
export const FADE_IN_EASING = "cubic-bezier(0, 0, 0.2, 1)";

/** Rayons de la surface morphée : carte (16) → panneau (24). */
export const CARD_RADIUS = 16;
export const PANEL_RADIUS = 24;

/** Respecte prefers-reduced-motion : désactive le morph. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
