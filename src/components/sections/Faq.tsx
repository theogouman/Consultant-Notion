"use client";

import { useState } from "react";
import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { faq } from "@/lib/content";

/**
 * Bloc 10 — FAQ (objections). Accordéons animés (transitions.dev · accordion) :
 * ouverture/fermeture par grid-template-rows 0fr↔1fr + fondu/flou du contenu,
 * chevron qui se retourne. Chaque item s'ouvre indépendamment.
 */
export default function Faq() {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <Section id="faq" width="narrow">
      <Reveal className="mb-10 text-center">
        <p className="nc-eyebrow mb-3">{faq.eyebrow}</p>
        <h2 className="nc-title text-3xl sm:text-4xl">{faq.title}</h2>
      </Reveal>
      <div className="space-y-3">
        {faq.items.map((item, i) => {
          const isOpen = !!open[i];
          return (
            <Reveal key={i} delay={i * 40}>
              <div
                className="t-acc rounded-sm border border-line bg-card px-6 nc-shadow-3"
                data-open={isOpen}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                  className="t-acc-head flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-[1.0625rem] font-medium text-ink"
                >
                  {item.q}
                  <span
                    aria-hidden
                    className="t-acc-chevron flex h-7 w-7 flex-none items-center justify-center rounded-full bg-raised text-accent"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path
                        d="M4 6.5L8 10.5L12 6.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                <div className="t-acc-panel">
                  <div className="t-acc-panel-inner">
                    <p className="pb-5 pr-10 text-[1.0625rem] leading-relaxed text-muted">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
