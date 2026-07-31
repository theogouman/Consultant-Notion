"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Anime la hauteur du conteneur quand son contenu change (transitions.dev ·
 * card-resize). Un ResizeObserver mesure le contenu réel et tween la hauteur
 * du wrapper via `.t-resize` (transition CSS sur `height`).
 *
 * Désactivé sur mobile (< 640px) : la feuille garde une taille fixe et ne doit
 * pas se redimensionner à chaque question — le contenu défile à l'intérieur.
 *
 * `overflow` reste `visible` au repos (pour ne pas rogner un dropdown ouvert)
 * et passe à `hidden` uniquement pendant le tween.
 */
export default function ResizeAnimator({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<number>(-1);
  const [enabled, setEnabled] = useState(false);

  // Active l'animation seulement sur desktop (>= 640px).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    if (!enabled) {
      // Mobile : hauteur auto, pas d'animation.
      outer.style.height = "";
      outer.style.overflow = "visible";
      lastRef.current = -1;
      return;
    }

    const apply = (animate: boolean) => {
      const h = inner.offsetHeight;
      if (h === lastRef.current) return;
      lastRef.current = h;
      if (!animate) {
        outer.style.height = `${h}px`;
        return;
      }
      outer.style.overflow = "hidden";
      outer.style.height = `${h}px`;
    };

    apply(false);

    const ro = new ResizeObserver(() => apply(true));
    ro.observe(inner);

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === "height") outer.style.overflow = "visible";
    };
    outer.addEventListener("transitionend", onEnd);

    return () => {
      ro.disconnect();
      outer.removeEventListener("transitionend", onEnd);
    };
  }, [enabled]);

  return (
    <div ref={outerRef} className={enabled ? "t-resize" : ""} style={{ overflow: "visible" }}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
