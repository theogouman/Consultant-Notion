"use client";

import { createContext, useCallback, useContext, useState } from "react";
import QualificationModal from "./QualificationModal";

/**
 * Fournit l'ouverture du formulaire de qualification (modal multi-étapes) à
 * tous les CtaButton de la page. Le CTA unique de la landing ouvre ce modal.
 */
interface QualificationContext {
  open: () => void;
}

const Ctx = createContext<QualificationContext>({ open: () => {} });

export function useQualification() {
  return useContext(Ctx);
}

export default function QualificationProvider({
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
      <QualificationModal isOpen={isOpen} onClose={close} />
    </Ctx.Provider>
  );
}
