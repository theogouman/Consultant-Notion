import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Théo Gouman — Consultant Notion pour TPE et PME";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image de partage (OpenGraph) générée dynamiquement, aux couleurs de marque. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(56% 50% at -8% 50%, rgba(224,99,90,0.35) 0%, transparent 72%), radial-gradient(56% 50% at 108% 50%, rgba(224,99,90,0.32) 0%, transparent 72%), #f5f2f2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "#000",
              letterSpacing: "-0.02em",
            }}
          >
            Théo Gouman
          </div>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              background: "#e0625a",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#000",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Un Notion qui fait moins.
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#e0625a",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Pour faire mieux.
          </div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#52525b" }}>
            Consultant Notion pour TPE et PME · +100 entreprises depuis 2022
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
