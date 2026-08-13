import Image from "next/image";
import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
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
              /* pt-14 : marge en haut (padding sur l'image `fill`, pas sur le
                 conteneur qui serait ignoré) pour que la photo ne touche pas le
                 haut de l'encadré. object-bottom garde la photo collée en bas. */
              className="object-contain object-bottom pl-10 pr-2 pt-14"
            />
          </div>

          {/* Colonne texte — desktop : à droite. pt-6 en mobile : plus d'espace
              entre la photo empilée au-dessus et le titre « Enchanté ». */}
          <div className="px-6 pb-10 pt-6 sm:py-12 sm:pl-6 sm:pr-12">
            <Reveal>
              <h2 className="nc-title text-3xl sm:text-4xl">{about.name}</h2>
            </Reveal>
            <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-muted">
              <Reveal>
                <p>Je suis Théo Gouman, consultant Notion multi-certifié.</p>
              </Reveal>
              <Reveal delay={60}>
                <p>
                  Depuis 2022, je crée du contenu sur{" "}
                  <a
                    href="https://www.linkedin.com/in/theogouman/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap font-medium text-ink transition-colors hover:text-accent"
                  >
                    LinkedIn
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/Annexes/linkedin-dark.svg"
                      alt=""
                      className="ml-1 inline-block h-[0.95em] w-[0.95em] align-[-0.15em]"
                    />
                  </a>{" "}
                  et{" "}
                  <a
                    href="https://www.youtube.com/@ThéoGouman?sub_confirmation=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap font-medium text-ink transition-colors hover:text-accent"
                  >
                    YouTube
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/Annexes/youtube-icon.svg"
                      alt=""
                      className="ml-1 inline-block h-[0.95em] w-[0.95em] align-[-0.15em]"
                    />
                  </a>{" "}
                  au sujet de Notion.
                </p>
              </Reveal>
              <Reveal delay={120}>
                <p>
                  C&apos;est ce qui m&apos;a amené à accompagner +100 TPE / PME à
                  implémenter cet outil dans leur organisation pour qu&apos;elles
                  gagnent en efficacité.
                </p>
              </Reveal>
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
                        className="h-[54px] w-[54px] object-contain sm:h-[68px] sm:w-[68px]"
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
