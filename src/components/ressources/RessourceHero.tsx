import Reveal from "@/components/ui/Reveal";
import RichText from "./RichText";
import RessourceMedia from "./RessourceMedia";
import type { Ressource } from "@/content/ressources";

/** En-tête d'une ressource : titre, accroche, média. */
export default function RessourceHero({ ressource }: { ressource: Ressource }) {
  const { titre, accroche, media } = ressource;
  return (
    <header className="mx-auto w-full max-w-3xl px-5 pb-8 pt-12 sm:px-8 sm:pb-10 sm:pt-20">
      <div className="text-center">
        <Reveal>
          <h1 className="nc-title nc-balance-wide text-[2.25rem] sm:text-5xl">{titre}</h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="nc-balance-wide mt-5 text-lg leading-relaxed text-muted sm:text-xl">
            <RichText>{accroche}</RichText>
          </p>
        </Reveal>
      </div>

      {media && (
        <Reveal delay={180} className="mt-6 sm:mt-8">
          <RessourceMedia media={media} />
        </Reveal>
      )}
    </header>
  );
}
