"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BookingFlow from "./BookingFlow";

/**
 * Modal de réservation (§2). Desktop : carte centrée + arrière-plan flouté.
 * Mobile : feuille qui remonte du bas jusqu'aux ~3/4 de l'écran, le fond de la
 * page reste visible au-dessus, avec une croix pour fermer.
 *
 * La barre de progression et le contenu vivent dans BookingFlow ; le panneau a
 * `overflow-hidden` pour rogner proprement la barre sur les coins arrondis.
 */
export default function BookingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [render, setRender] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => setMounted(true), []);

  // Ouverture -> montage immédiat. Fermeture -> jouer la sortie puis démonter.
  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setClosing(false);
      return;
    }
    if (render) {
      setClosing(true);
      const t = window.setTimeout(() => {
        setRender(false);
        setClosing(false);
      }, 320);
      return () => window.clearTimeout(t);
    }
  }, [isOpen, render]);

  // Verrou du scroll de fond + fermeture au clavier (Échap).
  useEffect(() => {
    if (!render) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [render, onClose]);

  if (!mounted || !render) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Réserver un appel"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div
        className={`nc-booking-backdrop absolute inset-0 bg-black/40 sm:bg-black/30 sm:backdrop-blur-sm ${closing ? "is-closing" : ""}`}
        onClick={onClose}
        aria-hidden
      />

      <div
        className={`nc-booking-panel relative flex w-full max-h-[75vh] flex-col overflow-hidden rounded-t-2xl bg-card nc-shadow-2 sm:m-4 sm:max-h-[85vh] sm:max-w-xl sm:rounded-md ${closing ? "is-closing" : ""}`}
      >
        {/* Poignée (mobile) */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* Fermer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-raised/80 text-muted backdrop-blur-sm transition-colors hover:bg-line hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>

        <BookingFlow />
      </div>
    </div>,
    document.body,
  );
}
