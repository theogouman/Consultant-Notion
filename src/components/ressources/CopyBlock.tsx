"use client";

import { useEffect, useRef, useState } from "react";
import RichText from "./RichText";
import type { SectionCopie } from "@/content/ressources/types";

/** Encadré « À copier » : valeur exacte + bouton Copier (presse-papiers). */
export default function CopyBlock({ section }: { section: SectionCopie }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(section.valeur);
    } catch {
      // Repli (contexte non sécurisé, vieux navigateurs) : sélection + execCommand.
      const ta = document.createElement("textarea");
      ta.value = section.valeur;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md border border-accent/30 bg-card p-5 nc-shadow-2 sm:p-7">
      <p className="nc-eyebrow">{section.titre}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <code className="flex min-w-0 flex-1 items-center rounded-xs bg-raised px-4 py-3 font-sans text-[0.9375rem] text-ink [overflow-wrap:anywhere] select-all">
          {section.valeur}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex flex-none items-center justify-center gap-2 rounded-xl border border-line bg-card px-5 py-3 text-[0.9375rem] font-medium text-ink transition-colors duration-[250ms] hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copié
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="5.5" y="5.5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 3.5V3a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Copier
            </>
          )}
        </button>
      </div>
      <p className="mt-4 text-[1rem] leading-relaxed text-muted">
        <RichText>{section.consigne}</RichText>
      </p>
      <span className="sr-only" aria-live="polite">
        {copied ? "Lien copié dans le presse-papiers" : ""}
      </span>
    </div>
  );
}
