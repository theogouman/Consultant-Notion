import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://consultant-notion.fr",
      lastModified: new Date("2026-07-29"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
