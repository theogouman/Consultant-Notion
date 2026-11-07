"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ActionSwap, { type SwapItem } from "@/components/ui/ActionSwap";
import RichText from "./RichText";
import type { SectionCopie } from "@/content/ressources/types";

const COPY_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="5.5" y="5.5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 3.5V3a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const COPIED: SwapItem = {
  id: "copied",
  label: "Instructions copiées",
  icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/** Copie dans le presse-papiers, avec repli pour les contextes restreints. */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/**
 * Bloc d'installation (sans encadré) :
 *  1. titre ;
 *  2. boutons « Installer sur … » (une colonne par IA) : ouvrent l'IA avec le
 *     prompt pré-rempli, et copient le prompt au passage (repli) ;
 *  3. bouton « Copier » (action swap blur) : le prompt n'est pas affiché ;
 *  4. consigne optionnelle.
 */
export default function CopyBlock({ section }: { section: SectionCopie }) {
  const [copied, setCopied] = useState<"bouton" | "lien" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async (from: "bouton" | "lien") => {
    await copyText(section.valeur);
    setCopied(from);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), from === "lien" ? 6000 : 2000);
  };

  const idle = useMemo<SwapItem>(
    () => ({ id: "idle", label: section.boutonCopier ?? "Copier", icon: COPY_ICON }),
    [section.boutonCopier],
  );

  return (
    <div>
      <h2 className="nc-title nc-balance-wide text-center text-[1.75rem] sm:text-[2rem]">
        {section.titre}
      </h2>

      {section.ouvrirDans && section.ouvrirDans.length > 0 && (
        <ul
          className="mt-6 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${section.ouvrirDans.length}, minmax(0, 1fr))` }}
        >
          {section.ouvrirDans.map((lien) => (
            <li key={lien.url}>
              <a
                href={lien.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void copy("lien")}
                className="flex h-full items-center justify-center gap-2.5 rounded-xl border border-line bg-card px-3 py-3.5 nc-shadow-3 transition-[border-color,transform] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-accent active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:gap-3 sm:px-5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lien.logo} alt="" width={24} height={24} className="h-6 w-6 flex-none object-contain" />
                <span className="text-[0.875rem] font-medium leading-snug text-ink sm:text-[0.9375rem]">
                  {lien.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Le texte copié n'est pas affiché : il est porté par le bouton. */}
      <button
        type="button"
        onClick={() => void copy("bouton")}
        aria-label={`${section.boutonCopier ?? "Copier"} : ${section.valeur}`}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-line bg-card px-5 py-3.5 text-[0.9375rem] font-medium text-ink nc-shadow-3 transition-[color,border-color,transform] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-accent hover:text-accent active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <ActionSwap item={copied === "bouton" ? COPIED : idle} />
      </button>

      {section.consigne && (
        <p className="mt-4 text-center text-[1rem] leading-relaxed text-muted">
          <RichText>{section.consigne}</RichText>
        </p>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Instructions copiées dans le presse-papiers" : ""}
      </span>
    </div>
  );
}
