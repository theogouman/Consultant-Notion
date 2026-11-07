import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import RessourceCard from "@/components/ressources/RessourceCard";
import RessourceCta from "@/components/ressources/RessourceCta";
import { ressources } from "@/content/ressources";

const TITLE = "Ressources Notion et IA";
const DESCRIPTION =
  "Guides courts et concrets pour t'organiser avec Notion et tes IA : à appliquer tout de suite, sans jargon.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ressources" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/ressources",
    siteName: "Théo Gouman — Consultant Notion",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function RessourcesIndex() {
  return (
    <>
      <Section width="wide" className="!pb-12 sm:!pb-16">
        <div className="text-center">
          <Reveal>
            <p className="nc-eyebrow">Ressources</p>
            <h1 className="nc-title nc-balance-wide mt-4 text-[2.25rem] sm:text-5xl">
              Des guides pour mieux t&apos;organiser avec Notion et l&apos;IA
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="nc-balance-wide mt-5 text-lg leading-relaxed text-muted">
              Courts, concrets, sans jargon : à appliquer tout de suite dans ton Notion.
            </p>
          </Reveal>
        </div>

        {/* Flex centré : une ou deux cartes restent centrées, sans trou à droite. */}
        <ul className="mt-12 flex flex-wrap justify-center gap-4 sm:mt-14">
          {ressources.map((r, i) => (
            <Reveal
              as="li"
              key={r.slug}
              delay={i * 60}
              className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]"
            >
              <RessourceCard ressource={r} />
            </Reveal>
          ))}
        </ul>
      </Section>

      <div className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-8 sm:pb-28">
        <Reveal>
          <RessourceCta
            section={{
              type: "cta",
              variante: "final",
              titre: "Tu veux un Notion où ton équipe et tes IA travaillent vraiment ensemble ?",
              texte: "On fait le point sur ton organisation actuelle, et on voit ce qui vaut le coup d'être construit.",
              bouton: "Réserver un appel",
            }}
          />
        </Reveal>
      </div>
    </>
  );
}
