"use client";

import { MorphProvider } from "@/components/notion/MorphSourceContext";
import ResourceMorphOverlay from "@/components/notion/ResourceMorphOverlay";
import CaseCard from "./CaseCard";
import type { CaseStudyDetail } from "@/lib/notion/types";

/**
 * Grille des études de cas. La grille reste montée sous l'overlay du morph
 * (zéro re-fetch).
 */
export default function CaseStudiesGrid({
  caseStudies,
}: {
  caseStudies: CaseStudyDetail[];
}) {
  if (caseStudies.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line bg-card/60 px-6 py-10 text-center text-muted">
        Les études de cas seront bientôt en ligne.
      </p>
    );
  }

  return (
    <MorphProvider cases={caseStudies}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {caseStudies.map((cs, i) => (
          <CaseCard key={cs.id} caseStudy={cs} index={i} />
        ))}
      </div>

      <ResourceMorphOverlay />
    </MorphProvider>
  );
}
