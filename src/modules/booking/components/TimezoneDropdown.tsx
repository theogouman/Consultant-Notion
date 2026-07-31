"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TIMEZONE_OPTIONS,
  timezoneParts,
  type TimezoneOption,
} from "../lib/timezone";

/**
 * Sélecteur de fuseau custom (pas le menu natif de l'OS). Affiche « Horaire de
 * <ville> <drapeau> » et permet de changer le fuseau d'affichage des créneaux.
 */
export default function TimezoneDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (tz: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Le fuseau courant est toujours listé (ajouté en tête s'il est inconnu).
  const options: TimezoneOption[] = useMemo(() => {
    if (TIMEZONE_OPTIONS.some((o) => o.tz === value)) return TIMEZONE_OPTIONS;
    const { city, flag } = timezoneParts(value);
    return [{ tz: value, city, flag }, ...TIMEZONE_OPTIONS];
  }, [value]);

  const current = timezoneParts(value);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-xs text-muted transition-colors hover:text-ink"
      >
        <span>Horaire de {current.city} {current.flag}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-1 max-h-64 w-56 overflow-y-auto rounded-sm border border-line bg-card py-1 nc-shadow-2"
        >
          {options.map((opt) => {
            const selected = opt.tz === value;
            return (
              <li key={opt.tz}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt.tz);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    selected ? "bg-accent/5 text-accent" : "text-ink hover:bg-raised"
                  }`}
                >
                  <span className="text-base leading-none">{opt.flag}</span>
                  <span>{opt.city}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
