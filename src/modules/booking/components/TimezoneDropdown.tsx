"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  TIMEZONE_OPTIONS,
  timezoneParts,
  type TimezoneOption,
} from "../lib/timezone";

/**
 * Sélecteur de fuseau custom (pas le menu natif de l'OS). Affiche « Horaire de
 * <ville> <drapeau> ». Le popover est rendu en portal (document.body) pour ne
 * jamais être rogné par le overflow du modal.
 */
export default function TimezoneDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (tz: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLUListElement>(null);

  useEffect(() => setMounted(true), []);

  const options: TimezoneOption[] = useMemo(() => {
    if (TIMEZONE_OPTIONS.some((o) => o.tz === value)) return TIMEZONE_OPTIONS;
    const { city, flag } = timezoneParts(value);
    return [{ tz: value, city, flag }, ...TIMEZONE_OPTIONS];
  }, [value]);

  const current = timezoneParts(value);

  // Positionne le popover sous le bouton (coordonnées viewport, position fixed).
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScrollOrResize() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
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

      {mounted && open && pos &&
        createPortal(
          <ul
            ref={popRef}
            role="listbox"
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className="z-[60] max-h-64 w-56 overflow-y-auto rounded-sm border border-line bg-card py-1 nc-shadow-2"
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
          </ul>,
          document.body,
        )}
    </>
  );
}
