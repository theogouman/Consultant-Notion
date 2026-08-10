"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CaseStudyDetail } from "@/lib/notion/types";

/**
 * Contexte du morph iOS (§6).
 * Repris de Notion-Club/Infrastructure (MorphSourceContext.tsx).
 * Capture la géométrie de la carte + du titre au clic, expose open/close
 * et la navigation cas précédent / suivant.
 */

export interface MorphSource {
  cardRect: DOMRect;
  titleRect: DOMRect;
  /** Taille de police du titre de la carte (px) : sert à calculer l'échelle
   *  UNIFORME du clone (ratio de police), et non un ratio de largeurs de blocs
   *  — le titre de carte est un bloc pleine largeur, celui du panneau un flex
   *  ajusté au texte, donc les largeurs ne sont pas comparables. */
  titleFontSize: number;
  /** Géométrie de la couverture de la carte (pour le morph d'image). */
  imageRect: DOMRect | null;
  coverUrl: string | null;
}

interface MorphState {
  cases: CaseStudyDetail[];
  activeIndex: number | null;
  source: MorphSource | null;
  open: (index: number, source: MorphSource) => void;
  close: () => void;
  goTo: (index: number, source?: MorphSource) => void;
}

const MorphContext = createContext<MorphState | null>(null);

export function MorphProvider({
  cases,
  children,
}: {
  cases: CaseStudyDetail[];
  children: React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [source, setSource] = useState<MorphSource | null>(null);

  const open = useCallback((index: number, src: MorphSource) => {
    setSource(src);
    setActiveIndex(index);
  }, []);

  const close = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const goTo = useCallback((index: number, src?: MorphSource) => {
    if (src) setSource(src);
    setActiveIndex(index);
  }, []);

  const value = useMemo(
    () => ({ cases, activeIndex, source, open, close, goTo }),
    [cases, activeIndex, source, open, close, goTo],
  );

  return <MorphContext.Provider value={value}>{children}</MorphContext.Provider>;
}

export function useMorph(): MorphState {
  const ctx = useContext(MorphContext);
  if (!ctx) throw new Error("useMorph doit être utilisé dans un MorphProvider");
  return ctx;
}
