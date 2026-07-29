"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMorph } from "./MorphSourceContext";
import ResourceContentBody from "./ResourceContentBody";
import {
  SPRING_EASING,
  SPRING_DURATION,
  FADE_IN_EASING,
  FADE_OUT_EASING,
  CARD_RADIUS,
  PANEL_RADIUS,
  prefersReducedMotion,
} from "@/lib/spring";

/**
 * Overlay du morph iOS (§6).
 * Repris de Notion-Club/Infrastructure (ResourceMorphOverlay.tsx).
 *
 * Au clic, une surface clippée morphe de la géométrie de la carte vers le
 * panneau (rayon 16 → 24), le titre voyage en continu (hero title) et le
 * contenu fait un fondu enchaîné. La grille reste montée dessous (zéro
 * re-fetch). Fermeture = morph inverse vers la carte.
 *
 * prefers-reduced-motion : le morph est désactivé (ouverture/fermeture nettes).
 */
export default function ResourceMorphOverlay() {
  const { cases, activeIndex, source, close, goTo } = useMorph();
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setMounted(true), []);

  const isOpen = activeIndex !== null;
  const active = isOpen ? cases[activeIndex] : null;

  // Verrouille le scroll de l'arrière-plan pendant l'ouverture.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Animation d'ouverture.
  useEffect(() => {
    if (!isOpen || !source) return;
    const panel = panelRef.current;
    const clone = cloneRef.current;
    const backdrop = backdropRef.current;
    const body = bodyRef.current;
    const title = titleRef.current;
    if (!panel) return;

    if (prefersReducedMotion()) {
      if (clone) clone.style.opacity = "0";
      if (title) title.style.opacity = "1";
      if (backdrop) backdrop.style.opacity = "1";
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const { cardRect, titleRect } = source;

    const sx = cardRect.width / panelRect.width;
    const sy = cardRect.height / panelRect.height;
    const tx = cardRect.left - panelRect.left;
    const ty = cardRect.top - panelRect.top;

    // État initial : panneau replié sur la carte, contenu masqué.
    panel.style.transformOrigin = "top left";
    panel.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    panel.style.borderRadius = `${CARD_RADIUS}px`;
    if (title) title.style.opacity = "0";
    if (body) body.style.opacity = "0";
    if (backdrop) backdrop.style.opacity = "0";

    // Titre voyageur (clone) : positionné sur le titre de la carte.
    let titleFinalRect: DOMRect | null = null;
    if (clone && title) {
      titleFinalRect = title.getBoundingClientRect();
      const cs = titleRect.height / titleFinalRect.height || 1;
      clone.style.transformOrigin = "top left";
      clone.style.left = `${titleFinalRect.left}px`;
      clone.style.top = `${titleFinalRect.top}px`;
      clone.style.width = `${titleFinalRect.width}px`;
      clone.style.transform = `translate(${titleRect.left - titleFinalRect.left}px, ${
        titleRect.top - titleFinalRect.top
      }px) scale(${cs})`;
      clone.style.opacity = "1";
    }

    let cancelled = false;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (cancelled) return;

        panel.animate(
          [
            {
              transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
              borderRadius: `${CARD_RADIUS}px`,
            },
            { transform: "translate(0,0) scale(1,1)", borderRadius: `${PANEL_RADIUS}px` },
          ],
          { duration: SPRING_DURATION, easing: SPRING_EASING, fill: "forwards" },
        ).onfinish = () => {
          panel.style.transform = "none";
          panel.style.borderRadius = `${PANEL_RADIUS}px`;
        };

        if (clone) {
          clone
            .animate(
              [
                { transform: clone.style.transform, opacity: 1 },
                { transform: "translate(0,0) scale(1)", opacity: 0 },
              ],
              { duration: SPRING_DURATION, easing: SPRING_EASING, fill: "forwards" },
            ).onfinish = () => {
            clone.style.opacity = "0";
            if (title) title.style.opacity = "1";
          };
        } else if (title) {
          title.style.opacity = "1";
        }

        if (backdrop) {
          backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: SPRING_DURATION,
            easing: FADE_IN_EASING,
            fill: "forwards",
          });
          backdrop.style.opacity = "1";
        }

        if (body) {
          body.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: SPRING_DURATION,
            delay: SPRING_DURATION * 0.35,
            easing: FADE_IN_EASING,
            fill: "forwards",
          });
          body.style.opacity = "1";
        }
      }),
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // On (re)joue l'ouverture au changement de cas actif.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, source, activeIndex]);

  function handleClose() {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    const body = bodyRef.current;
    const title = titleRef.current;
    const clone = cloneRef.current;

    if (!panel || !source || prefersReducedMotion()) {
      close();
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const { cardRect, titleRect } = source;
    const sx = cardRect.width / panelRect.width;
    const sy = cardRect.height / panelRect.height;
    const tx = cardRect.left - panelRect.left;
    const ty = cardRect.top - panelRect.top;

    setClosing(true);

    // Titre : repart vers la carte.
    if (clone && title) {
      const titleFinalRect = title.getBoundingClientRect();
      const cs = titleRect.height / titleFinalRect.height || 1;
      clone.style.transformOrigin = "top left";
      clone.style.left = `${titleFinalRect.left}px`;
      clone.style.top = `${titleFinalRect.top}px`;
      clone.style.width = `${titleFinalRect.width}px`;
      clone.style.opacity = "1";
      title.style.opacity = "0";
      clone.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 0 },
          {
            transform: `translate(${titleRect.left - titleFinalRect.left}px, ${
              titleRect.top - titleFinalRect.top
            }px) scale(${cs})`,
            opacity: 1,
          },
        ],
        { duration: SPRING_DURATION, easing: SPRING_EASING, fill: "forwards" },
      );
    }

    if (body) {
      body.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: SPRING_DURATION * 0.5,
        easing: FADE_OUT_EASING,
        fill: "forwards",
      });
    }
    if (backdrop) {
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: SPRING_DURATION,
        easing: FADE_OUT_EASING,
        fill: "forwards",
      });
    }

    const anim = panel.animate(
      [
        { transform: "translate(0,0) scale(1,1)", borderRadius: `${PANEL_RADIUS}px` },
        {
          transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
          borderRadius: `${CARD_RADIUS}px`,
        },
      ],
      { duration: SPRING_DURATION, easing: SPRING_EASING, fill: "forwards" },
    );
    anim.onfinish = () => {
      setClosing(false);
      close();
    };
  }

  function navigate(delta: number) {
    if (activeIndex === null) return;
    const next = (activeIndex + delta + cases.length) % cases.length;
    // Fondu simple du contenu (sans re-morph) pour prev/suivant.
    const body = bodyRef.current;
    if (body && !prefersReducedMotion()) {
      body.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: `translateY(${delta > 0 ? -12 : 12}px)` },
        ],
        { duration: 160, easing: FADE_OUT_EASING, fill: "forwards" },
      ).onfinish = () => {
        goTo(next);
        requestAnimationFrame(() => {
          body.animate(
            [
              { opacity: 0, transform: `translateY(${delta > 0 ? 12 : -12}px)` },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 200, easing: FADE_IN_EASING, fill: "forwards" },
          );
        });
      };
    } else {
      goTo(next);
    }
  }

  // Fermeture au clavier (Échap) + navigation flèches.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft") navigate(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex]);

  if (!mounted || !isOpen || !active) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={active.title}
      className="fixed inset-0 z-50"
    >
      <div
        ref={backdropRef}
        onClick={handleClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-y-auto px-4 py-6 sm:py-12">
        <div
          ref={panelRef}
          className="nc-shadow-2 pointer-events-auto relative my-auto w-full max-w-[720px] overflow-hidden bg-card"
          style={{ borderRadius: PANEL_RADIUS }}
        >
          {active.coverUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={active.coverUrl}
              alt=""
              className="h-56 w-full object-cover sm:h-72"
            />
          )}

          <div className="p-6 sm:p-10">
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2
                ref={titleRef}
                className="nc-title text-2xl sm:text-3xl"
              >
                {active.title}
              </h2>
              <button
                onClick={handleClose}
                aria-label="Fermer"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-raised text-muted transition-colors hover:bg-line hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div ref={bodyRef}>
              <ResourceContentBody caseStudy={active} />
            </div>

            {cases.length > 1 && (
              <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
                <button
                  onClick={() => navigate(-1)}
                  className="text-sm font-medium text-muted transition-colors hover:text-accent"
                >
                  ← Cas précédent
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="text-sm font-medium text-muted transition-colors hover:text-accent"
                >
                  Cas suivant →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Titre voyageur (hero title) — au-dessus, découplé du panneau. */}
      <div
        ref={cloneRef}
        aria-hidden
        className="nc-title pointer-events-none fixed z-[60] text-2xl opacity-0 sm:text-3xl"
        style={{ opacity: 0 }}
      >
        {active.title}
      </div>

      {closing && <span className="sr-only">Fermeture…</span>}
    </div>,
    document.body,
  );
}
