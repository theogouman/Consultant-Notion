import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inclut les logos clients dans la fonction serveur pour que le marquee
  // (lecture fs de public/images/Logo-Clients) fonctionne aussi à la
  // revalidation ISR, pas seulement au build.
  outputFileTracingIncludes: {
    "/": ["./public/images/Logo-Clients/**"],
  },
  images: {
    // Les couvertures d'études de cas sont servies par les fichiers Notion (S3 signé)
    // et les fichiers d'assets Notion. On autorise ces hôtes pour next/image.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.notion.so",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
