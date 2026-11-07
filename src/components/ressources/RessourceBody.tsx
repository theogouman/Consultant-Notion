import Reveal from "@/components/ui/Reveal";
import { Intro, Liste } from "./Prose";
import Steps from "./Steps";
import CopyBlock from "./CopyBlock";
import Faq from "./Faq";
import RessourceCta from "./RessourceCta";
import type { Ressource, RessourceSection } from "@/content/ressources/types";

/** Rendu d'une section selon son type. */
function Block({ section }: { section: RessourceSection }) {
  switch (section.type) {
    case "intro":
      return <Intro section={section} />;
    case "liste":
      return <Liste section={section} />;
    case "etapes":
      return <Steps section={section} />;
    case "copie":
      return <CopyBlock section={section} />;
    case "faq":
      return <Faq section={section} />;
    case "cta":
      return <RessourceCta section={section} />;
  }
}

/**
 * Corps d'une ressource : colonne de lecture (~68ch) ; le CTA final sort de
 * la colonne pour respirer sur la largeur du hero.
 */
export default function RessourceBody({ ressource }: { ressource: Ressource }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-8 sm:pb-28">
      {ressource.sections.map((section, i) => {
        const isFinal = section.type === "cta" && section.variante === "final";
        // Les blocs qui gèrent leurs propres apparitions (liste animée) ne
        // sont pas ré-enveloppés dans un Reveal global.
        const selfRevealing = section.type === "etapes" || section.type === "faq";
        const content = <Block section={section} />;
        return (
          <section
            key={section.id ?? i}
            id={section.id}
            className={`scroll-mt-24 ${isFinal ? "mt-20 sm:mt-28" : "mx-auto mt-14 max-w-[68ch] sm:mt-20"} ${i === 0 ? "!mt-4 sm:!mt-6" : ""}`}
          >
            {selfRevealing ? content : <Reveal>{content}</Reveal>}
          </section>
        );
      })}

      {ressource.source && (
        <p className="mx-auto mt-12 max-w-[68ch] text-sm leading-relaxed text-muted">
          Source :{" "}
          <a
            href={ressource.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
          >
            {ressource.source.label}
          </a>
        </p>
      )}
    </div>
  );
}
