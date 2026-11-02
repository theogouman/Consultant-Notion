"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type TabKey = "logs" | "links" | "settings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "logs", label: "Logs" },
  { key: "links", label: "Liens de planification" },
  { key: "settings", label: "Réglages" },
];

/**
 * Onglets de l'admin. Soulignement glissant (adapté de transitions.dev
 * « tabs-sliding ») + entrée en fondu du panneau actif. Les sections sont
 * rendues côté serveur et passées en props : l'état des formulaires est
 * préservé (on bascule seulement la visibilité).
 */
export default function AdminTabs({
  logs,
  links,
  settings,
}: {
  logs: ReactNode;
  links: ReactNode;
  settings: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("logs");
  const panels: Record<TabKey, ReactNode> = { logs, links, settings };

  const barRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const firstPaint = useRef(true);

  useLayoutEffect(() => {
    const el = tabRefs.current[active];
    const bar = barRef.current;
    if (!el || !bar) return;
    const next = { left: el.offsetLeft, width: el.offsetWidth };
    // Pas d'animation au tout premier placement.
    if (firstPaint.current) {
      firstPaint.current = false;
      bar.style.transition = "none";
      setPill(next);
      // Force un reflow puis restaure la transition.
      void bar.offsetWidth;
      bar.style.transition = "";
    } else {
      setPill(next);
    }
  }, [active]);

  return (
    <div>
      <div className="relative mb-8 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[t.key] = el;
            }}
            type="button"
            onClick={() => setActive(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              active === t.key ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
        {/* Soulignement glissant. */}
        <div
          ref={barRef}
          className="pointer-events-none absolute -bottom-px h-0.5 rounded-full bg-accent transition-[transform,width] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
        />
      </div>

      {TABS.map((t) => (
        <div key={t.key} hidden={active !== t.key} className={active === t.key ? "nc-tab-in" : ""}>
          {panels[t.key]}
        </div>
      ))}
    </div>
  );
}
