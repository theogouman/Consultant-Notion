"use client";

import { useEffect, useRef, useState } from "react";
import type { QualificationInput, Situation } from "../types";

/**
 * Formulaire de qualification, une question à la fois (§7).
 * Ordre : créneau d'abord (géré en amont), puis ce formulaire.
 * Champs : nom, e-mail, activité, situation (bulles), motivation, invité (opt.).
 * Anti-bot : honeypot caché. prefers-reduced-motion : transitions désactivées.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SHIFT = 34;

type FieldId = "name" | "email" | "activity" | "situation" | "motivation" | "guestEmail";

interface Step {
  id: FieldId;
  question: string;
  hint?: string;
  type: "text" | "email" | "textarea" | "bubbles";
  placeholder?: string;
  autoComplete?: string;
  optional?: boolean;
  options?: { value: Situation; label: string }[];
}

const STEPS: Step[] = [
  { id: "name", question: "Quel est votre nom complet ?", type: "text", placeholder: "Théo Gouman", autoComplete: "name" },
  { id: "email", question: "Quelle est votre adresse e-mail ?", type: "email", placeholder: "theo@gouman.fr", autoComplete: "email" },
  { id: "activity", question: "Quelle est votre activité ?", type: "text", placeholder: "Agence de communication, cabinet comptable, société immobilière…" },
  {
    id: "situation",
    question: "Qu'est-ce qui définit le mieux votre situation ?",
    type: "bubbles",
    options: [
      { value: "notion_mal", label: "On utilise déjà Notion, mais mal" },
      { value: "pas_outil", label: "On n'a pas d'outil d'organisation" },
    ],
  },
  { id: "motivation", question: "Qu'est-ce qui vous motive à réserver cet appel ?", type: "textarea", placeholder: "Décrivez en quelques mots votre situation et ce que vous aimeriez améliorer." },
  { id: "guestEmail", question: "Souhaitez-vous inviter une autre personne ?", hint: "Facultatif — laissez vide pour passer.", type: "email", placeholder: "collegue@entreprise.fr", autoComplete: "off", optional: true },
];

type Values = { name: string; email: string; activity: string; situation: string; motivation: string; guestEmail: string };
const EMPTY: Values = { name: "", email: "", activity: "", situation: "", motivation: "", guestEmail: "" };

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function QualificationForm({
  submitting,
  serverError,
  onSubmit,
  onBackToSlots,
}: {
  submitting: boolean;
  serverError: string | null;
  onSubmit: (input: QualificationInput) => void;
  onBackToSlots: () => void;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const dirRef = useRef<1 | -1>(1);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!stageRef.current || prefersReducedMotion()) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
    const el = stageRef.current;
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(
      [
        { transform: `translateY(${SHIFT * dirRef.current}px)`, opacity: 0 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 300, easing: EASE, fill: "both" },
    );
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [step]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function validate(): boolean {
    const v = values[current.id].trim();
    if (current.optional && !v) return true;
    if (current.id === "email" || current.id === "guestEmail") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setError("Adresse e-mail invalide.");
        return false;
      }
    } else if (!v) {
      setError(current.type === "bubbles" ? "Sélectionnez une option." : "Ce champ est requis.");
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
    if (submitting) return;
    if (!validate()) return;
    if (isLast) {
      doSubmit();
      return;
    }
    transition(step + 1, 1);
  }

  function goBack() {
    setError(null);
    if (step === 0) {
      onBackToSlots();
      return;
    }
    transition(step - 1, -1);
  }

  function doSubmit() {
    onSubmit({
      name: values.name.trim(),
      email: values.email.trim(),
      activity: values.activity.trim(),
      situation: values.situation as Situation,
      motivation: values.motivation.trim(),
      guestEmail: values.guestEmail.trim() || undefined,
      company: honeypotRef.current?.value || "",
    });
  }

  function selectBubble(value: Situation) {
    setValues((v) => ({ ...v, situation: value }));
    setError(null);
    window.setTimeout(() => transition(step + 1, 1), 240);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && current.type !== "textarea") {
      e.preventDefault();
      goNext();
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const shownError = error ?? serverError;

  return (
    <div>
      {/* Barre de progression */}
      <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-raised">
        <div
          className="h-full bg-accent transition-[width] duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Honeypot anti-bot (hors écran, non focusable). */}
      <input
        ref={honeypotRef}
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="min-h-[190px]">
        <div ref={stageRef}>
          <h2 className="nc-title mb-1 text-xl sm:text-2xl">{current.question}</h2>
          {current.hint && <p className="mb-4 text-sm text-muted">{current.hint}</p>}
          {!current.hint && <div className="mb-4" />}

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
                      selected ? "border-accent bg-accent/5 text-ink" : "border-line bg-raised text-ink hover:border-accent/50"
                    }`}
                  >
                    <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${selected ? "border-accent" : "border-line"}`}>
                      {selected && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
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
              onChange={(e) => setValues((v) => ({ ...v, [current.id]: e.target.value }))}
              onKeyDown={onKeyDown}
              aria-invalid={!!shownError}
              className={`w-full resize-y rounded-sm border bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none transition-colors duration-[200ms] focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20 ${shownError ? "border-accent" : "border-line"}`}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={current.type}
              inputMode={current.type === "email" ? "email" : undefined}
              autoComplete={current.autoComplete}
              placeholder={current.placeholder}
              value={values[current.id]}
              onChange={(e) => setValues((v) => ({ ...v, [current.id]: e.target.value }))}
              onKeyDown={onKeyDown}
              aria-invalid={!!shownError}
              className={`w-full rounded-sm border bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none transition-colors duration-[200ms] focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20 ${shownError ? "border-accent" : "border-line"}`}
            />
          )}

          {shownError && <p className="mt-2 text-sm text-accent">{shownError}</p>}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={goBack}
          disabled={submitting}
          className="text-sm font-medium text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← {step === 0 ? "Créneaux" : "Retour"}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#d1504a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Réservation…" : isLast ? "Réserver mon appel" : current.optional ? "Terminer" : "Suivant"}
          {!submitting && <span aria-hidden>→</span>}
        </button>
      </div>
    </div>
  );
}
