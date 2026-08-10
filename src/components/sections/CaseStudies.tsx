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
        <h2 className="nc-title text-3xl sm:text-4xl">{copy.title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{copy.subtitle}</p>
      </Reveal>

      <CaseStudiesGrid caseStudies={items} />

      {/* Témoignages courts — [À AFFINER] verbatims. */}
      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {copy.testimonials.map((t, i) => (
          <Reveal key={i} delay={(i % 3) * 70}>
            <figure className="flex h-full flex-col rounded-md border border-line bg-card p-6 nc-shadow-3">
              <blockquote className="flex-1 text-[1.0625rem] leading-relaxed text-ink">
                « {t.quote} »
              </blockquote>
              <figcaption className="mt-5 text-sm text-muted">
                <span className="font-medium text-ink">{t.name}</span> — {t.role},{" "}
                {t.company}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
