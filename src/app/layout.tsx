import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://consultant-notion.fr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Consultant Notion pour TPE et PME | Théo Gouman",
    template: "%s | Théo Gouman",
  },
  description:
    "Consultant Notion indépendant pour TPE et PME. Je construis à partir de vos enjeux — pas d’un template — une organisation claire, livrée clé en main. +100 entreprises accompagnées depuis 2022.",
  keywords: [
    "consultant Notion",
    "Notion entreprise",
    "Notion TPE PME",
    "accompagnement Notion",
    "organisation Notion",
    "implémentation Notion",
    "Théo Gouman",
  ],
  authors: [{ name: "Théo Gouman" }],
  creator: "Théo Gouman",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Théo Gouman — Consultant Notion",
    title: "Un Notion qui fait moins. Pour faire mieux.",
    description:
      "Consultant Notion pour TPE et PME. Une organisation claire, construite sur vos enjeux et livrée clé en main.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Théo Gouman — Consultant Notion pour TPE et PME",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Un Notion qui fait moins. Pour faire mieux.",
    description:
      "Consultant Notion pour TPE et PME. Une organisation claire, construite sur vos enjeux et livrée clé en main.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f5f2f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        {/* Sans JS : le contenu à révélation reste visible (robustesse + SEO). */}
        <noscript>
          <style>{`.nc-reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body>
        <div className="nc-app-bg" aria-hidden />
        {children}
      </body>
    </html>
  );
}
