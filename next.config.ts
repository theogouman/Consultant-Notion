import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
