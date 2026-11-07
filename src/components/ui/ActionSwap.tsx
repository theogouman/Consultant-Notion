"use client";

import { useEffect, useState } from "react";

/**
 * Contenu de bouton à états (icône + libellé) avec transition « action swap
 * blur » (inspirée de beui.dev) : l'ancien état sort en flou pendant que le
 * nouveau entre. CSS pur (classes `nc-swap-*` de globals.css), sans
 * dépendance d'animation. Pas d'animation au premier rendu.
 */
export interface SwapItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

const EXIT_MS = 160;

export default function ActionSwap({ item }: { item: SwapItem }) {
  const [state, setState] = useState<{ cur: SwapItem; prev: SwapItem | null; n: number }>({
    cur: item,
    prev: null,
    n: 0,
  });

  useEffect(() => {
    if (item.id === state.cur.id) {
      // Même état : on rafraîchit seulement le contenu (libellé modifié).
      if (item !== state.cur) setState((s) => ({ ...s, cur: item }));
      return;
    }
    setState((s) => ({ cur: item, prev: s.cur, n: s.n + 1 }));
    const t = setTimeout(() => setState((s) => ({ ...s, prev: null })), EXIT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const { cur, prev, n } = state;
  const animated = n > 0;

  return (
    <>
      {(cur.icon || prev?.icon) && (
        <span className="nc-swap-slot h-4 w-4 flex-none" aria-hidden>
          {prev?.icon && (
            <span key={`p-${prev.id}-${n}`} className="nc-swap-icon-out flex">
              {prev.icon}
            </span>
          )}
          {cur.icon && (
            <span key={`c-${cur.id}-${n}`} className={`flex ${animated ? "nc-swap-icon-in" : ""}`}>
              {cur.icon}
            </span>
          )}
        </span>
      )}
      {/* L'ancien libellé sort hors flux (superposé, centré) : la largeur
          s'ajuste tout de suite au nouveau libellé, sans saut en fin de sortie. */}
      <span className="relative inline-flex justify-center">
        {prev && (
          <span
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap"
            aria-hidden
          >
            <span key={`p-${prev.id}-${n}`} className="nc-swap-text-out inline-block">
              {prev.label}
            </span>
          </span>
        )}
        <span key={`c-${cur.id}-${n}`} className={`inline-block ${animated ? "nc-swap-text-in" : ""}`}>
          {cur.label}
        </span>
      </span>
    </>
  );
}
