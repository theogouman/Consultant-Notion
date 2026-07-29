"use client";

import { useMemo, useState } from "react";
import { MorphProvider } from "@/components/notion/MorphSourceContext";
import ResourceMorphOverlay from "@/components/notion/ResourceMorphOverlay";
import CaseCard from "./CaseCard";
import type { CaseStudyDetail } from "@/lib/notion/types";

/**
 * Grille des études de cas avec barre de filtres par secteur (multi-select),
 * comme la grille ressources du repo. La grille reste montée sous l'overlay
 * du morph (zéro re-fetch).
 */
export default function CaseStudiesGrid({
  caseStudies,
  sectors,
}: {
  caseStudies: CaseStudyDetail[];
  sectors: string[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!active) return caseStudies;
    return caseStudies.filter((cs) => cs.sectors.includes(active));
  }, [active, caseStudies]);

  if (caseStudies.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line bg-card/60 px-6 py-10 text-center text-muted">
        Les études de cas seront bientôt en ligne.
      </p>
    );
  }

  return (
    <MorphProvider cases={filtered}>
      {sectors.length > 0 && (
        <div
          className="mb-8 flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrer par secteur"
        >
          <FilterPill
            label="Tous"
            active={active === null}
            onClick={() => setActive(null)}
          />
          {sectors.map((sector) => (
            <FilterPill
              key={sector}
              label={sector}
              active={active === sector}
              onClick={() => setActive(sector)}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cs, i) => (
          <CaseCard key={cs.id} caseStudy={cs} index={i} />
        ))}
      </div>

      <ResourceMorphOverlay />
    </MorphProvider>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        active
          ? "bg-accent text-white"
          : "bg-raised text-muted hover:bg-line hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
