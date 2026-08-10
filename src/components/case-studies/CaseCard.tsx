"use client";

import { useRef } from "react";
import { useMorph } from "@/components/notion/MorphSourceContext";
import type { CaseStudyDetail } from "@/lib/notion/types";

/**
 * Carte d'étude de cas : couverture `Image`, `Titre` en légende, badges
 * `Secteur`. Au clic, capture sa géométrie + celle du titre (getBoundingClientRect)
 * puis déclenche le morph (§6).
 */
export default function CaseCard({
  caseStudy,
  index,
}: {
  caseStudy: CaseStudyDetail;
  index: number;
}) {
  const { open } = useMorph();
  const cardRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  function handleOpen() {
    const card = cardRef.current;
    const title = titleRef.current;
    if (!card || !title) return;
    open(index, {
      cardRect: card.getBoundingClientRect(),
      titleRect: title.getBoundingClientRect(),
      imageRect: imageRef.current?.getBoundingClientRect() ?? null,
      coverUrl: caseStudy.coverUrl,
    });
  }

  return (
    <button
      ref={cardRef}
      onClick={handleOpen}
      className="group nc-shadow-3 flex h-full flex-col overflow-hidden rounded-sm bg-card text-left transition-transform duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page"
      aria-label={`Ouvrir l’étude de cas : ${caseStudy.title}`}
    >
      <div
        ref={imageRef}
        className="relative aspect-[16/10] w-full overflow-hidden bg-raised"
      >
        {caseStudy.coverUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={caseStudy.coverUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            {caseStudy.title}
          </div>
        )}
      </div>

      <div className="relative z-[1] flex flex-1 flex-col gap-3 p-5">
        <h3
          ref={titleRef}
          className="nc-title text-lg leading-snug"
        >
          {caseStudy.title}
        </h3>
        {caseStudy.sectors.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5">
            {caseStudy.sectors.map((sector) => (
              <span
                key={sector}
                className="rounded-full bg-raised px-2.5 py-1 text-xs text-muted"
              >
                {sector}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
