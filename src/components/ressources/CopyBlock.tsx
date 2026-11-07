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
 * Encadré « À copier » :
 *  1. boutons « Installer sur … » (3 colonnes) : ouvrent l'IA avec le prompt
 *     pré-rempli quand elle le permet, et copient le prompt au passage (repli
 *     si le pré-remplissage ne fonctionne pas) ;
 *  2. la valeur exacte + bouton Copier ;
 *  3. la consigne.
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
    <div className="rounded-md border border-accent/30 bg-card p-5 nc-shadow-2 sm:p-7">
      <p className="nc-eyebrow">{section.titre}</p>

      {section.ouvrirDans && section.ouvrirDans.length > 0 && (
        <>
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {section.ouvrirDans.map((lien) => (
              <li key={lien.url}>
                <a
                  href={lien.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => void copy("lien")}
                  className="flex h-full flex-col items-center justify-center gap-2 rounded-sm border border-line bg-card px-2 py-4 text-center transition-colors duration-[250ms] hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:gap-3 sm:px-3 sm:py-5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lien.logo}
                    alt=""
                    width={48}
                    height={48}
                    className="h-10 w-10 sm:h-12 sm:w-12"
                  />
                  <span className="text-[0.8125rem] font-medium leading-snug text-ink sm:text-[0.9375rem]">
                    {lien.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {copied === "lien" && (
            <p className="nc-tab-in mt-3 text-center text-sm text-muted">
              Instructions copiées : colle-les si le message n&apos;est pas déjà rempli.
            </p>
          )}
        </>
      )}

      <div className="mt-4">
        <p className="rounded-xs bg-raised px-4 py-3 text-[0.9375rem] leading-relaxed text-ink [overflow-wrap:anywhere] select-all">
          <BreakableUrls text={section.valeur} />
        </p>
        <button
          type="button"
          onClick={() => void copy("bouton")}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-line bg-card px-5 py-3 text-[0.9375rem] font-medium text-ink transition-[color,border-color,transform] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-accent hover:text-accent active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <ActionSwap item={copied === "bouton" ? COPIED : idle} />
        </button>
      </div>

      <p className="mt-4 text-[1rem] leading-relaxed text-muted">
        <RichText>{section.consigne}</RichText>
      </p>
      <span className="sr-only" aria-live="polite">
        {copied ? "Instructions copiées dans le presse-papiers" : ""}
      </span>
    </div>
  );
}

/** Points de coupure après les « / » des URL (évite « p/rompts » en mobile). */
function BreakableUrls({ text }: { text: string }) {
  return (
    <>
      {text.split(/(?<=\/)/).map((part, i) => (
        <span key={i}>
          {i > 0 && <wbr />}
          {part}
        </span>
      ))}
    </>
  );
}
