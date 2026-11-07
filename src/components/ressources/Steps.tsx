import Reveal from "@/components/ui/Reveal";
import RichText from "./RichText";
import { SectionTitle } from "./Prose";
import type { SectionEtapes } from "@/content/ressources/types";

/** Étapes numérotées (liste ordonnée sémantique). */
export default function Steps({ section }: { section: SectionEtapes }) {
  return (
    <>
      <SectionTitle>{section.titre}</SectionTitle>
      {section.intro && (
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">
          <RichText>{section.intro}</RichText>
        </p>
      )}
      <ol className="mt-8 space-y-3">
        {section.etapes.map((etape, i) => (
          <Reveal as="li" key={i} delay={i * 40}>
            <div className="flex gap-4 rounded-sm border border-line bg-card p-5 nc-shadow-3 sm:gap-5 sm:p-6">
              <span
                aria-hidden
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent/10 text-[0.9375rem] font-bold text-accent"
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-[1.0625rem] font-bold leading-snug text-ink">
                  <span className="sr-only">Étape {i + 1} : </span>
                  {etape.titre}
                </h3>
                <p className="mt-2 text-[1rem] leading-relaxed text-muted">
                  <RichText>{etape.texte}</RichText>
                </p>
                {etape.details && (
                  <ul className="mt-3 space-y-2">
                    {etape.details.map((d, j) => (
                      <li key={j} className="flex gap-3 text-[1rem] leading-relaxed text-muted">
                        <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                        <span>
                          <RichText>{d}</RichText>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </>
  );
}
