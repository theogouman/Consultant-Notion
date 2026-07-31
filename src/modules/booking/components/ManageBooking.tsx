"use client";

import { useCallback, useEffect, useState } from "react";
import SlotPicker from "./SlotPicker";
import { formatSlotLong, timezoneAbbrev } from "../lib/timezone";
import {
  getManageAvailabilityAction,
  rescheduleAction,
  cancelAction,
} from "@/app/rdv/manage/[token]/actions";
import type { AvailableDay, BookingStatus, Slot } from "../types";

type View = "overview" | "reschedule" | "confirm-cancel" | "cancelled" | "rescheduled";

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

  const when = (iso: string) =>
    capitalize(formatSlotLong(iso, tz)) + ` (${timezoneAbbrev(iso, tz)})`;

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

  async function onConfirmCancel() {
    setBusy(true);
    setError(null);
    const res = await cancelAction(props.token);
    setBusy(false);
    if (res.ok) setView("cancelled");
    else setError(res.error);
  }

  if (view === "cancelled") {
    return (
      <Centered title="Rendez-vous annulé.">
        <p className="text-sm text-muted">
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
      <Centered title="C'est reprogrammé.">
        <p className="mb-1 text-[0.95rem] text-ink">
          <strong>{when(currentStart)}</strong>
        </p>
        <p className="text-sm text-muted">
          Un e-mail de confirmation avec le nouveau créneau vient de vous être
          envoyé.
        </p>
      </Centered>
    );
  }

  if (view === "reschedule") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setView("overview")}
          className="mb-4 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          ← Retour
        </button>
        <h2 className="nc-title mb-1 text-xl">Choisissez un nouveau créneau</h2>
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
      </div>
    );
  }

  if (view === "confirm-cancel") {
    return (
      <Centered title="Annuler ce rendez-vous ?">
        <p className="mb-1 text-[0.95rem] text-ink">{when(currentStart)}</p>
        <p className="mb-5 text-sm text-muted">Cette action est définitive.</p>
        {error && <p className="mb-4 text-sm text-accent">{error}</p>}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setView("overview")}
            disabled={busy}
            className="rounded-xl border border-line bg-card px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-accent disabled:opacity-60"
          >
            Non, garder
          </button>
          <button
            type="button"
            onClick={onConfirmCancel}
            disabled={busy}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d1504a] disabled:opacity-60"
          >
            {busy ? "Annulation…" : "Oui, annuler"}
          </button>
        </div>
      </Centered>
    );
  }

  // overview
  return (
    <div>
      <p className="nc-eyebrow mb-2">Votre rendez-vous</p>
      <h2 className="nc-title mb-1 text-xl sm:text-2xl">
        Bonjour {props.leadName.split(" ")[0]}.
      </h2>
      <p className="mb-5 text-[0.95rem] text-ink">
        Appel de qualification prévu le <strong>{when(currentStart)}</strong>.
      </p>

      {props.meetUrl && (
        <a
          href={props.meetUrl}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          Lien de la visio →
        </a>
      )}

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row">
        <button
          type="button"
          onClick={() => setView("reschedule")}
          className="flex-1 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all hover:bg-[#d1504a]"
        >
          Reprogrammer
        </button>
        <button
          type="button"
          onClick={() => setView("confirm-cancel")}
          className="flex-1 rounded-xl border border-line bg-card px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function Centered({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 text-center">
      <h2 className="nc-title mb-3 text-2xl">{title}</h2>
      {children}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
