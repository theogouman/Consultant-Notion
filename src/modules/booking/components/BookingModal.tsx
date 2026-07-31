"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BookingFlow from "./BookingFlow";

/**
 * Modal de réservation (§2). Desktop : carte centrée + arrière-plan flouté.
 * Mobile : feuille qui remonte du bas, hauteur FIXE (85vh) — elle ne change pas
 * de taille d'une question à l'autre. Le fond de page reste visible au-dessus,
 * avec une croix pour fermer.
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

  // Gèle TOUTE la page pendant l'ouverture (technique position:fixed, safe iOS)
  // + fermeture au clavier (Échap).
  useEffect(() => {
    if (!render) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
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
        className={`nc-booking-panel relative flex h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card nc-shadow-2 sm:m-4 sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-md ${closing ? "is-closing" : ""}`}
      >
        {/* Fermer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-raised/80 text-muted backdrop-blur-sm transition-colors hover:bg-line hover:text-ink"
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
