"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import CtaButton from "@/components/ui/CtaButton";
import { footer } from "@/lib/content";

/**
 * En-tête collant, sobre. Logo à gauche.
 *
 * Le CTA apparaît (fondu + léger glissement) uniquement lorsque le bouton du
 * hero n'est plus visible : un IntersectionObserver surveille `#hero-cta`, ce
 * qui « bascule » le CTA du hero vers le header sans jamais afficher les deux
 * boutons en même temps.
 */
export default function Header() {
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const target = document.getElementById("hero-cta");
    // Pas de repère (hero absent) : on montre le CTA par défaut.
    if (!target) {
      setShowCta(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setShowCta(!entry.isIntersecting),
      // Décale le haut de la zone d'observation sous le header collant (h-16).
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-page/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-5 sm:px-8">
        <Link href="#top" className="flex items-center gap-2.5 font-bold tracking-tight">
          <Image
            src="/images/Annexes/theo-gouman-avatar.png"
            alt="Théo Gouman"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />
          <span className="text-ink">{footer.name}</span>
        </Link>

        <div
          className={`ml-auto transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            showCta
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          }`}
          aria-hidden={!showCta}
        >
          <CtaButton className="!px-5 !py-2.5 !text-sm">
            Réserver un appel
            <span aria-hidden>→</span>
          </CtaButton>
        </div>
      </div>
    </header>
  );
}
