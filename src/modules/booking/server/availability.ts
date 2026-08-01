/**
 * Calcul des disponibilités (§4 du brief).
 *
 * 1. Générer les créneaux candidats depuis weekly_availability (heure host),
 *    au pas slot_granularity_min, de durée call_duration_min.
 * 2. Soustraire l'occupé Google (freebusy).
 * 3. Soustraire les réservations actives (bookings).
 * 4. Appliquer les règles : min_notice_hours, max_advance_days,
 *    buffer_before/after_min, max_per_day.
 * 5. Convertir dans le fuseau du lead et renvoyer, groupé par jour.
 *
 * Tout est calculé sur des instants absolus (millisecondes epoch) ; les
 * conversions civiles passent par Luxon. Aucun offset manuel.
 */

import "server-only";
import { getSettings } from "./settings";
import { getBusyIntervals } from "./google";
import { getActiveBookingsInRange } from "./bookings";
import {
  DateTime,
  zonedTimeToUtc,
  minutesOfDay,
  weekdayKey,
  safeLeadTimezone,
} from "../lib/timezone";
import type { AvailableDay, Settings, Slot } from "../types";

interface Interval {
  start: number; // epoch ms
  end: number; // epoch ms
}

/** Chevauchement strict de deux intervalles. */
function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/* -------------------------------------------------------------------------- */
/* Cache mémoire court des disponibilités                                     */
/* -------------------------------------------------------------------------- */
/**
 * Le calcul des disponibilités interroge Google (freebusy) + Supabase à chaque
 * appel, ce qui domine le temps d'affichage du calendrier. On mémorise le
 * résultat par fuseau pendant quelques secondes : les réouvertures du modal et
 * les changements de fuseau deviennent instantanés, et plusieurs visiteurs
 * partagent le même calcul (les disponibilités sont globales, pas par-lead).
 *
 * La fenêtre est courte (le créneau n'est ferme qu'à la soumission, arbitré par
 * l'index unique en base) ; toute mutation (résa/reprogrammation/annulation)
 * vide ce cache via invalidateAvailabilityCache().
 */
const AVAIL_TTL_MS = 20_000;
type AvailabilityResult = {
  days: AvailableDay[];
  leadTimezone: string;
  hostTimezone: string;
};
const availabilityCache = new Map<
  string,
  { at: number; value: AvailabilityResult }
>();

/** Vide le cache de disponibilités (à appeler après toute mutation). */
export function invalidateAvailabilityCache(): void {
  availabilityCache.clear();
}

/**
 * Garde-fou PUR (aucun appel réseau) : un créneau est-il dans la fenêtre
 * réservable (pas dans le passé, respecte min_notice et max_advance) ?
 * Utilisé à la soumission pour rejeter un créneau périmé sans relancer tout le
 * calcul de disponibilité (l'anti-double-booking est assuré par l'index unique).
 */
export function isWithinBookableWindow(
  startUtcIso: string,
  settings: Settings,
  now: DateTime = DateTime.utc(),
): boolean {
  const s = Date.parse(startUtcIso);
  if (Number.isNaN(s)) return false;
  const minMs = now.toMillis() + settings.min_notice_hours * 3600_000;
  const maxMs = now
    .setZone(settings.host_timezone)
    .startOf("day")
    .plus({ days: settings.max_advance_days + 1 })
    .toMillis();
  return s >= minMs && s < maxMs;
}

/**
 * Génère les créneaux candidats (UTC) sur la fenêtre réservable, en heure host.
 * La fenêtre va de maintenant (borne min_notice) à now + max_advance_days.
 */
function generateCandidateSlots(settings: Settings, now: DateTime): Slot[] {
  const zone = settings.host_timezone;
  const duration = settings.call_duration_min;
  const step = settings.slot_granularity_min;

  // On itère sur les dates civiles host, de aujourd'hui à +max_advance_days.
  const startDay = now.setZone(zone).startOf("day");
  const endDay = startDay.plus({ days: settings.max_advance_days });

  const slots: Slot[] = [];
  for (let day = startDay; day <= endDay; day = day.plus({ days: 1 })) {
    const isoDate = day.toISODate();
    if (!isoDate) continue;
    const ranges = settings.weekly_availability[weekdayKey(day)] ?? [];

    for (const range of ranges) {
      const rangeStart = minutesOfDay(range.start);
      const rangeEnd = minutesOfDay(range.end);
      // Créneaux alignés sur le pas, où l'appel entier tient dans la plage.
      for (let m = rangeStart; m + duration <= rangeEnd; m += step) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        const startUtc = zonedTimeToUtc(isoDate, `${hh}:${mm}`, zone);
        if (!startUtc.isValid) continue; // heure inexistante (bascule printemps)
        const endUtc = startUtc.plus({ minutes: duration });
        slots.push({
          start_utc: startUtc.toISO()!,
          end_utc: endUtc.toISO()!,
        });
      }
    }
  }
  return slots;
}

/**
 * Renvoie les créneaux libres, groupés par jour dans le fuseau du lead.
 */
export async function computeAvailability(
  leadTimezoneInput: string,
): Promise<AvailabilityResult> {
  // Cache court : une réouverture / un changement de fuseau récent ne relance
  // ni Google ni Supabase.
  const cached = availabilityCache.get(leadTimezoneInput);
  if (cached && Date.now() - cached.at < AVAIL_TTL_MS) {
    return cached.value;
  }

  const settings = await getSettings();
  const leadTimezone = safeLeadTimezone(leadTimezoneInput, settings.host_timezone);

  const now = DateTime.utc();
  const nowMs = now.toMillis();
  const minBookableMs = nowMs + settings.min_notice_hours * 3600_000;

  // Bornes UTC de la fenêtre (pour freebusy + bookings).
  const windowStart = now.toISO()!;
  const windowEnd = now
    .setZone(settings.host_timezone)
    .startOf("day")
    .plus({ days: settings.max_advance_days + 1 })
    .toUTC()
    .toISO()!;

  const candidates = generateCandidateSlots(settings, now);

  // Occupé Google + réservations actives (converties en intervalles epoch).
  const [busy, bookings] = await Promise.all([
    getBusyIntervals(windowStart, windowEnd),
    getActiveBookingsInRange(windowStart, windowEnd),
  ]);

  const busyIntervals: Interval[] = [
    ...busy.map((b) => ({
      start: Date.parse(b.start),
      end: Date.parse(b.end),
    })),
    ...bookings.map((b) => ({
      start: Date.parse(b.start_utc),
      end: Date.parse(b.end_utc),
    })),
  ];

  const bufferBeforeMs = settings.buffer_before_min * 60_000;
  const bufferAfterMs = settings.buffer_after_min * 60_000;

  // Comptage par jour host pour la règle max_per_day (réservations existantes).
  const bookingsPerHostDay = new Map<string, number>();
  for (const b of bookings) {
    const day = DateTime.fromISO(b.start_utc, { zone: "utc" })
      .setZone(settings.host_timezone)
      .toISODate();
    if (day) bookingsPerHostDay.set(day, (bookingsPerHostDay.get(day) ?? 0) + 1);
  }

  const freeByLeadDay = new Map<string, Slot[]>();

  for (const slot of candidates) {
    const s = Date.parse(slot.start_utc);
    const e = Date.parse(slot.end_utc);

    // Règle min_notice.
    if (s < minBookableMs) continue;

    // Règle max_per_day (jour host).
    const hostDay = DateTime.fromMillis(s, { zone: "utc" })
      .setZone(settings.host_timezone)
      .toISODate();
    if (hostDay && (bookingsPerHostDay.get(hostDay) ?? 0) >= settings.max_per_day) {
      continue;
    }

    // Créneau élargi des buffers : garantit l'espacement avec l'occupé.
    const expanded: Interval = {
      start: s - bufferBeforeMs,
      end: e + bufferAfterMs,
    };
    const conflict = busyIntervals.some((iv) => overlaps(expanded, iv));
    if (conflict) continue;

    // Groupement par jour civil dans le fuseau du lead.
    const leadDay = DateTime.fromMillis(s, { zone: "utc" })
      .setZone(leadTimezone)
      .toISODate();
    if (!leadDay) continue;
    const arr = freeByLeadDay.get(leadDay) ?? [];
    arr.push(slot);
    freeByLeadDay.set(leadDay, arr);
  }

  const days: AvailableDay[] = [...freeByLeadDay.entries()]
    .map(([date, slots]) => ({
      date,
      slots: slots.sort((a, b) => a.start_utc.localeCompare(b.start_utc)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const result: AvailabilityResult = {
    days,
    leadTimezone,
    hostTimezone: settings.host_timezone,
  };
  availabilityCache.set(leadTimezoneInput, { at: Date.now(), value: result });
  return result;
}
