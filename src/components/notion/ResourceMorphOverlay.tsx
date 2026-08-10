"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
 *
 * Au clic, le panneau morphe de la géométrie de la carte vers le panneau
 * (rayon 16 → 24), le titre voyage en continu (clone « hero title ») et le
 * contenu fait un fondu enchaîné. La grille reste montée dessous.
 *
 * Points clés (corrections de fond) :
 *  - Toutes les géométries finales (panneau, image, titre) sont mesurées
 *    AVANT d'appliquer la moindre transform au panneau — sinon le rect du
 *    titre est lu « replié » et le clone saute à une position erronée.
 *  - La couverture ne subit PAS la mise à l'échelle non-uniforme du panneau
 *    (carte 16:10 vs panneau ~2.5:1, qui déforme un object-cover). Elle est
 *    morphée par une image « volante » dédiée dont on anime le CADRE
 *    (left/top/width/height) : object-cover recalcule le recadrage à chaque
 *    frame → aucune déformation.
 *  - useLayoutEffect : l'état initial est posé avant le paint (pas de flash).
 *
 * prefers-reduced-motion : morph désactivé (ouverture/fermeture nettes).
 */
export default function ResourceMorphOverlay() {
  const { cases, activeIndex, source, close, goTo } = useMorph();
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const panelImageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const flyImageRef = useRef<HTMLImageElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setMounted(true), []);

  const isOpen = activeIndex !== null;
  const active = isOpen ? cases[activeIndex] : null;

  // Verrou du scroll de fond.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const SPRING = { duration: SPRING_DURATION, easing: SPRING_EASING, fill: "forwards" as const };

  // Animation d'ouverture (layout effect : pose l'état initial avant paint).
  useLayoutEffect(() => {
    if (!isOpen || !source) return;
    const panel = panelRef.current;
    if (!panel) return;
    const panelImg = panelImageRef.current;
    const title = titleRef.current;
    const clone = cloneRef.current;
    const flyImg = flyImageRef.current;
    const backdrop = backdropRef.current;
    const body = bodyRef.current;

    const reveal = () => {
      panel.style.transform = "none";
      panel.style.borderRadius = `${PANEL_RADIUS}px`;
      if (panelImg) panelImg.style.opacity = "1";
      if (title) title.style.opacity = "1";
      if (body) body.style.opacity = "1";
      if (backdrop) backdrop.style.opacity = "1";
      if (clone) clone.style.opacity = "0";
      if (flyImg) flyImg.style.opacity = "0";
    };

    if (prefersReducedMotion()) {
      reveal();
      return;
    }

    // --- 1) MESURER LES CADRES FINAUX (panneau non transformé) ---
    const panelRect = panel.getBoundingClientRect();
    const panelImgRect = panelImg?.getBoundingClientRect() ?? null;
    const titleFinalRect = title?.getBoundingClientRect() ?? null;
    const { cardRect, titleRect, imageRect } = source;

    const sx = cardRect.width / panelRect.width;
    const sy = cardRect.height / panelRect.height;
    const tx = cardRect.left - panelRect.left;
    const ty = cardRect.top - panelRect.top;

    // Rayon contre-mis-à-l'échelle : le border-radius s'applique AVANT le
    // transform, donc un rayon r sur un panneau scalé (sx, sy) se voit r*sx /
    // r*sy → coins écrasés vers l'angle droit. On divise par le scale pour que
    // le rayon VISUEL reste circulaire et vaille CARD_RADIUS une fois replié.
    const fullRadius = `${PANEL_RADIUS}px / ${PANEL_RADIUS}px`;
    const foldedRadius = `${(CARD_RADIUS / sx).toFixed(2)}px / ${(CARD_RADIUS / sy).toFixed(2)}px`;

    // --- 2) POSER L'ÉTAT REPLIÉ (avant paint) ---
    panel.style.transformOrigin = "top left";
    panel.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    panel.style.borderRadius = foldedRadius;
    if (panelImg) panelImg.style.opacity = "0"; // masque la vraie couverture
    if (title) title.style.opacity = "0";
    if (body) body.style.opacity = "0";
    if (backdrop) backdrop.style.opacity = "0";

    // Image volante : positionnée sur la couverture de la carte.
    const doFly = flyImg && imageRect && panelImgRect;
    if (doFly) {
      flyImg.style.left = `${imageRect.left}px`;
      flyImg.style.top = `${imageRect.top}px`;
      flyImg.style.width = `${imageRect.width}px`;
      flyImg.style.height = `${imageRect.height}px`;
      // La couverture n'est arrondie qu'en HAUT (le bas rejoint le corps) :
      // les coins hauts restent arrondis pendant TOUT le morph (carte 16 →
      // panneau 24) au lieu de passer par des angles droits.
      flyImg.style.borderTopLeftRadius = `${CARD_RADIUS}px`;
      flyImg.style.borderTopRightRadius = `${CARD_RADIUS}px`;
      flyImg.style.borderBottomLeftRadius = "0px";
      flyImg.style.borderBottomRightRadius = "0px";
      flyImg.style.opacity = "1";
    }

    // Titre volant (FLIP depuis le titre de la carte).
    const doClone = !!(clone && title && titleFinalRect);
    let cloneFrom = "";
    if (doClone && titleFinalRect && title) {
      // Échelle UNIFORME = ratio des tailles de police (texte carte / panneau),
      // pas un ratio de largeurs (le titre carte est un bloc pleine largeur).
      const panelFont = parseFloat(getComputedStyle(title).fontSize) || 1;
      const scale = source.titleFontSize / panelFont || 1;
      clone.style.transformOrigin = "top left";
      clone.style.left = `${titleFinalRect.left}px`;
      clone.style.top = `${titleFinalRect.top}px`;
      clone.style.width = `${titleFinalRect.width}px`;
      cloneFrom = `translate(${titleRect.left - titleFinalRect.left}px, ${
        titleRect.top - titleFinalRect.top
      }px) scale(${scale})`;
      clone.style.transform = cloneFrom;
      clone.style.opacity = "1";
    }

    // --- 3) JOUER LES ANIMATIONS (2 rAF pour garantir l'état initial) ---
    let cancelled = false;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (cancelled) return;

        const pAnim = panel.animate(
          [
            {
              transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
              borderRadius: foldedRadius,
            },
            { transform: "translate(0,0) scale(1,1)", borderRadius: fullRadius },
          ],
          SPRING,
        );

        if (doFly && imageRect && panelImgRect) {
          flyImg.animate(
            [
              {
                left: `${imageRect.left}px`,
                top: `${imageRect.top}px`,
                width: `${imageRect.width}px`,
                height: `${imageRect.height}px`,
                borderTopLeftRadius: `${CARD_RADIUS}px`,
                borderTopRightRadius: `${CARD_RADIUS}px`,
              },
              {
                left: `${panelImgRect.left}px`,
                top: `${panelImgRect.top}px`,
                width: `${panelImgRect.width}px`,
                height: `${panelImgRect.height}px`,
                borderTopLeftRadius: `${PANEL_RADIUS}px`,
                borderTopRightRadius: `${PANEL_RADIUS}px`,
              },
            ],
            SPRING,
          );
        }

        if (doClone) {
          clone.animate(
            [{ transform: cloneFrom }, { transform: "translate(0,0) scale(1)" }],
            SPRING,
          );
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
            delay: SPRING_DURATION * 0.4,
            easing: FADE_IN_EASING,
            fill: "forwards",
          });
          body.style.opacity = "1";
        }

        pAnim.onfinish = reveal;
      }),
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, source, activeIndex]);

  function handleClose() {
    const panel = panelRef.current;
    if (!panel || !source || prefersReducedMotion()) {
      close();
      return;
    }
    const panelImg = panelImageRef.current;
    const title = titleRef.current;
    const clone = cloneRef.current;
    const flyImg = flyImageRef.current;
    const backdrop = backdropRef.current;
    const body = bodyRef.current;

    // Mesures finales (panneau au repos, transform none).
    const panelRect = panel.getBoundingClientRect();
    const panelImgRect = panelImg?.getBoundingClientRect() ?? null;
    const titleFinalRect = title?.getBoundingClientRect() ?? null;
    const { cardRect, titleRect, imageRect } = source;

    const sx = cardRect.width / panelRect.width;
    const sy = cardRect.height / panelRect.height;
    const tx = cardRect.left - panelRect.left;
    const ty = cardRect.top - panelRect.top;

    // Rayon contre-mis-à-l'échelle (cf. ouverture) : garde le coin circulaire à
    // CARD_RADIUS une fois replié, au lieu de l'écraser vers l'angle droit.
    const fullRadius = `${PANEL_RADIUS}px / ${PANEL_RADIUS}px`;
    const foldedRadius = `${(CARD_RADIUS / sx).toFixed(2)}px / ${(CARD_RADIUS / sy).toFixed(2)}px`;

    setClosing(true);

    // Image volante : part de la couverture du panneau vers la carte.
    if (flyImg && imageRect && panelImgRect) {
      if (panelImg) panelImg.style.opacity = "0";
      flyImg.style.left = `${panelImgRect.left}px`;
      flyImg.style.top = `${panelImgRect.top}px`;
      flyImg.style.width = `${panelImgRect.width}px`;
      flyImg.style.height = `${panelImgRect.height}px`;
      flyImg.style.borderTopLeftRadius = `${PANEL_RADIUS}px`;
      flyImg.style.borderTopRightRadius = `${PANEL_RADIUS}px`;
      flyImg.style.borderBottomLeftRadius = "0px";
      flyImg.style.borderBottomRightRadius = "0px";
      flyImg.style.opacity = "1";
      flyImg.animate(
        [
          {
            left: `${panelImgRect.left}px`,
            top: `${panelImgRect.top}px`,
            width: `${panelImgRect.width}px`,
            height: `${panelImgRect.height}px`,
            borderTopLeftRadius: `${PANEL_RADIUS}px`,
            borderTopRightRadius: `${PANEL_RADIUS}px`,
          },
          {
            left: `${imageRect.left}px`,
            top: `${imageRect.top}px`,
            width: `${imageRect.width}px`,
            height: `${imageRect.height}px`,
            borderTopLeftRadius: `${CARD_RADIUS}px`,
            borderTopRightRadius: `${CARD_RADIUS}px`,
          },
        ],
        SPRING,
      );
    }

    // Titre volant : de sa position finale vers le titre de la carte.
    if (clone && title && titleFinalRect) {
      const panelFont = parseFloat(getComputedStyle(title).fontSize) || 1;
      const scale = source.titleFontSize / panelFont || 1;
      clone.style.transformOrigin = "top left";
      clone.style.left = `${titleFinalRect.left}px`;
      clone.style.top = `${titleFinalRect.top}px`;
      clone.style.width = `${titleFinalRect.width}px`;
      clone.style.opacity = "1";
      title.style.opacity = "0";
      clone.animate(
        [
          { transform: "translate(0,0) scale(1)" },
          {
            transform: `translate(${titleRect.left - titleFinalRect.left}px, ${
              titleRect.top - titleFinalRect.top
            }px) scale(${scale})`,
          },
        ],
        SPRING,
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

    const pAnim = panel.animate(
      [
        { transform: "translate(0,0) scale(1,1)", borderRadius: fullRadius },
        {
          transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
          borderRadius: foldedRadius,
        },
      ],
      SPRING,
    );
    pAnim.onfinish = () => {
      setClosing(false);
      close();
    };
  }

  function navigate(delta: number) {
    if (activeIndex === null) return;
    const next = (activeIndex + delta + cases.length) % cases.length;
    const content = contentRef.current;
    if (content && !prefersReducedMotion()) {
      content.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: `translateY(${delta > 0 ? -12 : 12}px)` },
        ],
        { duration: 160, easing: FADE_OUT_EASING, fill: "forwards" },
      ).onfinish = () => {
        goTo(next);
        requestAnimationFrame(() => {
          content.animate(
            [
              { opacity: 0, transform: `translateY(${delta > 0 ? 12 : -12}px)` },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 220, easing: FADE_IN_EASING, fill: "forwards" },
          );
        });
      };
    } else {
      goTo(next);
    }
  }

  // Échap + navigation flèches.
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
        style={{ opacity: 0 }}
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-y-auto px-4 py-6 sm:py-12">
        <div
          ref={panelRef}
          className="nc-shadow-2 pointer-events-auto relative my-auto w-full max-w-[720px] overflow-hidden bg-card"
          style={{ borderRadius: PANEL_RADIUS }}
        >
          <div ref={contentRef}>
            {active.coverUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={panelImageRef}
                src={active.coverUrl}
                alt=""
                className="h-56 w-full object-cover sm:h-72"
              />
            )}

            <div className="p-6 sm:p-10">
              <div className="mb-6 flex items-start justify-between gap-4">
                <h2 ref={titleRef} className="nc-title text-2xl sm:text-3xl">
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
      </div>

      {/* Image volante (couverture) — morphée par son cadre, hors du panneau. */}
      {active.coverUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={flyImageRef}
          src={active.coverUrl}
          alt=""
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[60] object-cover"
          style={{ opacity: 0, willChange: "left, top, width, height" }}
        />
      )}

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
