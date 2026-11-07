"use client";

import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import RichText from "./RichText";
import { SectionTitle } from "./Prose";
import type { SectionFaq } from "@/content/ressources/types";

/** FAQ d'une ressource : mêmes accordéons (t-acc) que la FAQ de la home. */
export default function Faq({ section }: { section: SectionFaq }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <>
      <SectionTitle>{section.titre}</SectionTitle>
      <div className="mt-7 space-y-3">
        {section.questions.map((item, i) => {
          const isOpen = !!open[i];
          const panelId = `${section.id ?? "faq"}-${i}`;
          return (
            <Reveal key={i} delay={i * 40}>
              <div
                className="t-acc rounded-sm border border-line bg-card px-5 nc-shadow-3 sm:px-6"
                data-open={isOpen}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                  className="t-acc-head flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-[1.0625rem] font-medium text-ink"
                >
                  {item.q}
                  <span
                    aria-hidden
                    className="t-acc-chevron flex h-7 w-7 flex-none items-center justify-center rounded-full bg-raised text-accent"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <div className="t-acc-panel" id={panelId}>
                  <div className="t-acc-panel-inner">
                    <p className="pb-5 pr-2 text-[1rem] leading-relaxed text-muted sm:pr-10">
                      <RichText>{item.r}</RichText>
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
