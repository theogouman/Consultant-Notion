"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import BookingModal from "./BookingModal";
import { captureAcquisitionFromUrl } from "../lib/acquisition";

/**
 * Fournit l'ouverture du modal de réservation à tous les CtaButton de la page.
 * Tout vit sur la page principale : cliquer un CTA ouvre le modal (pas de route
 * /rdv dédiée).
 *
 * Paramètres d'URL pris en charge au chargement :
 *   - `?l=1`            -> ouvre directement le calendrier (un clic de moins
 *                          depuis un lien de post / bio / newsletter).
 *   - `?source=&post=`  -> attribution du lead, mémorisée pour l'onglet et
 *                          envoyée au CRM à la réservation.
 */
interface BookingContext {
  open: () => void;
}

const Ctx = createContext<BookingContext>({ open: () => {} });

export function useBooking() {
  return useContext(Ctx);
}

export default function BookingModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Lecture des paramètres d'URL au montage. On passe par window plutôt que
  // par useSearchParams : la page reste statique (ISR) au lieu de basculer en
  // rendu client. L'ouverture se fait après l'hydratation, donc sans surprise
  // de SSR (le modal est déjà monté dans un portail côté client uniquement).
  useEffect(() => {
    captureAcquisitionFromUrl();
    const params = new URLSearchParams(window.location.search);
    if (params.get("l") === "1") setIsOpen(true);
  }, []);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <BookingModal isOpen={isOpen} onClose={close} />
    </Ctx.Provider>
  );
}
