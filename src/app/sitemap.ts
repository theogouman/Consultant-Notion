import type { MetadataRoute } from "next";
import { ressources } from "@/content/ressources";

const SITE_URL = "https://consultant-notion.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = ressources
    .map((r) => r.dateMiseAJour ?? r.datePublication)
    .sort()
    .at(-1);
  return [
    {
      url: SITE_URL,
      lastModified: new Date("2026-07-29"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/ressources`,
      lastModified: latest ? new Date(latest) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...ressources.map((r) => ({
      url: `${SITE_URL}/ressources/${r.slug}`,
      lastModified: new Date(r.dateMiseAJour ?? r.datePublication),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
