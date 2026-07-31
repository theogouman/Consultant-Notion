"use client";

import { createContext, useCallback, useContext, useState } from "react";
import BookingModal from "./BookingModal";

/**
 * Fournit l'ouverture du modal de réservation à tous les CtaButton de la page.
 * Tout vit sur la page principale : cliquer un CTA ouvre le modal (pas de route
 * /rdv dédiée).
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

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <BookingModal isOpen={isOpen} onClose={close} />
    </Ctx.Provider>
  );
}
