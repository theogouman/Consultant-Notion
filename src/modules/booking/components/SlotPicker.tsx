"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime, formatSlotTime, formatDayLong } from "../lib/timezone";
import TimezoneDropdown from "./TimezoneDropdown";
import type { AvailableDay, Slot } from "../types";

/**
 * Sélecteur de créneaux en deux temps :
 *   1. Un calendrier mensuel (30/31 jours) où l'on choisit une date.
 *   2. Un morphisme smooth révèle les horaires disponibles de ce jour.
 * Tout est déjà calculé côté serveur et converti dans le fuseau du lead.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const WEEKDAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function SlotPicker({
  days,
  leadTimezone,
  loading,
  onSelect,
  onTimezoneChange,
}: {
  days: AvailableDay[];
  leadTimezone: string;
  loading: boolean;
  onSelect: (slot: Slot) => void;
  onTimezoneChange: (tz: string) => void;
}) {
  const availByDate = useMemo(
    () => new Map(days.map((d) => [d.date, d.slots])),
    [days],
  );
  const availableDates = useMemo(() => new Set(days.map((d) => d.date)), [days]);

  const bounds = useMemo(() => {
    if (days.length === 0) return null;
    return {
      min: DateTime.fromISO(days[0].date).startOf("month"),
      max: DateTime.fromISO(days[days.length - 1].date).startOf("month"),
    };
  }, [days]);

  const [monthAnchor, setMonthAnchor] = useState<string>(() =>
    (days[0] ? DateTime.fromISO(days[0].date) : DateTime.now().setZone(leadTimezone))
      .startOf("month")
      .toISODate()!,
  );
  const [view, setView] = useState<"month" | "day">("month");
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Nouveau jeu de disponibilités (ex. changement de fuseau) -> on réinitialise.
  useEffect(() => {
    const first = days[0]
      ? DateTime.fromISO(days[0].date)
      : DateTime.now().setZone(leadTimezone);
    setMonthAnchor(first.startOf("month").toISODate()!);
    setView("month");
    setActiveDate(null);
  }, [days, leadTimezone]);

  // Animation d'entrée à chaque changement de vue (morphisme).
  useEffect(() => {
    const el = stageRef.current;
    if (!el || reducedMotion()) return;
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(
      [
        { opacity: 0, transform: view === "day" ? "scale(1.03) translateY(8px)" : "scale(0.97) translateY(-8px)" },
        { opacity: 1, transform: "scale(1) translateY(0)" },
      ],
      { duration: 260, easing: EASE, fill: "both" },
    );
  }, [view]);

  function morphTo(next: () => void, toView: "month" | "day") {
    const el = stageRef.current;
    if (!el || reducedMotion()) {
      next();
      return;
    }
    el.getAnimations().forEach((a) => a.cancel());
    const out = el.animate(
      [
        { opacity: 1, transform: "scale(1) translateY(0)" },
        { opacity: 0, transform: toView === "day" ? "scale(0.97) translateY(-8px)" : "scale(1.03) translateY(8px)" },
      ],
      { duration: 200, easing: EASE, fill: "forwards" },
    );
    out.onfinish = () => next();
  }

  function selectDate(date: string) {
    setActiveDate(date);
    morphTo(() => setView("day"), "day");
  }

  function backToMonth() {
    morphTo(() => setView("month"), "month");
  }

  const anchor = DateTime.fromISO(monthAnchor);
  const canPrev = !!bounds && anchor > bounds.min;
  const canNext = !!bounds && anchor < bounds.max;

  return (
    <div>
      <div ref={stageRef}>
        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center text-muted">
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
              Recherche des créneaux disponibles…
            </span>
          </div>
        ) : days.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 text-center">
            <p className="text-base font-medium text-ink">Aucun créneau disponible pour le moment.</p>
            <p className="text-sm text-muted">
              Revenez un peu plus tard, de nouveaux créneaux s'ouvrent régulièrement.
            </p>
          </div>
        ) : view === "month" ? (
          <MonthGrid
            anchor={anchor}
            leadTimezone={leadTimezone}
            availableDates={availableDates}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => setMonthAnchor(anchor.minus({ months: 1 }).toISODate()!)}
            onNext={() => setMonthAnchor(anchor.plus({ months: 1 }).toISODate()!)}
            onSelect={selectDate}
          />
        ) : (
          <DaySlots
            date={activeDate!}
            slots={availByDate.get(activeDate!) ?? []}
            leadTimezone={leadTimezone}
            onBack={backToMonth}
            onSelect={onSelect}
          />
        )}
      </div>

      {/* Fuseau d'affichage (toujours visible). */}
      <div className="mt-5 flex justify-end border-t border-line pt-3">
        <TimezoneDropdown value={leadTimezone} onChange={onTimezoneChange} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendrier mensuel                                                         */
/* -------------------------------------------------------------------------- */
function MonthGrid({
  anchor,
  leadTimezone,
  availableDates,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onSelect,
}: {
  anchor: DateTime;
  leadTimezone: string;
  availableDates: Set<string>;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (date: string) => void;
}) {
  const monthLabel = capitalize(anchor.setLocale("fr").toFormat("LLLL yyyy"));
  const today = DateTime.now().setZone(leadTimezone).toISODate();
  const daysInMonth = anchor.daysInMonth ?? 30;
  const leadingBlanks = anchor.weekday - 1; // 1=lundi

  const cells: (string | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(anchor.set({ day: d }).toISODate()!);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <NavButton dir="prev" disabled={!canPrev} onClick={onPrev} />
        <span className="text-sm font-semibold text-ink">{monthLabel}</span>
        <NavButton dir="next" disabled={!canNext} onClick={onNext} />
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1 text-center text-[0.7rem] font-medium uppercase tracking-wide text-muted">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`b${i}`} />;
          const available = availableDates.has(date);
          const isToday = date === today;
          const dayNum = DateTime.fromISO(date).day;
          return (
            <button
              key={date}
              type="button"
              disabled={!available}
              onClick={() => onSelect(date)}
              aria-label={formatDayLong(date, leadTimezone)}
              className={`relative flex aspect-square items-center justify-center rounded-sm text-sm transition-all duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                available
                  ? "cursor-pointer bg-raised font-medium text-ink hover:bg-accent hover:text-white"
                  : "cursor-default text-muted/40"
              } ${isToday && available ? "ring-1 ring-accent" : ""}`}
            >
              {dayNum}
              {available && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Mois précédent" : "Mois suivant"}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={dir === "next" ? "rotate-180" : ""}>
        <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Horaires d'un jour                                                         */
/* -------------------------------------------------------------------------- */
function DaySlots({
  date,
  slots,
  leadTimezone,
  onBack,
  onSelect,
}: {
  date: string;
  slots: Slot[];
  leadTimezone: string;
  onBack: () => void;
  onSelect: (slot: Slot) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour au calendrier"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-ink">
          {capitalize(formatDayLong(date, leadTimezone))}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((slot) => (
          <button
            key={slot.start_utc}
            type="button"
            onClick={() => onSelect(slot)}
            className="rounded-sm border border-line bg-raised px-3 py-2.5 text-center text-[0.95rem] font-medium text-ink transition-all duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-accent hover:bg-accent/5 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {formatSlotTime(slot.start_utc, leadTimezone)}
          </button>
        ))}
      </div>
    </div>
  );
}
