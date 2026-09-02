/**
 * Canal d'acquisition : normalisation des paramètres et format de la valeur
 * écrite dans le CRM (« source⎜post »).
 * Fonctions pures uniquement — aucune dépendance au navigateur.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CHANNEL_SEPARATOR,
  formatAcquisitionChannel,
  sanitizeAcquisitionParam,
} from "./acquisition";

test("sanitize : trime, borne et rejette le vide", () => {
  assert.equal(sanitizeAcquisitionParam("  linkedin  "), "linkedin");
  assert.equal(sanitizeAcquisitionParam(""), null);
  assert.equal(sanitizeAcquisitionParam("   "), null);
  assert.equal(sanitizeAcquisitionParam(undefined), null);
  assert.equal(sanitizeAcquisitionParam(42), null);
  assert.equal(sanitizeAcquisitionParam("a".repeat(200))?.length, 120);
});

test("sanitize : neutralise les caractères de contrôle", () => {
  assert.equal(sanitizeAcquisitionParam("linked\nin"), "linked in");
  assert.equal(sanitizeAcquisitionParam("\u0000linkedin\u007f"), "linkedin");
});

test("format : les deux paramètres -> source⎜post", () => {
  assert.equal(
    formatAcquisitionChannel({ source: "linkedin", post: "carrousel-crm" }),
    `linkedin${CHANNEL_SEPARATOR}carrousel-crm`,
  );
});

test("format : un seul paramètre -> valeur seule, sans séparateur orphelin", () => {
  assert.equal(formatAcquisitionChannel({ source: "linkedin", post: null }), "linkedin");
  assert.equal(formatAcquisitionChannel({ source: null, post: "post-42" }), "post-42");
  assert.equal(formatAcquisitionChannel({ source: "  ", post: "post-42" }), "post-42");
});

test("format : aucun paramètre -> chaîne vide (propriété CRM laissée vide)", () => {
  assert.equal(formatAcquisitionChannel({ source: null, post: null }), "");
  assert.equal(formatAcquisitionChannel({ source: "", post: "  " }), "");
});
