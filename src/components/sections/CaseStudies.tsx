import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import CaseStudiesGrid from "@/components/case-studies/CaseStudiesGrid";
import { getCaseStudiesWithBody } from "@/lib/notion/case-studies";
import { caseStudies as copy } from "@/lib/content";

/**
 * Bloc 7 — Études de cas.
 * Server Component : les données Notion sont récupérées au build + ISR
 * (revalidate hérité du segment), puis passées à la grille cliente (morph).
 */
export default async function CaseStudies() {
  const items = await getCaseStudiesWithBody();

  return (
    <Section id="etudes-de-cas" width="wide">
      <Reveal className="mb-10 max-w-2xl">
        <h2 className="nc-title whitespace-pre-line text-3xl sm:text-4xl">
          {copy.title}
        </h2>
      </Reveal>

      <CaseStudiesGrid caseStudies={items} />
    </Section>
  );
}
