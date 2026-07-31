/**
 * Tests fuseaux horaires — cas obligatoire autour des bascules d'heure (§2).
 * Exécution : `npm test`.
 *
 * On vérifie que la conversion heure host -> UTC est correcte été/hiver ET le
 * jour même d'un changement d'heure, sans aucune arithmétique d'offset manuelle.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { zonedTimeToUtc, formatSlotTime } from "./timezone";

const PARIS = "Europe/Paris";

test("été (CEST, UTC+2) : 14:00 Paris -> 12:00Z", () => {
  const utc = zonedTimeToUtc("2026-07-15", "14:00", PARIS);
  assert.equal(utc.toISO(), "2026-07-15T12:00:00.000Z");
});

test("hiver (CET, UTC+1) : 14:00 Paris -> 13:00Z", () => {
  const utc = zonedTimeToUtc("2026-01-15", "14:00", PARIS);
  assert.equal(utc.toISO(), "2026-01-15T13:00:00.000Z");
});

test("bascule printemps (2026-03-29, +1h à 02:00) : offset géré par la lib", () => {
  // Veille : encore UTC+1 -> 09:00 local = 08:00Z.
  const before = zonedTimeToUtc("2026-03-28", "09:00", PARIS);
  assert.equal(before.toISO(), "2026-03-28T08:00:00.000Z");
  // Jour de bascule : déjà UTC+2 à 09:00 -> 07:00Z (décalage automatique).
  const after = zonedTimeToUtc("2026-03-29", "09:00", PARIS);
  assert.equal(after.toISO(), "2026-03-29T07:00:00.000Z");
});

test("bascule automne (2026-10-25, -1h à 03:00) : offset géré par la lib", () => {
  // Veille : encore UTC+2 -> 09:00 local = 07:00Z.
  const before = zonedTimeToUtc("2026-10-24", "09:00", PARIS);
  assert.equal(before.toISO(), "2026-10-24T07:00:00.000Z");
  // Jour de bascule : repassé en UTC+1 à 09:00 -> 08:00Z.
  const after = zonedTimeToUtc("2026-10-25", "09:00", PARIS);
  assert.equal(after.toISO(), "2026-10-25T08:00:00.000Z");
});

test("aller-retour : l'instant UTC se réaffiche à la bonne heure locale", () => {
  const utc = zonedTimeToUtc("2026-07-15", "14:00", PARIS);
  assert.equal(formatSlotTime(utc.toISO()!, PARIS), "14:00");
  // Même instant, affiché à New York (UTC-4 en été) -> 08:00.
  assert.equal(formatSlotTime(utc.toISO()!, "America/New_York"), "08:00");
});
