"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BOOKING_URL } from "@/lib/content";

/**
 * Formulaire de qualification en modal (§9), une question à la fois.
 *
 * À l'ouverture, un modal s'affiche et présente les questions l'une après
 * l'autre. Au passage à la suivante, la question courante remonte vers le
 * haut (fondu + translation) et la suivante entre par le bas — animation
 * smooth via la Web Animations API. La question « situation » utilise des
 * bulles (radio) au lieu d'un menu déroulant.
 *
 * Neutre (aucune disqualification). À la dernière étape valide → redirection
 * vers NEXT_PUBLIC_BOOKING_URL. Aucune donnée en query string.
 * prefers-reduced-motion : transitions désactivées.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SHIFT = 34; // px

type FieldId = "name" | "email" | "activity" | "situation" | "motivation";

interface Step {
  id: FieldId;
  question: string;
  type: "text" | "email" | "textarea" | "bubbles";
  placeholder?: string;
  autoComplete?: string;
  options?: { value: string; label: string }[];
}

const STEPS: Step[] = [
  {
    id: "name",
    question: "Quel est votre nom complet ?",
    type: "text",
    placeholder: "Théo Gouman",
    autoComplete: "name",
  },
  {
    id: "email",
    question: "Quelle est votre adresse e-mail ?",
    type: "email",
    placeholder: "theo@gouman.fr",
    autoComplete: "email",
  },
  {
    id: "activity",
    question: "Quelle est votre activité ?",
    type: "text",
    placeholder: "Agence de communication, cabinet comptable, société immobilière…",
  },
  {
    id: "situation",
    question: "Qu’est-ce qui définit le mieux votre situation ?",
    type: "bubbles",
    options: [
      { value: "notion-mal", label: "On utilise déjà Notion, mais mal" },
      { value: "pas-outil", label: "On n’a pas d’outil d’organisation" },
    ],
  },
  {
    id: "motivation",
    question: "Qu’est-ce qui vous motive à réserver cet appel ?",
    type: "textarea",
    placeholder:
      "Décrivez en quelques mots votre situation et ce que vous aimeriez améliorer.",
  },
];

const EMPTY = {
  name: "",
  email: "",
  activity: "",
  situation: "",
  motivation: "",
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function QualificationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const dirRef = useRef<1 | -1>(1);
  const animatingRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Réinitialise à la première question à chaque ouverture.
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Verrou du scroll de fond.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Animation d'entrée de la question + focus.
  useEffect(() => {
    if (!isOpen) return;
    const el = stageRef.current;
    if (el && !prefersReducedMotion()) {
      el.getAnimations().forEach((a) => a.cancel());
      el.animate(
        [
          { transform: `translateY(${SHIFT * dirRef.current}px)`, opacity: 0 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        { duration: 300, easing: EASE, fill: "both" },
      );
    }
    // Focus le champ (hors bulles).
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [step, isOpen]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function validate(): boolean {
    const v = values[current.id].trim();
    if (current.id === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setError("Adresse e-mail invalide.");
        return false;
      }
    } else if (!v) {
      setError(
        current.type === "bubbles"
          ? "Sélectionnez une option."
          : "Ce champ est requis.",
      );
      return false;
    }
    setError(null);
    return true;
  }

  function transition(to: number, dir: 1 | -1) {
    dirRef.current = dir;
    const el = stageRef.current;
    if (!el || prefersReducedMotion()) {
      setStep(to);
      return;
    }
    if (animatingRef.current) return;
    animatingRef.current = true;
    el.getAnimations().forEach((a) => a.cancel());
    const anim = el.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: `translateY(${-SHIFT * dir}px)`, opacity: 0 },
      ],
      { duration: 240, easing: EASE, fill: "forwards" },
    );
    anim.onfinish = () => {
      animatingRef.current = false;
      setStep(to);
    };
  }

  function goNext() {
    if (!validate()) return;
    if (isLast) {
      submit();
      return;
    }
    transition(step + 1, 1);
  }

  function goBack() {
    if (step === 0) return;
    setError(null);
    transition(step - 1, -1);
  }

  function submit() {
    setSubmitting(true);
    // Redirection vers la prise de rendez-vous — aucune donnée en query string.
    // TODO: brancher l'envoi des réponses à un CRM / webhook côté serveur.
    window.location.href = BOOKING_URL;
  }

  function selectBubble(value: string) {
    setValues((v) => ({ ...v, situation: value }));
    setError(null);
    // Avance automatiquement, une fois la sélection visible.
    window.setTimeout(() => transition(step + 1, 1), 240);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && current.type !== "textarea") {
      e.preventDefault();
      goNext();
    }
  }

  if (!mounted || !isOpen) return null;

  const progress = ((step + 1) / STEPS.length) * 100;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Formulaire de qualification"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div
        className="nc-modal-backdrop absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="nc-modal-panel relative m-0 flex w-full max-w-lg flex-col rounded-t-md bg-card nc-shadow-2 sm:m-4 sm:rounded-md">
        {/* Barre de progression */}
        <div className="h-1 w-full overflow-hidden rounded-t-md bg-raised">
          <div
            className="h-full bg-accent transition-[width] duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-6 pt-5 sm:px-8">
          <span className="text-sm font-medium text-muted">
            Étape {step + 1} sur {STEPS.length}
          </span>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-raised text-muted transition-colors hover:bg-line hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Zone de question animée */}
        <div className="min-h-[220px] px-6 py-6 sm:px-8">
          <div ref={stageRef}>
            <h2
              id="qualif-question"
              className="nc-title mb-5 text-xl sm:text-2xl"
            >
              {current.question}
            </h2>

            {current.type === "bubbles" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {current.options!.map((opt) => {
                  const selected = values.situation === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => selectBubble(opt.value)}
                      className={`flex items-center gap-3 rounded-sm border px-5 py-4 text-left text-[1.0625rem] transition-all duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        selected
                          ? "border-accent bg-accent/5 text-ink"
                          : "border-line bg-raised text-ink hover:border-accent/50"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
                          selected ? "border-accent" : "border-line"
                        }`}
                      >
                        {selected && (
                          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                        )}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            ) : current.type === "textarea" ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                rows={4}
                placeholder={current.placeholder}
                value={values[current.id]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [current.id]: e.target.value }))
                }
                onKeyDown={onKeyDown}
                aria-invalid={!!error}
                className={`w-full resize-y rounded-sm border bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none transition-colors duration-[200ms] focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20 ${
                  error ? "border-accent" : "border-line"
                }`}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={current.type}
                inputMode={current.type === "email" ? "email" : undefined}
                autoComplete={current.autoComplete}
                placeholder={current.placeholder}
                value={values[current.id]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [current.id]: e.target.value }))
                }
                onKeyDown={onKeyDown}
                aria-invalid={!!error}
                className={`w-full rounded-sm border bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none transition-colors duration-[200ms] focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20 ${
                  error ? "border-accent" : "border-line"
                }`}
              />
            )}

            {error && <p className="mt-2 text-sm text-accent">{error}</p>}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4 sm:px-8">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="text-sm font-medium text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-0"
          >
            ← Retour
          </button>
          <button
            onClick={goNext}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#d1504a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? "Redirection…"
              : isLast
                ? "Réserver mon appel"
                : "Suivant"}
            {!submitting && <span aria-hidden>→</span>}
          </button>
        </div>

        {isLast && (
          <p className="px-6 pb-5 text-center text-sm text-muted sm:px-8">
            20 minutes, gratuit, sans engagement.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
