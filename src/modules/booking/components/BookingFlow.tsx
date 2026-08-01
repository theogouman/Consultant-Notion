"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SlotPicker from "./SlotPicker";
import QualificationForm, {
  QUALIFICATION_STEPS_COUNT,
  type FormValues,
} from "./QualificationForm";
import ResizeAnimator from "./ResizeAnimator";
import { formatSlotLong, formatSlotBanner, timezoneParts } from "../lib/timezone";
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
  guestEmails: [],
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
  const [formValues, setFormValues] = useState<FormValues>({
    ...EMPTY_VALUES,
    guestEmails: [],
  });
  const [formStep, setFormStep] = useState(0);
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
        guestEmails: formValues.guestEmails.map((g) => g.trim()).filter(Boolean),
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
      {/* Barre de progression À L'INTÉRIEUR du modal (rognée par les coins
          arrondis du panneau via son overflow-hidden). */}
      {phase === "form" && (
        <div className="h-1 w-full shrink-0 overflow-hidden bg-raised">
          <div
            className="h-full bg-accent transition-[width] duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto sm:flex-initial">
        <ResizeAnimator>
          <div className="p-6 sm:p-8">
          {banner && (
            <div className="mb-4 rounded-sm border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
              {banner}
            </div>
          )}

          {phase === "picking" && (
            <>
              {/* pr-12 : réserve la place de la croix de fermeture. */}
              <header className="mb-6 pr-12">
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
                slotLabel={`${formatSlotBanner(slot.start_utc, leadTimezone)} ${timezoneParts(leadTimezone).flag}`}
                onModifySlot={() => {
                  setPhase("picking");
                  setBanner(null);
                  setServerError(null);
                }}
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
      </div>
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
  const parts = timezoneParts(leadTimezone);
  const whenBanner = slot ? formatSlotBanner(slot.start_utc, leadTimezone) : "";

  // Révélation échelonnée du texte (transitions.dev · texts-reveal).
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (result.status === "pending_manual") {
    const when = slot ? capitalize(formatSlotLong(slot.start_utc, leadTimezone)) : "";
    return (
      <div className="py-4 text-center">
        <h2 className="nc-title mb-3 text-2xl">Presque !</h2>
        <p className="mx-auto mb-2 max-w-md text-[0.95rem] leading-relaxed text-ink">
          Nous n'avons pas pu créer l'invitation à l'instant. Pas d'inquiétude :
          je reviens vers vous au plus vite pour confirmer votre créneau.
        </p>
        {when && (
          <p className="text-sm text-muted">
            Créneau souhaité : {when} · {parts.city} {parts.flag}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`t-stagger py-4 text-center ${shown ? "is-shown" : ""}`}>
      <span className="t-stagger-line t-stagger-line--1">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#e0625a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>

      <span className="t-stagger-line t-stagger-line--2 mb-4 block">
        <span className="nc-title nc-balance-wide block text-xl sm:text-2xl">
          Notre rendez-vous est confirmé pour le
        </span>
        <span className="nc-title mt-2.5 inline-block rounded-md bg-raised px-3.5 py-1 text-xl leading-tight sm:text-2xl">
          {whenBanner}
        </span>
      </span>

      <span className="t-stagger-line t-stagger-line--3 nc-balance-wide block text-[1.0625rem] leading-snug text-muted">
        Un mail de confirmation a été envoyé avec un lien pour reprogrammer si
        l'horaire ne convient plus
      </span>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
