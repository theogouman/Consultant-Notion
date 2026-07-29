"use client";

import NotionRenderer from "./NotionRenderer";
import type { CaseStudyDetail } from "@/lib/notion/types";

/**
 * Corps du panneau ouvert (§6).
 * Repris de Notion-Club/Infrastructure (ResourceContentBody.tsx).
 * Le titre est rendu séparément (hero title qui voyage) par l'overlay ;
 * ici on rend les badges secteurs + le corps de page Notion.
 */
export default function ResourceContentBody({
  caseStudy,
}: {
  caseStudy: CaseStudyDetail;
}) {
  return (
    <div className="space-y-6">
      {caseStudy.sectors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {caseStudy.sectors.map((sector) => (
            <span
              key={sector}
              className="rounded-full bg-raised px-3 py-1 text-sm text-muted"
            >
              {sector}
            </span>
          ))}
        </div>
      )}
      <NotionRenderer blocks={caseStudy.blocks} />
    </div>
  );
}
