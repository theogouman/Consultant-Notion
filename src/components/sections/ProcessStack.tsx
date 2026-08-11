"use client";

import { useEffect, useRef } from "react";
import Reveal from "@/components/ui/Reveal";
import AuditNetwork from "@/components/sections/AuditNetwork";
import NotionBuild from "@/components/sections/NotionBuild";
import TeamOrbit from "@/components/sections/TeamOrbit";
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
      cards.forEach((c, i) => {
        c.classList.toggle("is-active", i === idx);
        const v = c.querySelector<HTMLElement>(".nc-proc-visual");
        if (v)
          v.style.setProperty(
            "--nc-anim-state",
            i === idx ? "running" : "paused",
          );
      });
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
            <h2 className="nc-title text-3xl sm:text-4xl">{howItWorks.title}</h2>
            <p className="mt-3 text-lg text-muted">{howItWorks.subtitle}</p>
          </Reveal>

          <div ref={cardsRef} className="nc-proc-cards">
            {howItWorks.steps.map((step, i) => (
              <article key={i} className="nc-proc-card" data-step={i}>
                <div className="nc-proc-grid">
                  <div className="nc-proc-content">
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
      <div className="nc-anim-root">
        <div className="nc-anim-imessage">
          <div className="nc-anim-bubble-in">
            C&apos;est le chaos, on passe notre temps à chercher les infos
            plutôt que travailler…
          </div>
          <div className="nc-anim-out-wrap">
            <div className="nc-anim-bubble-out">
              On planifie un appel pour regarder ça ?
            </div>
            <div className="nc-anim-tap" aria-hidden>👍</div>
          </div>
        </div>
        <div className="nc-anim-meet">
          <div className="nc-anim-meet-win">
            <div className="nc-anim-meet-grid">
              <div className="nc-anim-meet-user nc-anim-meet-user-main">
                <div className="nc-anim-meet-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="nc-anim-meet-name">Théo Gouman</div>
              </div>
              <div className="nc-anim-meet-user nc-anim-meet-user-self">
                <div className="nc-anim-meet-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="nc-anim-meet-name">Toi</div>
              </div>
            </div>
            <div className="nc-anim-meet-bar">
              <span className="nc-anim-meet-bar-label">Notion : Toi × Théo</span>
              <div className="nc-anim-meet-btn nc-anim-meet-btn-g">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                </svg>
              </div>
              <div className="nc-anim-meet-btn nc-anim-meet-btn-g">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11" />
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                </svg>
              </div>
              <div className="nc-anim-meet-btn nc-anim-meet-btn-r">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (step === 1) {
    return <AuditNetwork />;
  }
  if (step === 2) {
    return <NotionBuild />;
  }
  if (step === 3) {
    return <TeamOrbit />;
  }
  return null;
}
