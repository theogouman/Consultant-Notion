import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import RichText from "./RichText";
import RessourceMedia from "./RessourceMedia";
import { formatDateFr, type Ressource } from "@/content/ressources";

/** En-tête d'une ressource : retour, étiquette + date, titre, accroche, média. */
export default function RessourceHero({ ressource }: { ressource: Ressource }) {
  const { titre, accroche, tags, datePublication, media } = ressource;
  return (
    <header className="mx-auto w-full max-w-3xl px-5 pb-10 pt-10 sm:px-8 sm:pb-14 sm:pt-16">
      <Link
        href="/ressources"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
      >
        <span aria-hidden>←</span> Toutes les ressources
      </Link>

      <div className="mt-8 text-center sm:mt-10">
        <Reveal>
          <p className="text-sm text-muted">
            <span className="nc-eyebrow">{tags[0]}</span>
            <span aria-hidden className="mx-2">·</span>
            <time dateTime={datePublication}>{formatDateFr(datePublication)}</time>
          </p>
          <h1 className="nc-title nc-balance-wide mt-4 text-[2.25rem] sm:text-5xl">{titre}</h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="nc-balance-wide mt-5 text-lg leading-relaxed text-muted sm:text-xl">
            <RichText>{accroche}</RichText>
          </p>
        </Reveal>
      </div>

      {media && (
        <Reveal delay={180} className="mt-10 sm:mt-12">
          <RessourceMedia media={media} />
        </Reveal>
      )}
    </header>
  );
}
