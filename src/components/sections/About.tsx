import Image from "next/image";
import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import HandwriteText from "@/components/ui/HandwriteText";
import { about } from "@/lib/content";

/** Bloc 9 — Enchanté (Théo Gouman). */
export default function About() {
  return (
    <Section id="qui-je-suis" width="narrow">
      <div className="rounded-md border border-line bg-card p-8 nc-shadow-2 sm:p-12">
        <Reveal>
          <HandwriteText
            text={about.eyebrow}
            className="mb-4 text-3xl sm:text-4xl"
          />
          <h2 className="nc-title text-3xl sm:text-4xl">{about.name}</h2>
          <p className="mt-3 text-lg font-medium text-accent">{about.headline}</p>
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
            <div className="flex flex-wrap items-center gap-5 sm:gap-6">
              {about.certifications.map((cert) => (
                <Image
                  key={cert.src}
                  src={cert.src}
                  alt={cert.label}
                  title={cert.label}
                  width={72}
                  height={72}
                  className="h-16 w-16 object-contain sm:h-[72px] sm:w-[72px]"
                />
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
    </Section>
  );
}
