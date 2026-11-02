"use client";

import { useState, type ReactNode } from "react";

type TabKey = "logs" | "links" | "settings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "logs", label: "Logs" },
  { key: "links", label: "Liens de planification" },
  { key: "settings", label: "Réglages" },
];

/**
 * Onglets de l'admin. Les sections sont rendues côté serveur et passées en
 * props : on bascule la visibilité (l'état des formulaires est préservé).
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

  return (
    <div>
      <div className="mb-8 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active === t.key
                ? "border-accent text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {TABS.map((t) => (
        <div key={t.key} hidden={active !== t.key}>
          {panels[t.key]}
        </div>
      ))}
    </div>
  );
}
