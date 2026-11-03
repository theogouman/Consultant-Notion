"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SlotPicker from "./SlotPicker";
import QualificationForm, {
  QUALIFICATION_STEPS_COUNT,
  type FormValues,
} from "./QualificationForm";
import ResizeAnimator from "./ResizeAnimator";
import {
  formatSlotLong,
  formatSlotBanner,
  timezoneParts,
  utcToZonedDate,
} from "../lib/timezone";
import { captureAcquisitionFromUrl, getAcquisition } from "../lib/acquisition";
import { getFunnelSid } from "../lib/funnel-client";
import {
  getAvailabilityAction,
  createBookingAction,
  createPrefilledBookingAction,
  trackFunnelAction,
  type BookingActionResult,
} from "@/app/rdv/actions";
import type { AvailableDay, FunnelPatch, Situation, Slot } from "../types";

type Phase = "picking" | "form" | "done";

/** Infos pré-remplies pour un lien personnalisé (/r/<code>). */
export interface Prefill {
  linkCode: string;
  firstName: string;
  lastName: string;
  email: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** En-tête par défaut de l'écran de choix du créneau (utilisé par le modal). */
const DEFAULT_HEADING = {
  title: "Quel serait le meilleur moment pour toi ?",
  subtitle:
    "Réserve le créneau qui te convient pour qu'on réalise un audit sur ton organisation actuelle",
};

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
export default function BookingFlow({
  heading = DEFAULT_HEADING,
  onInteract,
  prefill,
}: {
  /** En-tête de l'écran de choix du créneau (copywriting propre à l'appelant). */
  heading?: { title: string; subtitle: string };
  /** Appelé quand l'utilisateur avance (choix de date / de créneau) — permet
   *  à un parent (booker embarqué) de recentrer la vue. */
  onInteract?: () => void;
  /** Lien personnalisé : nom+e-mail pré-remplis, qualification masquée. */
  prefill?: Prefill;
} = {}) {
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

  // Lien personnalisé : infos pré-remplies, éditables dans l'écran de résumé.
  const [prefillName, setPrefillName] = useState(
    prefill ? `${prefill.firstName} ${prefill.lastName}`.trim() : "",
  );
  const [prefillEmail, setPrefillEmail] = useState(prefill?.email ?? "");
  const [prefillGuests, setPrefillGuests] = useState<string[]>([]);

  // Suivi best-effort du tunnel (abandons). Jamais bloquant.
  const sidRef = useRef<string | null>(null);
  const track = useCallback((patch: FunnelPatch) => {
    try {
      const sid = (sidRef.current ??= getFunnelSid());
      void trackFunnelAction(sid, patch);
    } catch {
      /* best-effort : on n'interrompt jamais le parcours */
    }
  }, []);

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
    // Filet de sécurité : le booker embarqué peut vivre hors du provider, qui
    // capture normalement `?source=` / `?post=` au chargement de la page.
    captureAcquisitionFromUrl();

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
    onInteract?.();

    const acq = getAcquisition();
    track({
      step: "slot_selected",
      startUtc: s.start_utc,
      leadTimezone,
      acquisitionSource: prefill ? null : acq.source,
      acquisitionPost: prefill ? null : acq.post,
      linkCode: prefill?.linkCode ?? null,
      // Lien personnalisé : on connaît déjà le lead (utile si abandon).
      ...(prefill
        ? {
            leadName: `${prefill.firstName} ${prefill.lastName}`.trim(),
            leadEmail: prefill.email,
          }
        : {}),
    });
  }

  // Suivi best-effort du formulaire public (debounce) : dès qu'un e-mail valide
  // est saisi, on capte les infos pour pouvoir relancer un abandon.
  useEffect(() => {
    if (prefill || phase !== "form") return;
    const email = formValues.email.trim();
    if (!EMAIL_RE.test(email)) return;
    const t = window.setTimeout(() => {
      track({
        step: "form_started",
        leadName: formValues.name.trim() || null,
        leadEmail: email,
        activity: formValues.activity.trim() || null,
        situation: formValues.situation || null,
        motivation: formValues.motivation.trim() || null,
      });
    }, 1200);
    return () => window.clearTimeout(t);
  }, [prefill, phase, formValues, track]);

  function handleTimezoneChange(tz: string) {
    setLeadTimezone(tz);
    refreshAvailability(tz);
  }

  async function handleSubmit() {
    if (!slot) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const sid = (sidRef.current ??= getFunnelSid());
      const acquisition = getAcquisition();
      const res = prefill
        ? await createPrefilledBookingAction(
            prefill.linkCode,
            slot.start_utc,
            leadTimezone,
            sid,
            {
              name: prefillName.trim(),
              email: prefillEmail.trim(),
              guestEmails: prefillGuests.map((g) => g.trim()).filter(Boolean),
            },
          )
        : await createBookingAction({
            name: formValues.name.trim(),
            email: formValues.email.trim(),
            activity: formValues.activity.trim(),
            situation: formValues.situation as Situation,
            motivation: formValues.motivation.trim(),
            guestEmails: formValues.guestEmails.map((g) => g.trim()).filter(Boolean),
            company: honeypotRef.current?.value || "",
            startUtc: slot.start_utc,
            leadTimezone,
            acquisitionSource: acquisition.source,
            acquisitionPost: acquisition.post,
            sid,
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
      {phase === "form" && !prefill && (
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
                  {heading.title}
                </h1>
                <p className="mt-2 text-[0.95rem] text-muted">
                  {heading.subtitle}
                </p>
              </header>
              <SlotPicker
                days={days}
                leadTimezone={leadTimezone}
                loading={loading}
                onSelect={handleSelect}
                onTimezoneChange={handleTimezoneChange}
                onSelectDate={onInteract}
                initialDate={
                  prefill && slot
                    ? utcToZonedDate(slot.start_utc, leadTimezone)
                    : undefined
                }
              />
            </>
          )}

          {phase === "form" && slot && prefill && (
            <PrefilledSummary
              name={prefillName}
              onNameChange={setPrefillName}
              email={prefillEmail}
              onEmailChange={setPrefillEmail}
              guests={prefillGuests}
              onGuestsChange={setPrefillGuests}
              dateLabel={`${formatSlotBanner(slot.start_utc, leadTimezone)} ${timezoneParts(leadTimezone).flag}`}
              onEditDate={() => {
                setPhase("picking");
                setBanner(null);
                setServerError(null);
              }}
              submitting={submitting}
              serverError={serverError}
              onSubmit={handleSubmit}
            />
          )}

          {phase === "form" && slot && !prefill && (
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

const MAX_GUESTS = 5;

/**
 * Écran de résumé d'un lien personnalisé. Nom + e-mail pré-remplis mais
 * ÉDITABLES, ajout d'invités possible. La dernière ligne = la date : y cliquer
 * ramène à la vue « jour » (créneaux + ligne des dates), pas au calendrier.
 */
function PrefilledSummary({
  name,
  onNameChange,
  email,
  onEmailChange,
  guests,
  onGuestsChange,
  dateLabel,
  onEditDate,
  submitting,
  serverError,
  onSubmit,
}: {
  name: string;
  onNameChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  guests: string[];
  onGuestsChange: (v: string[]) => void;
  dateLabel: string;
  onEditDate: () => void;
  submitting: boolean;
  serverError: string | null;
  onSubmit: () => void;
}) {
  const labelCls = "mb-1.5 block text-sm font-medium text-ink";
  const inputCls =
    "w-full rounded-sm border border-line bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20";

  function addGuest() {
    if (guests.length >= MAX_GUESTS) return;
    onGuestsChange([...guests, ""]);
  }
  function updateGuest(i: number, value: string) {
    const next = guests.slice();
    next[i] = value;
    onGuestsChange(next);
  }
  function removeGuest(i: number) {
    onGuestsChange(guests.filter((_, idx) => idx !== i));
  }

  return (
    <div className="pr-12">
      <h2 className="nc-title text-xl sm:text-2xl">
        Les informations sont correctes ?
      </h2>

      <div className="mt-6 space-y-5">
        <div>
          <label className={labelCls} htmlFor="pf-name">
            Nom complet
          </label>
          <input
            id="pf-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="pf-email">
            E-mail
          </label>
          <input
            id="pf-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={inputCls}
          />

          {/* Invités (jusqu'à 5). */}
          <div className="mt-3 space-y-2">
            {guests.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder={`E-mail de l'invité ${i + 1}`}
                  value={g}
                  onChange={(e) => updateGuest(i, e.target.value)}
                  className="min-w-0 flex-1 rounded-sm border border-line bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => removeGuest(i)}
                  aria-label="Retirer l'invité"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-sm text-muted transition-colors hover:bg-raised hover:text-accent"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
            {guests.length < MAX_GUESTS && (
              <button
                type="button"
                onClick={addGuest}
                className="inline-flex items-center gap-1.5 rounded-sm bg-raised px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-line hover:text-ink"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/Annexes/person.crop.circle.badge.plus.svg"
                  alt=""
                  aria-hidden
                  className="h-4 w-auto"
                />
                Ajouter un invité
              </button>
            )}
          </div>
        </div>

        {/* Dernière ligne : la date. Cliquer => retour à la vue « jour ». */}
        <div>
          <span className={labelCls}>Date</span>
          <button
            type="button"
            onClick={onEditDate}
            disabled={submitting}
            className="group flex w-full items-center justify-between gap-3 rounded-sm border border-line bg-raised px-4 py-3 text-left transition-colors hover:border-accent hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="min-w-0 text-[1rem] text-ink">{dateLabel}</span>
            <span className="flex flex-none items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-accent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/Annexes/clock.arrow.trianglehead.counterclockwise.rotate.90.svg"
                alt=""
                aria-hidden
                className="h-4 w-auto"
              />
              Modifier
            </span>
          </button>
        </div>
      </div>

      {serverError && (
        <p className="mt-4 text-sm text-accent" role="alert">
          {serverError}
        </p>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl nc-btn-3d px-6 py-3 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Réservation…" : "Réserver mon appel"}
        </button>
      </div>
    </div>
  );
}
