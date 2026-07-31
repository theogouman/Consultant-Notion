"use client";

import { useState, useEffect } from "react";
import { formatSlotTime, formatDayLong, timezoneAbbrev } from "../lib/timezone";
import type { AvailableDay, Slot } from "../types";

/**
 * Sélecteur de créneaux. Les dates disponibles s'affichent en chips ; les
 * horaires du jour sélectionné apparaissent en grille, dans le fuseau du lead.
 * Tout est déjà calculé côté serveur et converti dans le fuseau du lead.
 */
export default function SlotPicker({
  days,
  leadTimezone,
  loading,
  onSelect,
}: {
  days: AvailableDay[];
  leadTimezone: string;
  loading: boolean;
  onSelect: (slot: Slot) => void;
}) {
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // Sélectionne le premier jour disponible dès que la liste est prête.
  useEffect(() => {
    if (days.length > 0) {
      setActiveDate((prev) =>
        prev && days.some((d) => d.date === prev) ? prev : days[0].date,
      );
    } else {
      setActiveDate(null);
    }
  }, [days]);

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center text-muted">
        <span className="inline-flex items-center gap-2 text-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
          Recherche des créneaux disponibles…
        </span>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-base font-medium text-ink">Aucun créneau disponible pour le moment.</p>
        <p className="text-sm text-muted">
          Revenez un peu plus tard, de nouveaux créneaux s'ouvrent régulièrement.
        </p>
      </div>
    );
  }

  const active = days.find((d) => d.date === activeDate) ?? days[0];
  const tz = active.slots[0] ? timezoneAbbrev(active.slots[0].start_utc, leadTimezone) : "";

  return (
    <div>
      {/* Bandeau de dates (défilement horizontal) */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <DayChip
            key={d.date}
            day={d}
            timezone={leadTimezone}
            active={d.date === active.date}
            onClick={() => setActiveDate(d.date)}
          />
        ))}
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-ink">
          {capitalize(formatDayLong(active.date, leadTimezone))}
        </h3>
        {tz && <span className="text-xs text-muted">Horaires en {tz}</span>}
      </div>

      {/* Grille des horaires */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {active.slots.map((slot) => (
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

function DayChip({
  day,
  timezone,
  active,
  onClick,
}: {
  day: AvailableDay;
  timezone: string;
  active: boolean;
  onClick: () => void;
}) {
  const label = formatDayLong(day.date, timezone); // "jeudi 4 septembre"
  const [weekday, ...rest] = label.split(" ");
  const dayNum = rest.join(" ");
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[76px] flex-none flex-col items-center rounded-sm border px-3 py-2 transition-all duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        active
          ? "border-accent bg-accent/5 text-accent"
          : "border-line bg-card text-ink hover:border-accent/50"
      }`}
    >
      <span className="text-[0.7rem] uppercase tracking-wide text-muted">
        {capitalize(weekday)}
      </span>
      <span className="text-sm font-medium">{dayNum}</span>
      <span className="mt-0.5 text-[0.7rem] text-muted">
        {day.slots.length} créneau{day.slots.length > 1 ? "x" : ""}
      </span>
    </button>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
