"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Situation } from "../types";

/**
 * Formulaire de qualification, une question à la fois (§7).
 * État (valeurs + étape) piloté par le parent -> les réponses sont conservées
 * quand on revient au calendrier.
 *
 * - Champs « activité » / « motivation » : textareas qui s'agrandissent au
 *   retour à la ligne (le modal se redimensionne via ResizeAnimator).
 * - Ctrl/⌘ + Entrée valide une textarea (Entrée seule = nouvelle ligne).
 * - Invité optionnel : bouton sous le champ e-mail (pas d'étape dédiée).
 * - Erreur de saisie : secousse + message (transitions.dev · error-state-shake).
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SHIFT = 34;
const SHAKE_MS = 80 * 2 + 60 * 2; // 280ms
const REVERT_HOLD_MS = 3000;

export type FormValues = {
  name: string;
  email: string;
  activity: string;
  situation: string;
  motivation: string;
  guestEmail: string;
};

type FieldId = "name" | "email" | "activity" | "situation" | "motivation";

interface Step {
  id: FieldId;
  question: string;
  type: "text" | "email" | "textarea" | "bubbles";
  placeholder?: string;
  autoComplete?: string;
  options?: { value: Situation; label: string }[];
}

const STEPS: Step[] = [
  { id: "name", question: "Quel est votre nom complet ?", type: "text", placeholder: "Théo Gouman", autoComplete: "name" },
  { id: "email", question: "Quelle est votre adresse e-mail ?", type: "email", placeholder: "theo@gouman.fr", autoComplete: "email" },
  { id: "activity", question: "Quelle est votre activité ?", type: "textarea", placeholder: "Agence de communication, cabinet comptable, société immobilière…" },
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
];

export const QUALIFICATION_STEPS_COUNT = STEPS.length;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function QualificationForm({
  values,
  onValuesChange,
  step,
  onStepChange,
  guestOpen,
  onGuestOpenChange,
  submitting,
  serverError,
  onSubmit,
}: {
  values: FormValues;
  onValuesChange: (patch: Partial<FormValues>) => void;
  step: number;
  onStepChange: (step: number) => void;
  guestOpen: boolean;
  onGuestOpenChange: (open: boolean) => void;
  submitting: boolean;
  serverError: string | null;
  onSubmit: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const fieldRef = useRef<HTMLElement | null>(null);
  const dirRef = useRef<1 | -1>(1);
  const animatingRef = useRef(false);
  const revertTimer = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [shakeNonce, setShakeNonce] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Animation d'entrée de la question + focus.
  useEffect(() => {
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
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [step]);

  // Rejoue la secousse à chaque nouvelle erreur (après le rendu de is-error).
  useEffect(() => {
    if (shakeNonce === 0 || prefersReducedMotion()) return;
    const field = fieldRef.current;
    if (!field) return;
    field.classList.remove("is-shaking");
    void field.offsetWidth; // reflow
    field.classList.add("is-shaking");
    const t = window.setTimeout(() => field.classList.remove("is-shaking"), SHAKE_MS + 20);
    return () => window.clearTimeout(t);
  }, [shakeNonce]);

  // Erreur serveur (ex. échec de soumission) -> même retour visuel.
  useEffect(() => {
    if (serverError) raiseError(serverError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverError]);

  function clearError() {
    if (revertTimer.current) {
      window.clearTimeout(revertTimer.current);
      revertTimer.current = null;
    }
    setError(null);
  }

  function raiseError(message: string) {
    setError(message);
    setShakeNonce((n) => n + 1);
    if (revertTimer.current) window.clearTimeout(revertTimer.current);
    revertTimer.current = window.setTimeout(() => {
      revertTimer.current = null;
      setError(null);
    }, SHAKE_MS + REVERT_HOLD_MS);
  }

  function validate(): boolean {
    const raw = values[current.id] ?? "";
    const v = raw.trim();
    if (current.id === "email") {
      if (!EMAIL_RE.test(v)) return fail("Adresse e-mail invalide.");
      if (guestOpen && values.guestEmail.trim() && !EMAIL_RE.test(values.guestEmail.trim())) {
        return fail("L'e-mail de l'invité est invalide.");
      }
    } else if (!v) {
      return fail(current.type === "bubbles" ? "Sélectionnez une option." : "Ce champ est requis.");
    }
    clearError();
    return true;
  }

  function fail(msg: string): boolean {
    raiseError(msg);
    return false;
  }

  function transitionTo(to: number, dir: 1 | -1) {
    dirRef.current = dir;
    const el = stageRef.current;
    if (!el || prefersReducedMotion()) {
      onStepChange(to);
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
      onStepChange(to);
    };
  }

  function goNext() {
    if (submitting) return;
    if (!validate()) return;
    if (isLast) {
      onSubmit();
      return;
    }
    transitionTo(step + 1, 1);
  }

  function goBack() {
    if (step === 0) return;
    clearError();
    transitionTo(step - 1, -1);
  }

  function selectBubble(value: Situation) {
    onValuesChange({ situation: value });
    clearError();
    window.setTimeout(() => transitionTo(step + 1, 1), 240);
  }

  function setValue(id: keyof FormValues, value: string) {
    if (error) clearError();
    onValuesChange({ [id]: value } as Partial<FormValues>);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    if (current.type === "textarea") {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        goNext();
      }
      return; // Entrée seule = nouvelle ligne
    }
    e.preventDefault();
    goNext();
  }

  const fieldBorder = error ? "is-error border-accent" : "border-line";
  const fieldClass = `t-input w-full rounded-sm border bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20 ${fieldBorder}`;

  return (
    <div>
      <div className="min-h-[190px]">
        <div ref={stageRef}>
          <h2 className="nc-title mb-4 text-xl sm:text-2xl">{current.question}</h2>

          <div className={`t-input-wrap ${error ? "is-error" : ""}`}>
            {current.type === "bubbles" ? (
              <div ref={fieldRef as React.RefObject<HTMLDivElement>} className={`t-input grid gap-3 sm:grid-cols-2 ${error ? "is-error" : ""}`}>
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
              <AutoGrowTextarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement | null>}
                fieldRef={fieldRef as React.RefObject<HTMLElement | null>}
                placeholder={current.placeholder}
                value={values[current.id]}
                onChange={(val) => setValue(current.id, val)}
                onKeyDown={onKeyDown}
                className={fieldClass}
              />
            ) : (
              <input
                ref={(el) => {
                  inputRef.current = el;
                  fieldRef.current = el;
                }}
                type={current.type}
                inputMode={current.type === "email" ? "email" : undefined}
                autoComplete={current.autoComplete}
                placeholder={current.placeholder}
                value={values[current.id]}
                onChange={(e) => setValue(current.id, e.target.value)}
                onKeyDown={onKeyDown}
                className={fieldClass}
              />
            )}

            <p className="t-error-msg mt-2 text-sm text-accent" role="alert">
              {error ?? ""}
            </p>
          </div>

          {/* Étape e-mail : inviter une autre personne (sous le champ). */}
          {current.id === "email" && (
            <div className="mt-3">
              {!guestOpen ? (
                <button
                  type="button"
                  onClick={() => onGuestOpenChange(true)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/Annexes/person.crop.circle.badge.plus.svg"
                    alt=""
                    aria-hidden
                    className="h-5 w-auto"
                  />
                  Inviter une autre personne
                </button>
              ) : (
                <div>
                  <label className="mb-1 block text-sm text-muted">E-mail de l'invité</label>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    placeholder="collegue@entreprise.fr"
                    value={values.guestEmail}
                    onChange={(e) => setValue("guestEmail", e.target.value)}
                    onKeyDown={onKeyDown}
                    className="w-full rounded-sm border border-line bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="text-sm font-medium text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Retour
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#d1504a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Réservation…" : isLast ? "Réserver mon appel" : "Suivant"}
          {!submitting && <span aria-hidden>→</span>}
        </button>
      </div>
    </div>
  );
}

/**
 * Textarea qui s'agrandit avec le contenu (retour à la ligne -> plus de hauteur).
 * La hauteur suit `scrollHeight` ; le modal, lui, tween sa taille via
 * ResizeAnimator.
 */
function AutoGrowTextarea({
  ref,
  fieldRef,
  value,
  placeholder,
  className,
  onChange,
  onKeyDown,
}: {
  ref: React.RefObject<HTMLTextAreaElement | null>;
  fieldRef: React.RefObject<HTMLElement | null>;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    const el = localRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  // Ajuste la hauteur au montage et à chaque changement de valeur (restauration).
  useLayoutEffect(resize, [value]);

  return (
    <textarea
      ref={(el) => {
        localRef.current = el;
        ref.current = el;
        fieldRef.current = el;
      }}
      rows={1}
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        resize();
      }}
      onKeyDown={onKeyDown}
      className={`${className} block resize-none overflow-hidden`}
    />
  );
}
