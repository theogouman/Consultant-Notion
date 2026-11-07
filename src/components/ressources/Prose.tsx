import RichText from "./RichText";
import type { SectionIntro, SectionListe } from "@/content/ressources/types";

/**
 * Titre de section d'une page de lecture : aligné à gauche, équilibré
 * (`nc-balance-wide`, mesure portée à la colonne de lecture).
 */
export function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      className="nc-title nc-balance-wide text-[1.75rem] sm:text-[2rem]"
      style={{ "--nc-measure": "100%" } as React.CSSProperties}
    >
      {children}
    </h2>
  );
}

/** Paragraphes de texte courant (problème, explication, exemple). */
export function Intro({ section }: { section: SectionIntro }) {
  const paragraphs = section.paragraphes.map((p, i) => (
    <p key={i} className="text-[1.0625rem] leading-[1.7] text-muted [&+&]:mt-4">
      <RichText>{p}</RichText>
    </p>
  ));

  if (section.style === "encadre") {
    return (
      <div className="rounded-md border border-line bg-card p-6 nc-shadow-3 sm:p-8">
        {section.titre && <p className="nc-eyebrow">{section.titre}</p>}
        <div className="mt-4">{paragraphs}</div>
      </div>
    );
  }

  return (
    <>
      {section.titre && <SectionTitle>{section.titre}</SectionTitle>}
      <div className={section.titre ? "mt-5" : ""}>{paragraphs}</div>
    </>
  );
}

/** Liste « titre + explication » avec coche d'accent. */
export function Liste({ section }: { section: SectionListe }) {
  return (
    <>
      <SectionTitle>{section.titre}</SectionTitle>
      {section.intro && (
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">
          <RichText>{section.intro}</RichText>
        </p>
      )}
      <ul className="mt-7 space-y-5">
        {section.items.map((item, i) => (
          <li key={i} className="flex gap-4">
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent/10 text-accent"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.5 8.5L6.5 11.5L12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[1.0625rem] font-bold leading-snug text-ink">{item.titre}</p>
              <p className="mt-1.5 text-[1rem] leading-relaxed text-muted">
                <RichText>{item.texte}</RichText>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
