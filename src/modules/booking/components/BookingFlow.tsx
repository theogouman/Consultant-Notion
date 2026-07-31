"use client";

import { useCallback, useEffect, useState } from "react";
import SlotPicker from "./SlotPicker";
import QualificationForm from "./QualificationForm";
import { formatSlotLong, timezoneAbbrev } from "../lib/timezone";
import {
  getAvailabilityAction,
  createBookingAction,
  type BookingActionResult,
} from "@/app/rdv/actions";
import type { AvailableDay, QualificationInput, Slot } from "../types";

type Phase = "picking" | "form" | "done";

/**
 * Orchestrateur du booker public : créneau d'abord, formulaire ensuite.
 * Détecte le fuseau du lead via le navigateur, charge les disponibilités,
 * puis crée la réservation (revalidation + Google + Resend côté serveur).
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
  const [result, setResult] = useState<BookingActionResult & { ok: true } | null>(null);

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

  async function handleSubmit(input: QualificationInput) {
    if (!slot) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await createBookingAction({
        ...input,
        startUtc: slot.start_utc,
        leadTimezone,
      });
      if (res.ok) {
        setResult(res);
        setPhase("done");
      } else if (res.code === "slot_taken" || res.code === "unavailable") {
        // Le créneau a été pris entre-temps : retour à la liste, rafraîchie.
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

  if (phase === "done" && result) {
    return <SuccessView result={result} slot={slot} leadTimezone={leadTimezone} />;
  }

  return (
    <div>
      {banner && (
        <div className="mb-4 rounded-sm border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          {banner}
        </div>
      )}

      {phase === "picking" && (
        <>
          <p className="mb-5 text-sm text-muted">
            Choisissez un créneau. Les horaires s'affichent dans votre fuseau.
          </p>
          <SlotPicker
            days={days}
            leadTimezone={leadTimezone}
            loading={loading}
            onSelect={handleSelect}
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
            }}
            className="mb-4 inline-flex items-center gap-2 rounded-sm bg-raised px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-line"
          >
            <span aria-hidden>←</span>
            {capitalize(formatSlotLong(slot.start_utc, leadTimezone))} (
            {timezoneAbbrev(slot.start_utc, leadTimezone)})
          </button>
          <QualificationForm
            submitting={submitting}
            serverError={serverError}
            onSubmit={handleSubmit}
            onBackToSlots={() => {
              setPhase("picking");
              setServerError(null);
            }}
          />
        </>
      )}
    </div>
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
  const tz = slot ? timezoneAbbrev(slot.start_utc, leadTimezone) : "";

  if (result.status === "pending_manual") {
    return (
      <div className="py-4 text-center">
        <h2 className="nc-title mb-3 text-2xl">Presque !</h2>
        <p className="mx-auto mb-2 max-w-md text-[0.95rem] leading-relaxed text-ink">
          Nous n'avons pas pu créer l'invitation à l'instant. Pas d'inquiétude :
          je reviens vers vous au plus vite pour confirmer votre créneau.
        </p>
        {when && <p className="text-sm text-muted">Créneau souhaité : {when} ({tz})</p>}
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
          <strong>{when}</strong> ({tz})
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
