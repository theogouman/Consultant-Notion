"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Anime la hauteur du conteneur quand son contenu change (transitions.dev ·
 * card-resize). Un ResizeObserver mesure le contenu réel et tween la hauteur
 * du wrapper via `.t-resize` (transition CSS sur `height`).
 *
 * `overflow` reste `visible` au repos (pour ne pas rogner un dropdown ouvert)
 * et passe à `hidden` uniquement pendant le tween.
 */
export default function ResizeAnimator({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<number>(-1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

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

    // Hauteur initiale posée sans animation.
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
  }, []);

  return (
    <div ref={outerRef} className="t-resize" style={{ overflow: "visible" }}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
