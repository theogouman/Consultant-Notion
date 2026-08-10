"use client";

import { useRef } from "react";
import BookingFlow from "@/modules/booking/components/BookingFlow";

/**
 * Booker maison EMBARQUÉ dans la page (section « rendez-vous »).
 *
 * C'est le MÊME composant `BookingFlow` que celui ouvert en modal (aucun
 * doublon). Deux spécificités propres à cette section :
 *  - un en-tête (titre/sous-titre) sur-mesure, passé en prop `heading` ;
 *  - au moindre pas dans le tunnel (choix d'une date, puis d'un créneau), on
 *    recentre le bloc dans le viewport pour garder une visibilité complète sur
 *    le système pendant qu'on interagit avec.
 */
export default function EmbeddedBooking({
  heading,
}: {
  heading: { title: string; subtitle: string };
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const centerInView = () => {
    const el = wrapRef.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const doScroll = () => {
      const node = wrapRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const absTop = window.scrollY + rect.top;
      const vh = window.innerHeight;
      const margin = 24;
      // Plus haut que l'écran → on cale le haut ; sinon on centre.
      const target =
        rect.height >= vh - margin * 2
          ? absTop - margin
          : absTop - (vh - rect.height) / 2;
      window.scrollTo({
        top: Math.max(0, target),
        behavior: reduce ? "auto" : "smooth",
      });
    };

    // Laisse le morphisme du calendrier + l'animation de hauteur se stabiliser
    // avant de mesurer et recentrer.
    if (reduce) doScroll();
    else window.setTimeout(doScroll, 240);
  };

  return (
    <div
      ref={wrapRef}
      className="flex scroll-mt-6 flex-col overflow-hidden rounded-md border border-line bg-card nc-shadow-2"
    >
      <BookingFlow heading={heading} onInteract={centerInView} />
    </div>
  );
}
