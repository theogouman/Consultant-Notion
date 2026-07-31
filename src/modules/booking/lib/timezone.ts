/**
 * Discipline fuseaux horaires (non négociable) :
 *   - Stockage TOUJOURS en UTC.
 *   - Tous les calculs passent par Luxon — jamais d'arithmétique d'offset manuelle.
 *   - Les créneaux sont générés en heure host puis convertis en UTC pour le
 *     stockage, et reconvertis dans le fuseau du lead pour l'affichage.
 *
 * La lib gère les bascules d'heure (fin mars / fin octobre) : une plage
 * "09:00–18:00" en Europe/Paris reste "09:00–18:00" local même le jour du
 * changement d'heure, l'instant UTC correspondant se décale automatiquement.
 */

import { DateTime } from "luxon";

/** Vrai si le fuseau IANA est valide (sinon fallback contrôlé côté appelant). */
export function isValidTimezone(tz: string): boolean {
  return DateTime.local().setZone(tz).isValid;
}

/** Fuseau du lead : celui du navigateur, retombant sur le fuseau host si invalide. */
export function safeLeadTimezone(tz: string | undefined | null, fallback: string): string {
  if (tz && isValidTimezone(tz)) return tz;
  return fallback;
}

/**
 * Compose un instant absolu (UTC) à partir d'une date civile + heure "HH:mm"
 * interprétées dans un fuseau donné. Gère les bascules d'heure.
 *
 * @param isoDate  "yyyy-mm-dd" (date civile dans `zone`)
 * @param hhmm     "HH:mm"
 * @param zone     fuseau IANA
 * @returns        DateTime en UTC
 */
export function zonedTimeToUtc(isoDate: string, hhmm: string, zone: string): DateTime {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return DateTime.fromISO(isoDate, { zone })
    .set({ hour: h, minute: m, second: 0, millisecond: 0 })
    .toUTC();
}

/** Convertit un instant UTC (ISO) vers une date civile "yyyy-mm-dd" dans `zone`. */
export function utcToZonedDate(utcIso: string, zone: string): string {
  return DateTime.fromISO(utcIso, { zone: "utc" }).setZone(zone).toISODate() ?? "";
}

/** Minutes écoulées depuis minuit pour un "HH:mm". */
export function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return h * 60 + m;
}

/** "HH:mm" à partir d'un nombre de minutes depuis minuit. */
export function hhmmFromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Libellé lisible d'un créneau dans le fuseau du lead.
 * Ex. « jeudi 4 septembre, 14:00 » (locale fr).
 */
export function formatSlotLong(utcIso: string, zone: string): string {
  return DateTime.fromISO(utcIso, { zone: "utc" })
    .setZone(zone)
    .setLocale("fr")
    .toFormat("cccc d LLLL, HH:mm");
}

/** Heure seule d'un créneau (ex. « 14:00 ») dans le fuseau du lead. */
export function formatSlotTime(utcIso: string, zone: string): string {
  return DateTime.fromISO(utcIso, { zone: "utc" }).setZone(zone).toFormat("HH:mm");
}

/** Libellé de journée (ex. « jeudi 4 septembre ») dans le fuseau du lead. */
export function formatDayLong(isoDate: string, zone: string): string {
  return DateTime.fromISO(isoDate, { zone }).setLocale("fr").toFormat("cccc d LLLL");
}

/** Nom court du fuseau (ex. « UTC+2 », « CEST ») pour lever toute ambiguïté. */
export function timezoneAbbrev(utcIso: string, zone: string): string {
  return (
    DateTime.fromISO(utcIso, { zone: "utc" }).setZone(zone).toFormat("ZZZZ") || zone
  );
}

/**
 * Fuseaux proposés dans le sélecteur : ville capitale (en français) + drapeau.
 * La capitale partage le fuseau du pays (Paris/France, Bruxelles/Belgique…),
 * ce qui rend le libellé plus clair qu'un « GMT+2 » abstrait.
 */
export interface TimezoneOption {
  tz: string;
  city: string;
  flag: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { tz: "Europe/Paris", city: "Paris", flag: "🇫🇷" },
  { tz: "Europe/Brussels", city: "Bruxelles", flag: "🇧🇪" },
  { tz: "Europe/Zurich", city: "Berne", flag: "🇨🇭" },
  { tz: "Europe/Luxembourg", city: "Luxembourg", flag: "🇱🇺" },
  { tz: "Europe/Monaco", city: "Monaco", flag: "🇲🇨" },
  { tz: "America/Toronto", city: "Ottawa", flag: "🇨🇦" },
  { tz: "Africa/Casablanca", city: "Rabat", flag: "🇲🇦" },
  { tz: "Africa/Dakar", city: "Dakar", flag: "🇸🇳" },
  { tz: "Europe/London", city: "Londres", flag: "🇬🇧" },
  { tz: "Europe/Madrid", city: "Madrid", flag: "🇪🇸" },
  { tz: "Europe/Lisbon", city: "Lisbonne", flag: "🇵🇹" },
  { tz: "Europe/Berlin", city: "Berlin", flag: "🇩🇪" },
  { tz: "Europe/Rome", city: "Rome", flag: "🇮🇹" },
];

const TZ_BY_ID = new Map(TIMEZONE_OPTIONS.map((o) => [o.tz, o]));

/** Ville (français) + drapeau depuis un IANA — repli sur la dernière portion. */
export function timezoneParts(tz: string): { city: string; flag: string } {
  const known = TZ_BY_ID.get(tz);
  if (known) return { city: known.city, flag: known.flag };
  // Repli : « Europe/Some_City » -> « Some City » 🌍
  const last = tz.split("/").pop() ?? tz;
  return { city: last.replace(/_/g, " "), flag: "🌍" };
}

/** Libellé complet du fuseau : « Horaire de Paris 🇫🇷 ». */
export function timezoneLabel(tz: string): string {
  const { city, flag } = timezoneParts(tz);
  return `Horaire de ${city} ${flag}`;
}

/** Clé jour-de-semaine Luxon (1=lundi) -> notre clé de planning. */
const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export function weekdayKey(dt: DateTime): (typeof WEEKDAY_KEYS)[number] {
  // Luxon: weekday 1..7 (lundi..dimanche)
  return WEEKDAY_KEYS[dt.weekday - 1];
}

export { DateTime };
