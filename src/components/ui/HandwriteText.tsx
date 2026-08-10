"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Texte à « écriture progressive manuscrite » : les lettres apparaissent
 * l'une après l'autre (gauche → droite) et un trait corail tracé à la main
 * se dessine dessous, déclenché quand la section entre dans le viewport —
 * pour attirer l'œil. Respecte prefers-reduced-motion (rendu instantané).
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
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            {c === " " ? " " : c}
          </span>
        ))}
      </span>
      <svg
        aria-hidden
        className="nc-handwrite__underline"
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
      >
        <path
          d="M3 8 C 42 2, 78 12, 116 6 S 176 3, 197 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
