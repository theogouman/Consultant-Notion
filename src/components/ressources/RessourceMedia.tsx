"use client";

import { useEffect, useRef, useState } from "react";
import type { RessourceMedia as Media } from "@/content/ressources/types";
import { animations } from "./animations";

/**
 * Média du hero. Animation codée : rendue telle quelle. Vidéo : `autoPlay muted loop playsInline`, avec un visuel de
 * repli aux couleurs de marque, visible tant que la vidéo n'a pas d'image
 * (chargement) ou si le fichier est absent / illisible.
 */
export default function RessourceMedia({ media }: { media: Media }) {
  // Animation codée : fond transparent, sans cadre, centrée et compacte.
  if (media.type === "animation") {
    const Animation = animations[media.nom];
    return (
      <div className="mx-auto w-full max-w-[340px] sm:max-w-[420px]">
        <Animation label={media.alt} />
      </div>
    );
  }
  return <FramedMedia media={media} />;
}

/** Vidéo ou image dans une carte, avec visuel de repli. */
function FramedMedia({ media }: { media: Exclude<Media, { type: "animation" }> }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Erreur survenue avant l'hydratation : l'évènement a déjà été émis.
    if (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      setFailed(true);
      return;
    }
    // Mouvement réduit : pas de lecture automatique.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      v.controls = true;
    }
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-line/70 bg-card nc-shadow-2">
      <Fallback />
      {media.type === "video" && !failed && (
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover"
          src={media.src}
          poster={media.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={media.alt}
          onError={() => setFailed(true)}
        />
      )}
      {media.type === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.src}
          alt={media.alt}
          width={media.width}
          height={media.height}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

/** Visuel de repli : halo corail + logo Notion. Purement décoratif. */
function Fallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background:
          "radial-gradient(60% 70% at 0% 50%, rgba(224,99,90,0.22) 0%, transparent 70%), radial-gradient(60% 70% at 100% 50%, rgba(224,99,90,0.2) 0%, transparent 70%), #fff",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/Annexes/Notion_app_logo.png"
        alt=""
        width={96}
        height={96}
        className="h-16 w-16 opacity-90 sm:h-24 sm:w-24"
      />
    </div>
  );
}
