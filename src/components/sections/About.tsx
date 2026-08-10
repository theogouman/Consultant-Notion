import Image from "next/image";
import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import HandwriteText from "@/components/ui/HandwriteText";
import { about } from "@/lib/content";

const PHOTO = "/images/Annexes/theo-gouman-portrait.png";

/**
 * Bloc 9 — Enchanté (Théo Gouman).
 *
 * L'encadré est élargi pour accueillir la photo :
 *  - desktop : deux colonnes, la photo (découpe sur fond transparent) est
 *    collée en bas à droite de l'encadré blanc ;
 *  - mobile : empilement, la photo passe en haut et se fond (fondu progressif)
 *    vers le titre en dessous via un masque dégradé.
 */
export default function About() {
  return (
    <Section id="qui-je-suis" width="default">
      <div className="relative overflow-hidden rounded-md border border-line bg-card nc-shadow-2">
        {/* Photo — mobile : empilée en haut, fondu progressif vers le contenu. */}
        <div className="px-6 pt-8 sm:hidden">
          <Image
            src={PHOTO}
            alt="Théo Gouman, consultant Notion"
            width={640}
            height={1049}
            className="nc-photo-fade mx-auto block h-80 w-auto object-contain object-bottom"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_300px]">
          {/* Colonne texte */}
          <div className="px-8 pb-10 pt-1 sm:p-12 sm:pr-6">
            <Reveal>
              <HandwriteText
                text={about.eyebrow}
                className="mb-2 text-xl sm:text-2xl"
              />
              <h2 className="nc-title text-3xl sm:text-4xl">{about.name}</h2>
              <p className="mt-3 text-lg font-medium text-accent">
                {about.headline}
              </p>
            </Reveal>
            <div className="mt-6 space-y-4">
              {about.bio.map((p, i) => (
                <Reveal key={i} delay={i * 60}>
                  <p className="text-[1.0625rem] leading-relaxed text-muted">{p}</p>
                </Reveal>
              ))}
            </div>

            {about.certifications.length > 0 && (
              <Reveal className="mt-8">
                {/* Badges sur une seule ligne : compacts et resserrés (mobile :
                    répartis edge-to-edge ; desktop : groupés à gauche). Chaque
                    badge affiche l'intitulé de la certification en tooltip au
                    survol (technique transitions.dev · tooltip, pur CSS). */}
                <div className="flex flex-nowrap items-center justify-between gap-2 sm:justify-start sm:gap-4">
                  {about.certifications.map((cert) => (
                    <span key={cert.src} className="t-tt-wrap">
                      <Image
                        src={cert.src}
                        alt={cert.label}
                        width={56}
                        height={56}
                        className="h-11 w-11 object-contain sm:h-14 sm:w-14"
                      />
                      <span className="t-tt" role="tooltip">
                        {cert.label}
                      </span>
                    </span>
                  ))}
                </div>
              </Reveal>
            )}

            {about.socialProof.length > 0 && (
              <Reveal className="mt-6">
                <div className="flex flex-wrap gap-4 text-sm">
                  {about.socialProof.map((s) => (
                    <a
                      key={s.href}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          {/* Colonne photo — desktop : collée au bas à droite de l'encadré. */}
          <div className="relative hidden self-stretch sm:block">
            <Image
              src={PHOTO}
              alt=""
              aria-hidden
              fill
              sizes="300px"
              className="object-contain object-bottom"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
