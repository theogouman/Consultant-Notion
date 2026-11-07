import Link from "next/link";
import RichText from "./RichText";
import { formatDateFr, type Ressource } from "@/content/ressources";

/** Carte d'une ressource dans l'index /ressources. */
export default function RessourceCard({ ressource }: { ressource: Ressource }) {
  const { slug, titre, accroche, tags, datePublication } = ressource;
  return (
    <Link
      href={`/ressources/${slug}`}
      className="group flex h-full flex-col rounded-sm border border-line bg-card p-6 nc-shadow-3 transition-[border-color,transform] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page"
    >
      <span className="nc-eyebrow">{tags[0]}</span>
      <h2 className="nc-title mt-3 text-xl transition-colors group-hover:text-accent sm:text-[1.375rem]">
        {titre}
      </h2>
      <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
        <RichText>{accroche}</RichText>
      </p>
      <div className="mt-6 flex items-center justify-between text-sm text-muted">
        <time dateTime={datePublication}>{formatDateFr(datePublication)}</time>
        <span aria-hidden className="text-accent transition-transform group-hover:translate-x-0.5">
          Lire →
        </span>
      </div>
    </Link>
  );
}
