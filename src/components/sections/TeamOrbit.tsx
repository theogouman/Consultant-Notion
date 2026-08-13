"use client";

import { useEffect, useRef } from "react";

/**
 * Visuel carte 4 — « Prise en main » : pyramide → orbite autour de Notion.
 *
 * Porté fidèlement de l'aperçu validé `apercu-carte4-pyramide.html` (mêmes
 * positions, timings, couleurs, logique `draw(p)`). Registre humain :
 *  - la pyramide apparaît de haut en bas (Théo au sommet, l'équipe au milieu,
 *    le cercle Notion en dernier à la base) ;
 *  - la maîtrise cascade de niveau en niveau (Théo → équipe → Notion) ;
 *  - Théo se retire, puis les 3 avatars glissent vers les bords du cercle
 *    Notion et gravitent autour de lui, reliés au centre. Boucle continue.
 *
 * La boucle rAF n'avance que si la carte est active (lecture de
 * `--nc-anim-state`, posée par `playVisual` dans ProcessStack). En
 * `prefers-reduced-motion`, on fige l'état d'orbite (draw(0.66)) sans boucle.
 *
 * Assets référencés directement (pas de data URI) :
 *  - `/images/Annexes/theo-gouman-avatar.png`
 *  - `/images/Annexes/Notion_app_logo.png`
 */

const LOOP = 10500;
const NOTION_SRC = "/images/Annexes/Notion_app_logo.png";
const AVATAR_SRC = "/images/Annexes/theo-gouman-avatar.png";

const SVGNS = "http://www.w3.org/2000/svg";
const XLINK = "http://www.w3.org/1999/xlink";
const PI = Math.PI;
const D2R = PI / 180;

// Silhouette « personne » (avatars équipe).
const GLYPH =
  "M12 8m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2";

// Géométrie (identique à l'aperçu).
const NC: [number, number] = [230, 182]; // Notion (ancre)
const RORB = 76; // rayon d'orbite
const THEO: [number, number] = [230, 58]; // sommet de la pyramide
const PY: [number, number][] = [
  [150, 124],
  [230, 116],
  [310, 124],
]; // équipe (niveau intermédiaire)
const BASE = [150, -90, 30]; // angles d'orbite finaux (deg)

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIO = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = (x: number) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};

function el(tag: string, a: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(SVGNS, tag) as SVGElement;
  for (const k in a) e.setAttribute(k, String(a[k]));
  return e;
}
function setHref(img: SVGElement, href: string) {
  img.setAttributeNS(XLINK, "xlink:href", href);
  img.setAttribute("href", href);
}
const hexToRgb = (h: string): [number, number, number] => {
  h = h.replace("#", "");
  return [
    parseInt(h.substr(0, 2), 16),
    parseInt(h.substr(2, 2), 16),
    parseInt(h.substr(4, 2), 16),
  ];
};
function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  t = clamp(t);
  return (
    "rgb(" +
    Math.round(A[0] + (B[0] - A[0]) * t) +
    "," +
    Math.round(A[1] + (B[1] - A[1]) * t) +
    "," +
    Math.round(A[2] + (B[2] - A[2]) * t) +
    ")"
  );
}
// Écrit un attribut numérique/texte sans friction TS.
const sa = (e: Element, k: string, v: string | number) =>
  e.setAttribute(k, String(v));

export default function TeamOrbit() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const svg = root.querySelector("svg");
    if (!svg) return;

    const grp = (id: string) => root.querySelector<SVGGElement>("#" + id)!;
    const gStage = grp("stage");
    const gLinks = grp("links");
    const gPulses = grp("pulses");
    const gNotion = grp("notion");
    const gTeam = grp("team");
    const gGuide = grp("guide");

    // ── build : Notion (cercle) ──────────────────────────────────────────────
    const nHalo = el("circle", {
      cx: NC[0],
      cy: NC[1],
      r: 44,
      fill: "#e0625a",
      opacity: 0,
    });
    gNotion.appendChild(nHalo);
    gNotion.appendChild(
      el("circle", {
        cx: NC[0],
        cy: NC[1],
        r: 30,
        fill: "#ffffff",
        stroke: "#eee",
        "stroke-width": 1,
      }),
    );
    // Logo Notion : image 46×46 centrée dans le cercle r=30 (marge respirante).
    const nImg = el("image", {
      x: -23,
      y: -23,
      width: 46,
      height: 46,
      "clip-path": "url(#notionclip)",
    });
    sa(nImg, "transform", "translate(" + NC[0] + "," + NC[1] + ")");
    setHref(nImg, NOTION_SRC);
    gNotion.appendChild(nImg);
    const nRing = el("circle", {
      cx: NC[0],
      cy: NC[1],
      r: 31,
      fill: "none",
      stroke: "#e0625a",
      "stroke-width": 1.6,
      opacity: 0,
    });
    gNotion.appendChild(nRing);

    // ── liens niveau 1 (guide→team) et niveau 2 (team→notion) + pulses ───────
    const L1: SVGElement[] = [];
    const L2: SVGElement[] = [];
    const P1: SVGElement[] = [];
    const P2: SVGElement[] = [];
    for (let i = 0; i < 3; i++) {
      const a = el("line", {
        stroke: "#e0625a",
        "stroke-width": 2,
        "stroke-linecap": "round",
        opacity: 0,
      });
      gLinks.appendChild(a);
      L1.push(a);
      const b = el("line", {
        stroke: "#e0625a",
        "stroke-width": 1.8,
        "stroke-linecap": "round",
        opacity: 0,
      });
      gLinks.appendChild(b);
      L2.push(b);
      const p1 = el("circle", { r: 2.6, fill: "#e0625a", opacity: 0 });
      gPulses.appendChild(p1);
      P1.push(p1);
      const p2 = el("circle", { r: 2.6, fill: "#e0625a", opacity: 0 });
      gPulses.appendChild(p2);
      P2.push(p2);
    }

    // ── avatars équipe ───────────────────────────────────────────────────────
    const TEAM: { el: SVGElement; circ: SVGElement; pg: SVGElement }[] = [];
    for (let t = 0; t < 3; t++) {
      const tg = el("g", {});
      const circ = el("circle", {
        cx: 0,
        cy: 0,
        r: 16,
        fill: "#f4f4f3",
        stroke: "#d9d9d6",
        "stroke-width": 1.6,
      });
      const pg = el("path", {
        d: GLYPH,
        transform: "translate(-10.4,-10.4) scale(0.87)",
        fill: "none",
        stroke: "#a9a9a7",
        "stroke-width": 1.8,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
      tg.appendChild(circ);
      tg.appendChild(pg);
      gTeam.appendChild(tg);
      TEAM.push({ el: tg, circ, pg });
    }

    // ── guide (avatar photo de Théo) ─────────────────────────────────────────
    const gg = el("g", {});
    gg.appendChild(el("circle", { cx: 0, cy: 0, r: 20, fill: "#ffffff" }));
    const gImg = el("image", {
      x: -16.5,
      y: -16.5,
      width: 33,
      height: 33,
      "clip-path": "url(#theoclip)",
    });
    setHref(gImg, AVATAR_SRC);
    gg.appendChild(gImg);
    gg.appendChild(
      el("circle", {
        cx: 0,
        cy: 0,
        r: 20,
        fill: "none",
        stroke: "#ffffff",
        "stroke-width": 2.5,
      }),
    );
    gg.appendChild(
      el("circle", {
        cx: 0,
        cy: 0,
        r: 21.5,
        fill: "none",
        stroke: "#e0625a",
        "stroke-width": 1.5,
      }),
    );
    gGuide.appendChild(gg);

    // ── draw(p) : logique verbatim de l'aperçu ───────────────────────────────
    function draw(p: number) {
      const outA = p >= 0.95 ? easeOut((p - 0.95) / 0.05) : 0;
      const sIn = easeOut(clamp(p / 0.05));
      svg!.style.opacity = String(sIn * (1 - outA));

      const theoApp = easeOut(clamp((p - 0.04) / 0.07)); // apparition haut -> bas
      const notionApp = easeOut(clamp((p - 0.16) / 0.08));
      const leave = easeIO(clamp((p - 0.36) / 0.12)); // guide se retire (plus tôt)
      const glide = smooth(clamp((p - 0.44) / 0.15)); // pyramide -> orbite (plus tôt)
      const spin = p * 2 * PI * 0.9;

      // Une fois Théo parti, tout le groupe (Notion + avatars) remonte pour se
      // centrer verticalement dans la carte : viewBox 108 30 244 250 → centre
      // y = 155 ; NC y = 182 → décalage de -27 px, suivant l'entrée en orbite.
      gStage.setAttribute("transform", `translate(0, ${(-27 * glide).toFixed(1)})`);

      const theoY = lerp(THEO[1], THEO[1] - 30, leave);
      const theoOp = (1 - leave) * theoApp * (1 - outA);
      sa(gGuide, "transform", "translate(" + THEO[0] + "," + theoY.toFixed(1) + ")");
      sa(gGuide, "opacity", theoOp.toFixed(2));

      // positions équipe (pyramide -> orbite)
      const pos: [number, number][] = [];
      for (let m = 0; m < 3; m++) {
        const ang = BASE[m] * D2R + spin;
        const ox = NC[0] + RORB * Math.cos(ang);
        const oy = NC[1] + RORB * Math.sin(ang);
        const x = lerp(PY[m][0], ox, glide);
        const y = lerp(PY[m][1], oy, glide);
        pos.push([x, y]);
        sa(TEAM[m].el, "transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")");
        sa(
          TEAM[m].el,
          "opacity",
          (easeOut(clamp((p - (0.1 + m * 0.02)) / 0.07)) * (1 - outA)).toFixed(2),
        );
        const act = smooth(clamp((p - (0.18 + m * 0.02)) / 0.16));
        sa(TEAM[m].circ, "fill", mix("#f4f4f3", "#fdeee9", act));
        sa(TEAM[m].circ, "stroke", mix("#d9d9d6", "#e0625a", act));
        sa(TEAM[m].pg, "stroke", mix("#a9a9a7", "#e0625a", act));
      }

      // Notion actif
      sa(gNotion, "opacity", (notionApp * (1 - outA)).toFixed(2));
      const nAct = easeOut(clamp((p - 0.24) / 0.12));
      sa(nHalo, "opacity", (0.1 * nAct * (1 - outA)).toFixed(3));
      sa(nHalo, "r", (40 + 6 * nAct).toFixed(1));
      sa(nRing, "opacity", (nAct * 0.8 * (1 - outA)).toFixed(2));

      // niveau 1 : guide -> team (se dessine, puis s'efface au retrait)
      for (let a1 = 0; a1 < 3; a1++) {
        const d1 = easeOut(clamp((p - (0.15 + a1 * 0.02)) / 0.1));
        const sx = THEO[0];
        const sy = theoY + 20;
        sa(L1[a1], "x1", sx);
        sa(L1[a1], "y1", sy);
        sa(L1[a1], "x2", lerp(sx, pos[a1][0], d1));
        sa(L1[a1], "y2", lerp(sy, pos[a1][1], d1));
        sa(L1[a1], "opacity", (d1 * (1 - leave) * 0.7 * (1 - outA)).toFixed(2));
        // pulse niveau 1
        const ph1 = clamp((p - (0.16 + a1 * 0.02)) / 0.14);
        const show1 = p > 0.15 && p < 0.3 ? 1 : 0;
        sa(P1[a1], "cx", lerp(sx, pos[a1][0], ph1));
        sa(P1[a1], "cy", lerp(sy, pos[a1][1], ph1));
        sa(P1[a1], "opacity", (show1 * (1 - leave) * (1 - outA)).toFixed(2));
      }

      // niveau 2 : team -> notion (persiste, devient rayon d'orbite)
      for (let a2 = 0; a2 < 3; a2++) {
        const d2 = easeOut(clamp((p - (0.22 + a2 * 0.02)) / 0.1));
        sa(L2[a2], "x1", pos[a2][0]);
        sa(L2[a2], "y1", pos[a2][1]);
        sa(L2[a2], "x2", lerp(pos[a2][0], NC[0], d2));
        sa(L2[a2], "y2", lerp(pos[a2][1], NC[1], d2));
        sa(L2[a2], "opacity", (d2 * 0.55 * (1 - outA)).toFixed(2));
        // pulse niveau 2 (cascade puis autonomie continue)
        const ph2 = (p * 2.0 + a2 * 0.3) % 1;
        const pon = easeOut(clamp((p - 0.24) / 0.1));
        sa(P2[a2], "cx", lerp(pos[a2][0], NC[0], ph2));
        sa(P2[a2], "cy", lerp(pos[a2][1], NC[1], ph2));
        sa(P2[a2], "opacity", (pon * d2 * (1 - outA) * 0.9).toFixed(2));
      }
    }

    // ── boucle avec pause (identique cartes 2/3) ─────────────────────────────
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      draw(0.66); // état orbite figé (Théo déjà parti)
      return;
    }

    const visual = root.closest<HTMLElement>(".nc-proc-visual");
    let raf = 0;
    let elapsed = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const st = visual
        ? getComputedStyle(visual).getPropertyValue("--nc-anim-state").trim()
        : "running";
      if (st !== "paused") elapsed += dt;
      draw((elapsed % LOOP) / LOOP);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={rootRef} className="nc-v-orbit" aria-hidden>
      <svg viewBox="108 30 244 250">
        <defs>
          <clipPath id="theoclip">
            <circle cx="0" cy="0" r="20" />
          </clipPath>
          <clipPath id="notionclip">
            <circle cx="0" cy="0" r="30" />
          </clipPath>
        </defs>
        <g id="stage">
          <g id="links" />
          <g id="pulses" />
          <g id="notion" />
          <g id="team" />
          <g id="guide" />
        </g>
      </svg>
    </div>
  );
}
