"use client";

import { useEffect, useRef } from "react";

/**
 * Hero animé de la ressource `memoire-ia-notion` : Claude, Gemini et ChatGPT
 * envoient des fichiers vers Notion, leur mémoire commune.
 *
 * - Repère SVG 800×800, fond transparent (le fond de la page apparaît).
 * - Une seule boucle requestAnimationFrame met à jour les attributs via des
 *   refs : aucun re-render React par frame.
 * - Pause hors écran (IntersectionObserver) et onglet caché.
 * - `prefers-reduced-motion` : image fixe (un fichier par source, à
 *   mi-parcours).
 */

const LOOP_MS = 4000;
const ACCENT = "#e0625a";
const LOGO_DIR = "/ressources/memoire-ia-notion/logos";

type SourceId = "claude" | "gemini" | "chatgpt";

interface Tile {
  x: number;
  y: number;
  size: number;
  logo: string;
}

const SOURCES: Record<SourceId, Tile & { rot: number }> = {
  claude: { x: 160, y: 260, size: 150, logo: "claude", rot: 8 },
  gemini: { x: 400, y: 260, size: 150, logo: "gemini", rot: 4 },
  chatgpt: { x: 640, y: 260, size: 150, logo: "chatgpt", rot: -8 },
};
const SOURCE_IDS: SourceId[] = ["claude", "gemini", "chatgpt"];
const NOTION: Tile = { x: 400, y: 600, size: 190, logo: "notion" };

/** 6 fichiers, phases i/6, sources en rotation Claude → Gemini → ChatGPT. */
const FILES = Array.from({ length: 6 }, (_, i) => ({
  phase: i / 6,
  source: SOURCE_IDS[i % 3],
}));

const TRAVEL = 0.62; // part de la boucle pendant laquelle un fichier est visible
const FILE_W = 50;
const FILE_H = 62;

/** Vecteur unitaire source → Notion. */
function direction(s: Tile) {
  const dx = NOTION.x - s.x;
  const dy = NOTION.y - s.y;
  const len = Math.hypot(dx, dy);
  return { dx: dx / len, dy: dy / len };
}

/** Trait pointillé : commence et finit à 16 px du bord des tuiles. */
function dashLine(s: Tile) {
  const { dx, dy } = direction(s);
  const edge = (t: Tile) => t.size / 2 / Math.max(Math.abs(dx), Math.abs(dy)) + 16;
  const ms = edge(s);
  const mn = edge(NOTION);
  return {
    x1: s.x + dx * ms,
    y1: s.y + dy * ms,
    x2: NOTION.x - dx * mn,
    y2: NOTION.y - dy * mn,
  };
}

/** Trajet d'un fichier : de 22 % de la tuile source à 22 % avant Notion. */
function filePath(s: Tile) {
  const { dx, dy } = direction(s);
  const a = 0.22 * s.size;
  const b = 0.22 * NOTION.size;
  return {
    x0: s.x + dx * a,
    y0: s.y + dy * a,
    x1: NOTION.x - dx * b,
    y1: NOTION.y - dy * b,
  };
}

const LINES = Object.fromEntries(SOURCE_IDS.map((id) => [id, dashLine(SOURCES[id])])) as Record<
  SourceId,
  ReturnType<typeof dashLine>
>;
const PATHS = Object.fromEntries(SOURCE_IDS.map((id) => [id, filePath(SOURCES[id])])) as Record<
  SourceId,
  ReturnType<typeof filePath>
>;

const mod1 = (v: number) => ((v % 1) + 1) % 1;

interface FileState {
  visible: boolean;
  x: number;
  y: number;
  rot: number;
  scale: number;
  opacity: number;
}

interface FrameState {
  files: FileState[];
  sourceScale: Record<SourceId, number>;
  notionScale: number;
  dashOffset: number;
}

function fileAt(source: SourceId, u: number): FileState {
  const p = PATHS[source];
  const e = u * u * (3 - 2 * u); // smoothstep
  const sin = Math.sin(Math.PI * u);
  return {
    visible: true,
    x: p.x0 + (p.x1 - p.x0) * e,
    y: p.y0 + (p.y1 - p.y0) * e,
    rot: SOURCES[source].rot * sin,
    scale: 0.7 + 0.3 * sin,
    opacity: Math.min(1, u / 0.06) * Math.min(1, (1 - u) / 0.06),
  };
}

const HIDDEN: FileState = { visible: false, x: 0, y: 0, rot: 0, scale: 1, opacity: 0 };

/** État complet de la scène à l'instant t ∈ [0, 1). */
function frame(t: number): FrameState {
  const sourceScale: Record<SourceId, number> = { claude: 1, gemini: 1, chatgpt: 1 };
  let notionScale = 1;

  const files = FILES.map(({ phase, source }) => {
    const age = mod1(t - phase);

    // Micro-réaction de la source au départ.
    if (age < 0.12) {
      const s = 1 + 0.035 * Math.sin((Math.PI * age) / 0.12);
      sourceScale[source] = Math.max(sourceScale[source], s);
    }

    // Micro-réaction de Notion à l'arrivée (max si chevauchement).
    const arrival = mod1(t - (phase + TRAVEL));
    if (arrival < 0.15) {
      const k = arrival / 0.15;
      const s = k < 0.625 ? 1 + 0.07 * Math.sin(Math.PI * Math.min(1, 1.6 * k)) : 1;
      notionScale = Math.max(notionScale, s);
    }

    return age < TRAVEL ? fileAt(source, age / TRAVEL) : HIDDEN;
  });

  return { files, sourceScale, notionScale, dashOffset: -112 * t };
}

/** Image fixe (mouvement réduit) : un fichier par source, à mi-parcours. */
function staticFrame(): FrameState {
  return {
    files: FILES.map(({ source }, i) => (i < 3 ? fileAt(source, 0.5) : HIDDEN)),
    sourceScale: { claude: 1, gemini: 1, chatgpt: 1 },
    notionScale: 1,
    dashOffset: 0,
  };
}

const fileTransform = (f: FileState) =>
  `translate(${f.x.toFixed(2)} ${f.y.toFixed(2)}) rotate(${f.rot.toFixed(3)}) scale(${f.scale.toFixed(4)})`;
const tileTransform = (t: Tile, s: number) => `translate(${t.x} ${t.y}) scale(${s.toFixed(4)})`;

/** Frame affichée au rendu serveur / avant hydratation. */
const INITIAL_T = 0.3;
const INITIAL = frame(INITIAL_T);

export default function MemoireIaAnimation({ label }: { label: string }) {
  const fileRefs = useRef<(SVGGElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const sourceRefs = useRef<Partial<Record<SourceId, SVGGElement | null>>>({});
  const notionRef = useRef<SVGGElement | null>(null);
  const rootRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const apply = (st: FrameState) => {
      st.files.forEach((f, i) => {
        const el = fileRefs.current[i];
        if (!el) return;
        if (!f.visible) {
          el.setAttribute("opacity", "0");
          return;
        }
        el.setAttribute("opacity", f.opacity.toFixed(3));
        el.setAttribute("transform", fileTransform(f));
      });
      SOURCE_IDS.forEach((id) => {
        sourceRefs.current[id]?.setAttribute("transform", tileTransform(SOURCES[id], st.sourceScale[id]));
      });
      notionRef.current?.setAttribute("transform", tileTransform(NOTION, st.notionScale));
      lineRefs.current.forEach((l) => l?.setAttribute("stroke-dashoffset", st.dashOffset.toFixed(2)));
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = 0;
    let elapsed = INITIAL_T * LOOP_MS;
    let inView = true;

    const tick = (now: number) => {
      if (last) elapsed += now - last;
      last = now;
      apply(frame((elapsed % LOOP_MS) / LOOP_MS));
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0; // reprise sans saut : le temps hors écran n'est pas compté
    };

    const sync = () => {
      const shouldRun = !reduce.matches && inView && document.visibilityState === "visible";
      if (reduce.matches) {
        stop();
        apply(staticFrame());
        return;
      }
      if (shouldRun && !raf) raf = requestAnimationFrame(tick);
      if (!shouldRun && raf) stop();
    };

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    if (rootRef.current) io.observe(rootRef.current);
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener("change", sync);
    sync();

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 800 800"
      role="img"
      aria-label={label}
      className="block h-auto w-full"
    >
      <defs>
        <filter id="mia-tile-shadow" x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="14" stdDeviation="11" floodColor="rgb(60,30,30)" floodOpacity="0.22" />
        </filter>
        <filter id="mia-file-shadow" x="-60%" y="-50%" width="220%" height="220%">
          <feDropShadow dx="0" dy="10" stdDeviation="4" floodColor="rgb(60,30,30)" floodOpacity="0.28" />
        </filter>
        {/* Icône fichier, centrée sur l'origine. */}
        <g id="mia-file">
          <g transform={`translate(${-FILE_W / 2} ${-FILE_H / 2})`} filter="url(#mia-file-shadow)">
            {/* Corps (rayon 8) dont le coin supérieur droit est replié. */}
            <path
              d={`M8 0 H${FILE_W - 16} L${FILE_W} 16 V${FILE_H - 8} A8 8 0 0 1 ${FILE_W - 8} ${FILE_H} H8 A8 8 0 0 1 0 ${FILE_H - 8} V8 A8 8 0 0 1 8 0 Z`}
              fill="#fff"
            />
            <path d={`M${FILE_W - 16} 0 L${FILE_W} 16 H${FILE_W - 18} Q${FILE_W - 16} 16 ${FILE_W - 16} 14 Z`} fill={ACCENT} />
            <rect x="9" y="26" width={(FILE_W - 18) * 0.62} height="4" rx="2" fill={ACCENT} fillOpacity="0.8" />
            <rect x="9" y="36" width={(FILE_W - 18) * 0.74} height="4" rx="2" fill="#d6cccc" />
            <rect x="9" y="46" width={(FILE_W - 18) * 0.48} height="4" rx="2" fill="#d6cccc" />
          </g>
        </g>
      </defs>

      {/* 1. Traits pointillés */}
      <g aria-hidden>
        {SOURCE_IDS.map((id, i) => (
          <line
            key={id}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            {...LINES[id]}
            stroke={ACCENT}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="15 13"
            strokeDashoffset={INITIAL.dashOffset.toFixed(2)}
          />
        ))}
      </g>

      {/* 2. Fichiers (sous les tuiles) */}
      <g aria-hidden>
        {INITIAL.files.map((f, i) => (
          <g
            key={i}
            ref={(el) => {
              fileRefs.current[i] = el;
            }}
            opacity={f.visible ? f.opacity.toFixed(3) : 0}
            transform={f.visible ? fileTransform(f) : undefined}
          >
            <use href="#mia-file" />
          </g>
        ))}
      </g>

      {/* 3. Tuiles */}
      <g aria-hidden>
        {SOURCE_IDS.map((id) => (
          <TileImage
            key={id}
            tile={SOURCES[id]}
            scale={INITIAL.sourceScale[id]}
            innerRef={(el) => {
              sourceRefs.current[id] = el;
            }}
          />
        ))}
        <TileImage
          tile={NOTION}
          scale={INITIAL.notionScale}
          innerRef={(el) => {
            notionRef.current = el;
          }}
        />
      </g>
    </svg>
  );
}

/**
 * Tuile : icône d'app (forme arrondie incluse dans l'image) + ombre portée.
 * Images 512 px pour une tuile affichée à ~133 px CSS max : nette en retina.
 */
function TileImage({
  tile,
  scale,
  innerRef,
}: {
  tile: Tile;
  scale: number;
  innerRef: (el: SVGGElement | null) => void;
}) {
  const half = tile.size / 2;
  return (
    <g ref={innerRef} transform={tileTransform(tile, scale)}>
      <g filter="url(#mia-tile-shadow)">
        <image
          href={`${LOGO_DIR}/${tile.logo}.webp`}
          x={-half}
          y={-half}
          width={tile.size}
          height={tile.size}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </g>
  );
}
