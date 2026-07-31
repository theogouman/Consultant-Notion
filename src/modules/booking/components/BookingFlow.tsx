"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SlotPicker from "./SlotPicker";
import QualificationForm, {
  QUALIFICATION_STEPS_COUNT,
  type FormValues,
} from "./QualificationForm";
import ResizeAnimator from "./ResizeAnimator";
import { formatSlotLong, timezoneParts } from "../lib/timezone";
import {
  getAvailabilityAction,
  createBookingAction,
  type BookingActionResult,
} from "@/app/rdv/actions";
import type { AvailableDay, Situation, Slot } from "../types";

type Phase = "picking" | "form" | "done";

const EMPTY_VALUES: FormValues = {
  name: "",
  email: "",
  activity: "",
  situation: "",
  motivation: "",
  guestEmail: "",
};

/**
 * Orchestrateur du booker public : créneau d'abord, formulaire ensuite.
 * L'état du formulaire vit ici -> revenir au calendrier ne perd pas les réponses.
 * La barre de progression est collée au haut du modal pendant le formulaire ;
 * l'en-tête (titre/sous-titre) ne s'affiche que sur l'écran de choix du créneau.
 */
export default function BookingFlow() {
  const [leadTimezone, setLeadTimezone] = useState<string>("Europe/Paris");
  const [days, setDays] = useState<AvailableDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("picking");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [result, setResult] = useState<(BookingActionResult & { ok: true }) | null>(null);

  // État du formulaire, conservé entre les phases.
  const [formValues, setFormValues] = useState<FormValues>({ ...EMPTY_VALUES });
  const [formStep, setFormStep] = useState(0);
  const [guestOpen, setGuestOpen] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const refreshAvailability = useCallback(async (tz: string) => {
    setLoading(true);
    try {
      const data = await getAvailabilityAction(tz);
      setDays(data.days);
      setLeadTimezone(data.leadTimezone);
    } catch {
      setBanner("Impossible de charger les créneaux pour le moment. Réessayez.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const detected =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris"
        : "Europe/Paris";
    refreshAvailability(detected);
  }, [refreshAvailability]);

  function handleSelect(s: Slot) {
    setSlot(s);
    setServerError(null);
    setPhase("form");
  }

  function handleTimezoneChange(tz: string) {
    setLeadTimezone(tz);
    refreshAvailability(tz);
  }

  async function handleSubmit() {
    if (!slot) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await createBookingAction({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        activity: formValues.activity.trim(),
        situation: formValues.situation as Situation,
        motivation: formValues.motivation.trim(),
        guestEmail: guestOpen && formValues.guestEmail.trim() ? formValues.guestEmail.trim() : undefined,
        company: honeypotRef.current?.value || "",
        startUtc: slot.start_utc,
        leadTimezone,
      });
      if (res.ok) {
        setResult(res);
        setPhase("done");
      } else if (res.code === "slot_taken" || res.code === "unavailable") {
        setBanner(res.error);
        setPhase("picking");
        setSlot(null);
        await refreshAvailability(leadTimezone);
      } else {
        setServerError(res.error);
      }
    } catch {
      setServerError("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  const progress = ((formStep + 1) / QUALIFICATION_STEPS_COUNT) * 100;

  return (
    <>
      {/* Barre de progression collée au haut du modal (phase formulaire). */}
      {phase === "form" && (
        <div className="absolute inset-x-0 top-0 z-10 h-1 overflow-hidden rounded-t-md bg-raised">
          <div
            className="h-full bg-accent transition-[width] duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <ResizeAnimator>
        <div className="p-6 sm:p-8">
          {banner && (
            <div className="mb-4 rounded-sm border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
              {banner}
            </div>
          )}

          {phase === "picking" && (
            <>
              <header className="mb-6">
                <h1 className="nc-title text-2xl sm:text-3xl">
                  Quel serait le meilleur moment pour toi ?
                </h1>
                <p className="mt-2 text-[0.95rem] text-muted">
                  Réserve le créneau qui te convient pour qu'on réalise un audit
                  sur ton organisation actuelle
                </p>
              </header>
              <SlotPicker
                days={days}
                leadTimezone={leadTimezone}
                loading={loading}
                onSelect={handleSelect}
                onTimezoneChange={handleTimezoneChange}
              />
            </>
          )}

          {phase === "form" && slot && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPhase("picking");
                  setBanner(null);
                  setServerError(null);
                }}
                className="mb-4 inline-flex items-center gap-2 rounded-sm bg-raised px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-line"
              >
                <span aria-hidden>⏎</span> Modifier mon créneau
              </button>

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

              <QualificationForm
                values={formValues}
                onValuesChange={(patch) => setFormValues((v) => ({ ...v, ...patch }))}
                step={formStep}
                onStepChange={setFormStep}
                guestOpen={guestOpen}
                onGuestOpenChange={setGuestOpen}
                submitting={submitting}
                serverError={serverError}
                onSubmit={handleSubmit}
              />
            </>
          )}

          {phase === "done" && result && (
            <SuccessView result={result} slot={slot} leadTimezone={leadTimezone} />
          )}
        </div>
      </ResizeAnimator>
    </>
  );
}

function SuccessView({
  result,
  slot,
  leadTimezone,
}: {
  result: BookingActionResult & { ok: true };
  slot: Slot | null;
  leadTimezone: string;
}) {
  const when = slot ? capitalize(formatSlotLong(slot.start_utc, leadTimezone)) : "";
  const parts = timezoneParts(leadTimezone);
  const tz = `${parts.city} ${parts.flag}`;

  if (result.status === "pending_manual") {
    return (
      <div className="py-4 text-center">
        <h2 className="nc-title mb-3 text-2xl">Presque !</h2>
        <p className="mx-auto mb-2 max-w-md text-[0.95rem] leading-relaxed text-ink">
          Nous n'avons pas pu créer l'invitation à l'instant. Pas d'inquiétude :
          je reviens vers vous au plus vite pour confirmer votre créneau.
        </p>
        {when && <p className="text-sm text-muted">Créneau souhaité : {when} · {tz}</p>}
      </div>
    );
  }

  return (
    <div className="py-4 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#e0625a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="nc-title mb-3 text-2xl">C'est réservé.</h2>
      {when && (
        <p className="mb-2 text-[0.95rem] text-ink">
          <strong>{when}</strong> · {tz}
        </p>
      )}
      <p className="mx-auto mb-5 max-w-md text-sm text-muted">
        Un e-mail de confirmation vient de vous être envoyé, avec le lien de
        visio et de quoi ajouter le rendez-vous à votre agenda.
      </p>
      {result.meetUrl && (
        <a
          href={result.meetUrl}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all hover:bg-[#d1504a]"
        >
          Rejoindre le Meet
        </a>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
