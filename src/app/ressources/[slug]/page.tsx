import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RessourceHero from "@/components/ressources/RessourceHero";
import RessourceBody from "@/components/ressources/RessourceBody";
import RessourceAttribution from "@/components/ressources/RessourceAttribution";
import { stripVerif } from "@/components/ressources/RichText";
import { getRessource, ressources } from "@/content/ressources";

/** Template unique de toutes les ressources : pages générées au build. */
export const dynamicParams = false;

export function generateStaticParams() {
  return ressources.map((r) => ({ slug: r.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = getRessource(slug);
  if (!r) return {};
  const title = stripVerif(r.titre);
  const description = stripVerif(r.descriptionSeo);
  const url = `/ressources/${r.slug}`;
  return {
    title,
    description,
    keywords: r.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      url,
      siteName: "Théo Gouman — Consultant Notion",
      title,
      description,
      publishedTime: r.datePublication,
      modifiedTime: r.dateMiseAJour ?? r.datePublication,
      authors: ["Théo Gouman"],
      tags: r.tags,
      // Image : convention de fichier ./opengraph-image.tsx (ajoutée par Next).
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RessourcePage({ params }: Props) {
  const { slug } = await params;
  const ressource = getRessource(slug);
  if (!ressource) notFound();

  return (
    <article>
      <RessourceAttribution slug={ressource.slug} />
      <RessourceHero ressource={ressource} />
      <RessourceBody ressource={ressource} />
    </article>
  );
}
