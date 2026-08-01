"use client";

import { useCallback, useEffect, useState } from "react";
import SlotPicker from "./SlotPicker";
import CancelFlow from "./CancelFlow";
import { formatSlotBanner, timezoneParts } from "../lib/timezone";
import {
  getManageAvailabilityAction,
  rescheduleAction,
  cancelAction,
} from "@/app/rdv/manage/[token]/actions";
import type { AvailableDay, BookingStatus, CancelFeedback, Slot } from "../types";

type View =
  | "overview"
  | "cancel-flow"
  | "reschedule"
  | "cancelled"
  | "rescheduled";

export interface ManageBookingProps {
  token: string;
  startUtc: string;
  leadTimezone: string;
  leadName: string;
  status: BookingStatus;
  meetUrl: string | null;
}

/**
 * Gestion publique d'une réservation via lien tokenisé (§6).
 * Reprogrammer (nouveau créneau) ou annuler — ne concerne que cette résa.
 */
export default function ManageBooking(props: ManageBookingProps) {
  const alreadyCancelled = props.status === "cancelled";
  const [view, setView] = useState<View>(alreadyCancelled ? "cancelled" : "overview");
  const [currentStart, setCurrentStart] = useState(props.startUtc);
  const [tz, setTz] = useState(props.leadTimezone);
  const [days, setDays] = useState<AvailableDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Contexte de reprogrammation : « cancel » = arrivé depuis le flow d'annulation
  // (titre différent + porte de sortie « Non, je souhaite annuler »).
  const [rescheduleContext, setRescheduleContext] = useState<"normal" | "cancel">(
    "normal",
  );
  // Retour collecté par le questionnaire d'annulation (envoyé à Théo + base).
  const [cancelFeedback, setCancelFeedback] = useState<CancelFeedback | null>(null);

  // Encadré gris arrondi : « Jeudi 13 août, à 17:00 <drapeau> ».
  // Même taille / même poids que la phrase qui l'entoure : la puce n'est
  // distinguée que par son fond gris (cf. docs/ui-typography.md §2).
  const dateChip = (iso: string) => (
    <span className="inline-block rounded-sm bg-raised px-2.5 py-1 text-[0.95rem] text-ink">
      {formatSlotBanner(iso, tz)} {timezoneParts(tz).flag}
    </span>
  );

  const loadAvailability = useCallback(
    async (zone: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getManageAvailabilityAction(props.token, zone);
        setDays(data.days);
      } catch {
        setError("Impossible de charger les créneaux. Réessayez.");
      } finally {
        setLoading(false);
      }
    },
    [props.token],
  );

  useEffect(() => {
    if (view === "reschedule") loadAvailability(tz);
  }, [view, tz, loadAvailability]);

  async function onPickNewSlot(slot: Slot) {
    setBusy(true);
    setError(null);
    const res = await rescheduleAction(props.token, slot.start_utc);
    setBusy(false);
    if (res.ok && res.kind === "rescheduled") {
      setCurrentStart(res.startUtc);
      setView("rescheduled");
    } else if (!res.ok && (res.code === "slot_taken" || res.code === "unavailable")) {
      setError(res.error);
      loadAvailability(tz);
    } else if (!res.ok) {
      setError(res.error);
    }
  }

  // Annulation effective : appelée par le CTA terminal du questionnaire (ou par
  // « Non, je souhaite annuler » depuis le calendrier). Renvoie directement vers
  // la page définitive de confirmation — aucun écran intermédiaire.
  async function performCancel(fb: CancelFeedback) {
    setBusy(true);
    setError(null);
    setCancelFeedback(fb);
    const res = await cancelAction(props.token, fb);
    setBusy(false);
    if (res.ok) setView("cancelled");
    else setError(res.error);
  }

  // Depuis le questionnaire : « plus disponible » -> calendrier (contexte cancel).
  function onRescheduleFromCancel(fb: CancelFeedback) {
    setCancelFeedback(fb);
    setRescheduleContext("cancel");
    setError(null);
    setLoading(true);
    setView("reschedule");
  }

  if (view === "cancelled") {
    return (
      <Centered title="Rendez-vous annulé.">
        <p className="nc-balance text-sm text-muted">
          Votre appel a bien été annulé. Vous pouvez reprendre rendez-vous quand
          vous le souhaitez.
        </p>
        <a
          href="/rdv"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all hover:bg-[#d1504a]"
        >
          Réserver un nouveau créneau
        </a>
      </Centered>
    );
  }

  if (view === "rescheduled") {
    return (
      <Centered title="C'est ok ! L'invitation a été mise à jour">
        <p className="mb-3 text-[0.95rem] text-ink">
          Notre appel aura lieu le {dateChip(currentStart)}
        </p>
        <p className="nc-balance text-sm text-muted">
          Merci d'avoir pris le temps de replanifier cet appel ! Une confirmation
          a été envoyé par mail.
        </p>
      </Centered>
    );
  }

  if (view === "cancel-flow") {
    return (
      <CancelFlow
        startUtc={currentStart}
        leadTimezone={tz}
        busy={busy}
        error={error}
        onExit={() => setView("overview")}
        onReschedule={onRescheduleFromCancel}
        onCancel={performCancel}
      />
    );
  }

  if (view === "reschedule") {
    const cancelCtx = rescheduleContext === "cancel";
    return (
      <div>
        <button
          type="button"
          onClick={() => setView(cancelCtx ? "cancel-flow" : "overview")}
          className="mb-4 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          ← Retour
        </button>
        <h2 className="nc-title mb-1 text-lg sm:text-xl">
          {cancelCtx
            ? "On a d'autres créneaux qui pourraient te convenir, souhaites-tu replanifier ?"
            : "Choisissez un nouveau créneau"}
        </h2>
        <p className="mb-5 text-sm text-muted">Horaires dans votre fuseau.</p>
        {error && (
          <div className="mb-4 rounded-sm border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
            {error}
          </div>
        )}
        <div className={busy ? "pointer-events-none opacity-60" : ""}>
          <SlotPicker
            days={days}
            leadTimezone={tz}
            loading={loading}
            onSelect={onPickNewSlot}
            onTimezoneChange={setTz}
          />
        </div>

        {cancelCtx && (
          <div className="mt-5 border-t border-line pt-4 text-center">
            {/* Annulation directe (pas d'écran intermédiaire). */}
            <button
              type="button"
              onClick={() => performCancel(cancelFeedback ?? { reason: "not_available" })}
              disabled={busy}
              className="text-sm font-medium text-muted transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                "Annulation…"
              ) : (
                <>
                  Non, je souhaite annuler <span aria-hidden>→</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // overview
  return (
    <div>
      <h2 className="nc-title mb-2 text-xl sm:text-2xl">Que souhaites-tu faire ?</h2>
      <p className="mb-6 text-[0.95rem] text-ink">
        Notre appel est planifié pour le {dateChip(currentStart)}
      </p>

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <button
          type="button"
          onClick={() => {
            setRescheduleContext("normal");
            setLoading(true); // évite le flash « aucun créneau » avant le skeleton
            setView("reschedule");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d1504a]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* brightness-0 invert : icône rendue en blanc sur le fond corail. */}
          <img
            src="/images/Annexes/clock.arrow.trianglehead.counterclockwise.rotate.90.svg"
            alt=""
            aria-hidden
            className="h-4 w-auto brightness-0 invert"
          />
          Je veux replanifier
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setView("cancel-flow");
          }}
          className="rounded-xl border border-line bg-card px-5 py-3 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Je veux annuler mon rendez-vous
        </button>
      </div>
    </div>
  );
}

function Centered({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 text-center">
      <h2 className="nc-title nc-balance mb-3 text-2xl">{title}</h2>
      {children}
    </div>
  );
}

