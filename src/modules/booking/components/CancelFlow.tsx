"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import BubbleOption from "./BubbleOption";
import { formatSlotBanner, timezoneParts } from "../lib/timezone";
import { TOOL_OPTIONS, DELAY_OPTIONS } from "../lib/cancel";
import type { BetterTool, CallbackDelay, CancelFeedback } from "../types";

/**
 * Questionnaire d'annulation (rétention), même design que la prise de
 * rendez-vous. Une question par écran, avec branches :
 *   - « plus disponible »   -> onReschedule (le calendrier est géré par le parent)
 *   - « autre consultant »  -> onCancel (annulation directe, sans sous-question)
 *   - « meilleur outil »    -> quel outil ? -> pourquoi ? (CTA « Annuler »)
 *   - « plus le temps »     -> rappel ? -> (délai ?) (CTA « Annuler »)
 *
 * La DERNIÈRE sous-question de chaque branche porte le CTA
 * « Annuler mon rendez-vous » qui déclenche l'annulation puis renvoie vers la
 * page définitive de confirmation — aucun écran intermédiaire.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SHIFT = 34;

type StepKey = "reason" | "tool" | "tool_reason" | "callback" | "callback_delay";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function CancelFlow({
  startUtc,
  leadTimezone,
  busy,
  error,
  onExit,
  onReschedule,
  onCancel,
}: {
  startUtc: string;
  leadTimezone: string;
  busy: boolean;
  error: string | null;
  onExit: () => void; // « ← Retour » depuis la 1re question
  onReschedule: (fb: CancelFeedback) => void; // branche « plus disponible »
  onCancel: (fb: CancelFeedback) => void; // CTA « Annuler mon rendez-vous »
}) {
  const [step, setStep] = useState<StepKey>("reason");
  const [history, setHistory] = useState<StepKey[]>([]);
  const [tool, setTool] = useState<BetterTool | null>(null);
  const [toolOther, setToolOther] = useState("");
  const [toolReason, setToolReason] = useState("");
  const [callback, setCallback] = useState<"oui" | "non" | null>(null);
  const [delay, setDelay] = useState<CallbackDelay | null>(null);

  const dirRef = useRef<1 | -1>(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const dateLabel = `${formatSlotBanner(startUtc, leadTimezone)} ${timezoneParts(leadTimezone).flag}`;

  // Animation d'entrée de chaque étape (translateY + fondu).
  useEffect(() => {
    const el = stageRef.current;
    if (!el || prefersReducedMotion()) return;
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(
      [
        { transform: `translateY(${SHIFT * dirRef.current}px)`, opacity: 0 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 300, easing: EASE, fill: "both" },
    );
  }, [step]);

  // Focus le champ « Autre » à sa révélation.
  useEffect(() => {
    if (tool !== "other") return;
    const t = window.setTimeout(() => otherRef.current?.focus(), 260);
    return () => window.clearTimeout(t);
  }, [tool]);

  function animateOut(next: () => void, dir: 1 | -1) {
    const el = stageRef.current;
    if (!el || prefersReducedMotion()) {
      next();
      return;
    }
    el.getAnimations().forEach((a) => a.cancel());
    const anim = el.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: `translateY(${-SHIFT * dir}px)`, opacity: 0 },
      ],
      { duration: 240, easing: EASE, fill: "forwards" },
    );
    anim.onfinish = () => next();
  }

  function goTo(next: StepKey) {
    dirRef.current = 1;
    setHistory((h) => [...h, step]);
    animateOut(() => setStep(next), 1);
  }

  function back() {
    if (busy) return;
    if (history.length === 0) {
      onExit();
      return;
    }
    dirRef.current = -1;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    animateOut(() => setStep(prev), -1);
  }

  // --- Actions --------------------------------------------------------------
  function pickReason(reason: CancelFeedback["reason"]) {
    if (reason === "not_available") return onReschedule({ reason });
    if (reason === "other_consultant") return onCancel({ reason }); // pas de sous-question
    if (reason === "better_tool") return goTo("tool");
    return goTo("callback"); // no_time
  }

  function submitTool() {
    if (!tool) return;
    if (tool === "other" && !toolOther.trim()) {
      otherRef.current?.focus();
      return;
    }
    goTo("tool_reason");
  }

  function cancelBetterTool() {
    onCancel({
      reason: "better_tool",
      betterTool: tool ?? undefined,
      betterToolOther: tool === "other" ? toolOther.trim() : undefined,
      betterToolReason: toolReason.trim() || undefined,
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={back}
        disabled={busy}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden>←</span> Retour
      </button>

      <div ref={stageRef}>
        {step === "reason" && (
          <>
            <h2 className="nc-title mb-4 text-xl sm:text-2xl">
              Pourquoi souhaites-tu annuler ce rendez-vous ?
            </h2>
            <div className="grid gap-3">
              <BubbleOption selected={false} disabled={busy} onClick={() => pickReason("not_available")}>
                Je ne suis plus disponible le {dateLabel}
              </BubbleOption>
              <BubbleOption selected={false} disabled={busy} onClick={() => pickReason("other_consultant")}>
                J&apos;ai commencé à travailler avec un autre consultant
              </BubbleOption>
              <BubbleOption selected={false} disabled={busy} onClick={() => pickReason("better_tool")}>
                J&apos;ai trouvé un meilleur outil que Notion
              </BubbleOption>
              <BubbleOption selected={false} disabled={busy} onClick={() => pickReason("no_time")}>
                Je n&apos;ai plus le temps
              </BubbleOption>
            </div>
            {error && <ErrorLine error={error} />}
          </>
        )}

        {step === "tool" && (
          <>
            <h2 className="nc-title mb-4 text-xl sm:text-2xl">
              Quel outil a retenu ton attention ?
            </h2>
            <div className="grid gap-3">
              {TOOL_OPTIONS.map((o) => (
                <BubbleOption key={o.value} selected={tool === o.value} onClick={() => setTool(o.value)}>
                  {o.label}
                </BubbleOption>
              ))}
            </div>

            {/* Champ « Autre » : révélé/animé quand l'option Autre est choisie. */}
            <div
              className="grid transition-[grid-template-rows] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ gridTemplateRows: tool === "other" ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <input
                  ref={otherRef}
                  type="text"
                  value={toolOther}
                  onChange={(e) => setToolOther(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitTool();
                    }
                  }}
                  placeholder="Précise l'outil"
                  className="mt-3 w-full rounded-sm border border-line bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <Footer>
              <PrimaryButton
                onClick={submitTool}
                disabled={!tool || (tool === "other" && !toolOther.trim())}
              >
                Suivant
                <span aria-hidden>→</span>
              </PrimaryButton>
            </Footer>
          </>
        )}

        {step === "tool_reason" && (
          <>
            <h2 className="nc-title mb-4 text-xl sm:text-2xl">
              Pour quelles raisons cette solution était mieux que Notion pour toi ?
            </h2>
            <AutoGrowTextarea
              value={toolReason}
              onChange={setToolReason}
              onSubmit={cancelBetterTool}
              placeholder="Ce qui t'a convaincu, ce qui manquait à Notion…"
            />
            <Footer error={error}>
              <CancelCTA onClick={cancelBetterTool} busy={busy} />
            </Footer>
          </>
        )}

        {step === "callback" && (
          <>
            <h2 className="nc-title mb-4 text-xl sm:text-2xl">
              Les priorités évoluent avec le temps, c&apos;est normal. Souhaites-tu
              être rappelé plus tard ?
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <BubbleOption selected={callback === "oui"} onClick={() => setCallback("oui")}>
                Oui
              </BubbleOption>
              <BubbleOption selected={callback === "non"} onClick={() => setCallback("non")}>
                Non
              </BubbleOption>
            </div>
            <Footer error={error}>
              {callback === "oui" ? (
                <PrimaryButton onClick={() => goTo("callback_delay")}>
                  Suivant
                  <span aria-hidden>→</span>
                </PrimaryButton>
              ) : (
                <CancelCTA
                  onClick={() => onCancel({ reason: "no_time", wantsCallback: false })}
                  disabled={callback !== "non"}
                  busy={busy}
                />
              )}
            </Footer>
          </>
        )}

        {step === "callback_delay" && (
          <>
            <h2 className="nc-title mb-4 text-xl sm:text-2xl">
              Dans combien de temps souhaites-tu être re-contacté ?
            </h2>
            <div className="grid gap-3">
              {DELAY_OPTIONS.map((o) => (
                <BubbleOption key={o.value} selected={delay === o.value} onClick={() => setDelay(o.value)}>
                  {o.label}
                </BubbleOption>
              ))}
            </div>
            <Footer error={error}>
              <CancelCTA
                onClick={() =>
                  onCancel({ reason: "no_time", wantsCallback: true, callbackDelay: delay! })
                }
                disabled={!delay}
                busy={busy}
              />
            </Footer>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Petits composants de présentation                                          */
/* -------------------------------------------------------------------------- */

function Footer({ error, children }: { error?: string | null; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t border-line pt-4">
      {error && <p className="mb-3 text-sm text-accent" role="alert">{error}</p>}
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

function ErrorLine({ error }: { error: string }) {
  return (
    <p className="mt-4 text-sm text-accent" role="alert">
      {error}
    </p>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#d1504a] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {children}
    </button>
  );
}

/** CTA terminal : déclenche l'annulation (puis page de confirmation définitive). */
function CancelCTA({
  onClick,
  disabled,
  busy,
}: {
  onClick: () => void;
  disabled?: boolean;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#d1504a] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? "Annulation…" : "Annuler mon rendez-vous"}
    </button>
  );
}

/** Textarea multi-lignes qui grandit avec le contenu (Ctrl/⌘+Entrée valide). */
function AutoGrowTextarea({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(resize, [value]);

  return (
    <textarea
      ref={ref}
      rows={3}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e.target.value);
        resize();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSubmit();
        }
      }}
      className="block w-full resize-none overflow-hidden rounded-sm border border-line bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20"
    />
  );
}
