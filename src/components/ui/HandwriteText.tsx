"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Texte à « écriture progressive manuscrite » : les lettres apparaissent
 * l'une après l'autre (gauche → droite), déclenché quand la section entre
 * dans le viewport — pour attirer l'œil. Respecte prefers-reduced-motion
 * (rendu instantané).
 */
export default function HandwriteText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setOn(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const chars = Array.from(text);
  const isEmoji = (c: string) => /\p{Extended_Pictographic}/u.test(c);

  return (
    <span
      ref={ref}
      aria-label={text}
      className={`nc-handwrite ${on ? "is-on" : ""} ${className}`}
    >
      <span aria-hidden className="nc-handwrite__text">
        {chars.map((c, i) => (
          <span
            key={i}
            className="nc-handwrite__char"
            // Les emoji ne doivent pas être italiques.
            style={{
              transitionDelay: `${i * 70}ms`,
              ...(isEmoji(c) ? { fontStyle: "normal" } : null),
            }}
          >
            {c === " " ? " " : c}
          </span>
        ))}
      </span>
    </span>
  );
}
