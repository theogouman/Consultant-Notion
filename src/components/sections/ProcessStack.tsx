"use client";

import { useEffect, useRef } from "react";
import Reveal from "@/components/ui/Reveal";
import { howItWorks } from "@/lib/content";

/**
 * Bloc 6 — « Comment ça se passe » : cartes qui s'empilent au scroll.
 *
 * Mécanique portée de theogouman/sales-offers (section « On inclut tout ça… ») :
 * un conteneur `.nc-proc-scroll` de hauteur `nbCartes * 100vh` crée la distance
 * de défilement ; `.nc-proc-sticky` est collé ; au scroll on calcule une
 * progression [0..1] et chaque carte de la pile monte du bas (translateY 100%→0
 * + scale 0.96→1, easeOut) et se cale avec un léger décalage vertical.
 * Chaque carte porte un visuel animé qui (re)joue quand la carte devient active.
 * Repli prefers-reduced-motion : flux normal (cartes empilées statiquement).
 */

const STEP_PILLS = [
  ["Gratuit", "20 min"],
  ["Analyse", "Diagnostic"],
  ["Sur-mesure", "Clé en main"],
  ["Équipe", "Autonomie"],
];

export default function ProcessStack() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroll = scrollRef.current;
    const sticky = stickyRef.current;
    const cardsArea = cardsRef.current;
    if (!scroll || !sticky || !cardsArea) return;

    const cards = Array.from(
      cardsArea.querySelectorAll<HTMLElement>(".nc-proc-card"),
    );
    if (cards.length === 0) return;

    const baseCard = cards[0];
    const stackCards = cards.slice(1);
    const totalCards = cards.length;
    const segments = totalCards - 1;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const playVisual = (idx: number) => {
      cards.forEach((c, i) => c.classList.toggle("is-active", i === idx));
      const vis = cards[idx]?.querySelector<HTMLElement>(".nc-proc-visual");
      if (vis) {
        vis.classList.remove("play");
        void vis.offsetWidth; // reflow → rejoue l'animation
        vis.classList.add("play");
      }
    };

    if (reduce || segments <= 0) {
      // Flux normal : tout visible, tous les visuels joués.
      cards.forEach((c) => c.classList.add("is-active", "is-static"));
      cards.forEach((c) =>
        c.querySelector(".nc-proc-visual")?.classList.add("play"),
      );
      return;
    }

    let resizeT = 0;
    const layout = () => {
      scroll.style.height = totalCards * 100 + "vh";
      const header = sticky.querySelector<HTMLElement>(".nc-proc-header");
      const headerH = header ? header.offsetHeight : 0;
      const vh = window.innerHeight;
      const isDesktop = window.innerWidth >= 768;
      let cardH = vh - headerH - 24;
      cardH = Math.min(cardH, isDesktop ? 400 : 540);
      cardH = Math.max(cardH, 260);
      baseCard.style.height = cardH + "px";
      stackCards.forEach((c) => (c.style.height = cardH + "px"));
    };
    layout();
    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(layout, 150);
    };
    window.addEventListener("resize", onResize);

    stackCards.forEach((card, i) => {
      card.style.zIndex = String(20 + i * 10);
      card.style.transform = "translateY(100%) scale(0.96)";
      card.style.visibility = "hidden";
    });

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const landStep = 12;
    let prevActive = -1;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const rect = scroll.getBoundingClientRect();
        const scrolled = -rect.top;
        const totalDist = scroll.offsetHeight - window.innerHeight;
        if (totalDist <= 0) return;
        const progress = Math.max(0, Math.min(1, scrolled / totalDist));

        let topCard = 0;
        for (let i = 0; i < segments; i++) {
          const segStart = i / segments;
          const segEnd = (i + 1) / segments;
          const local = Math.max(
            0,
            Math.min(1, (progress - segStart) / (segEnd - segStart)),
          );
          if (local > 0) topCard = i + 1;
        }
        if (topCard !== prevActive) {
          playVisual(topCard);
          prevActive = topCard;
        }

        for (let i = 0; i < segments; i++) {
          const card = stackCards[i];
          if (!card) continue;
          const segStart = i / segments;
          const segEnd = (i + 1) / segments;
          const local = Math.max(
            0,
            Math.min(1, (progress - segStart) / (segEnd - segStart)),
          );
          const e = easeOut(local);
          card.style.visibility = local > 0 ? "visible" : "hidden";
          const landY = (i + 1) * landStep;
          const ty = (100 * (1 - e)).toFixed(1);
          const sc = (0.96 + 0.04 * e).toFixed(4);
          card.style.transform = `translate3d(0, calc(${ty}% + ${landY}px), 0) scale(${sc})`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeT);
    };
  }, []);

  return (
    <section id="deroule" className="nc-proc">
      <div ref={scrollRef} className="nc-proc-scroll">
        <div ref={stickyRef} className="nc-proc-sticky">
          <Reveal className="nc-proc-header">
            <p className="nc-eyebrow mb-3">{howItWorks.eyebrow}</p>
            <h2 className="nc-title text-3xl sm:text-4xl">{howItWorks.title}</h2>
            <p className="mt-3 text-lg text-muted">{howItWorks.subtitle}</p>
          </Reveal>

          <div ref={cardsRef} className="nc-proc-cards">
            {howItWorks.steps.map((step, i) => (
              <article key={i} className="nc-proc-card" data-step={i}>
                <div className="nc-proc-grid">
                  <div className="nc-proc-content">
                    <div className="nc-proc-pills">
                      {STEP_PILLS[i]?.map((p) => (
                        <span key={p} className="nc-proc-pill">
                          {p}
                        </span>
                      ))}
                    </div>
                    <div className="nc-proc-quote">
                      <span className="nc-proc-num" aria-hidden>
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="nc-proc-title">{step.title}</h3>
                        <p className="nc-proc-desc">{step.body}</p>
                      </div>
                    </div>
                  </div>
                  <div className="nc-proc-visual" aria-hidden>
                    <StepVisual step={i} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Visuels animés (rejoués quand la carte devient active via `.play`). */
function StepVisual({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="nc-v-chat">
        <div className="nc-v-bubble nc-v-bubble--in">
          On est un peu perdus dans notre organisation…
        </div>
        <div className="nc-v-bubble nc-v-bubble--out">
          On regarde ça ensemble ?
        </div>
        <div className="nc-v-typing">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }
  if (step === 1) {
    const items = [
      "Outils éparpillés",
      "Process implicites",
      "Notion en friche",
      "Doublons partout",
    ];
    return (
      <ul className="nc-v-audit">
        {items.map((it, i) => (
          <li key={i} className="nc-v-audit-row" style={{ ["--i" as string]: i }}>
            <span className="nc-v-check">
              <svg viewBox="0 0 16 16" aria-hidden>
                <path
                  d="M3 8.5l3 3 7-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {it}
          </li>
        ))}
      </ul>
    );
  }
  if (step === 2) {
    return (
      <div className="nc-v-build">
        <div className="nc-v-block nc-v-block--title" style={{ ["--i" as string]: 0 }} />
        <div className="nc-v-block" style={{ ["--i" as string]: 1 }} />
        <div className="nc-v-row">
          <div className="nc-v-block nc-v-block--sm" style={{ ["--i" as string]: 2 }} />
          <div className="nc-v-block nc-v-block--sm" style={{ ["--i" as string]: 3 }} />
        </div>
        <div className="nc-v-block" style={{ ["--i" as string]: 4 }} />
      </div>
    );
  }
  return (
    <div className="nc-v-done">
      <svg className="nc-v-ring" viewBox="0 0 120 120" aria-hidden>
        <circle className="nc-v-ring-bg" cx="60" cy="60" r="50" />
        <circle className="nc-v-ring-fg" cx="60" cy="60" r="50" />
        <path
          className="nc-v-ring-check"
          d="M40 62l14 14 28-30"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="nc-v-done-label">Équipe opérationnelle</span>
    </div>
  );
}
