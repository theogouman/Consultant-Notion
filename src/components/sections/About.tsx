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
 *  - desktop : deux colonnes, la photo (découpe sur fond transparent) est à
 *    GAUCHE, collée en bas de l'encadré, avec du padding pour ne pas toucher
 *    les bords ; le contenu est à droite ;
 *  - mobile : empilement, la photo passe en haut (cadrage plus carré, rogné en
 *    bas) et se fond vers le titre via un masque dégradé net en bas de l'image.
 */
export default function About() {
  return (
    <Section id="qui-je-suis" width="default">
      <div className="relative overflow-hidden rounded-md border border-line bg-card nc-shadow-2">
        {/* Photo — mobile : empilée en haut, taille intermédiaire et centrée,
            rognée en bas avec un fondu DISCRET (fine bande) vers le contenu. */}
        <div className="px-5 pt-8 sm:hidden">
          <div className="nc-photo-fade relative mx-auto aspect-[4/5] w-[80%] max-w-[300px] overflow-hidden">
            <Image
              src={PHOTO}
              alt="Théo Gouman, consultant Notion"
              fill
              sizes="300px"
              className="object-cover object-top"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[340px_minmax(0,1fr)]">
          {/* Colonne photo — desktop : à gauche, collée en bas, padding latéral. */}
          <div className="relative hidden self-stretch sm:block">
            <Image
              src={PHOTO}
              alt=""
              aria-hidden
              fill
              sizes="340px"
              className="object-contain object-bottom pl-10 pr-2"
            />
          </div>

          {/* Colonne texte — desktop : à droite. pt-6 en mobile : plus d'espace
              entre la photo empilée au-dessus et le titre « Enchanté ». */}
          <div className="px-6 pb-10 pt-6 sm:py-12 sm:pl-6 sm:pr-12">
            <Reveal>
              <HandwriteText
                text={about.eyebrow}
                className="mb-2 text-base sm:text-lg"
              />
              <h2 className="nc-title text-3xl sm:text-4xl">{about.name}</h2>
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
                {/* Badges sur une seule ligne. Mobile : taille fixe réduite
                    (discrète), groupés à gauche. Desktop : rangée à taille fixe
                    68px. Tooltip au survol (transitions.dev · tooltip). */}
                <div className="flex flex-nowrap items-center gap-2.5 sm:gap-2.5">
                  {about.certifications.map((cert) => (
                    <span key={cert.src} className="t-tt-wrap flex-none">
                      <Image
                        src={cert.src}
                        alt={cert.label}
                        width={72}
                        height={72}
                        className="h-10 w-10 object-contain sm:h-[68px] sm:w-[68px]"
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
        </div>
      </div>
    </Section>
  );
}
