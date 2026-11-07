import { Fragment } from "react";

const VERIF = /(\[À VÉRIFIER[^\]]*\])/g;

/**
 * Texte de ressource. Les marqueurs `[À VÉRIFIER…]` sont surlignés pour la
 * relecture (même taille et même poids que la phrase : seul le fond change).
 */
export default function RichText({ children }: { children: string }) {
  const parts = children.split(VERIF);
  if (parts.length === 1) return <>{children}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-[6px] bg-accent/15 px-1 text-accent-strong">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Version texte brut (meta, OpenGraph) : retire les marqueurs. */
export function stripVerif(text: string): string {
  return text.replace(VERIF, "").replace(/\s{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}
