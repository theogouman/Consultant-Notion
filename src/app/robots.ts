import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Funnel de réservation + admin : hors index.
      disallow: ["/admin", "/rdv", "/api/"],
    },
    sitemap: "https://consultant-notion.fr/sitemap.xml",
  };
}
