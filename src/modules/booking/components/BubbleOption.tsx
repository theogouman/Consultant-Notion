"use client";

import type { ReactNode } from "react";

/**
 * Option « bulle » à choix unique, partagée par les questionnaires (prise de
 * rendez-vous ET annulation) — une seule source de vérité pour le style.
 *
 * Règle (cf. docs) : l'intérieur du rond de sélection est TOUJOURS blanc
 * (bg-card) pour trancher avec le fond gris de l'option.
 */
export default function BubbleOption({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex items-center gap-3 rounded-sm border px-5 py-4 text-left text-[1.0625rem] transition-all duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-accent bg-accent/5 text-ink"
          : "border-line bg-raised text-ink hover:border-accent/50"
      }`}
    >
      <span
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border bg-card ${
          selected ? "border-accent" : "border-line"
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
      </span>
      {children}
    </button>
  );
}
