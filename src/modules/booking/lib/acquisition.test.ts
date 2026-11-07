/**
 * Canal d'acquisition : normalisation des paramètres et format de la valeur
 * écrite dans le CRM (« source⎜post »).
 * Fonctions pures uniquement — aucune dépendance au navigateur.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CHANNEL_SEPARATOR,
  EMPTY_ACQUISITION,
  RESSOURCE_SOURCE,
  captureRessourceAcquisition,
  formatAcquisitionChannel,
  resolveDefaultAcquisition,
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

/* -------------------------------------------------------------------------- */
/* Attribution par défaut des pages ressources                                 */
/* -------------------------------------------------------------------------- */

test("défaut ressource : appliqué seulement sans attribution existante", () => {
  const fallback = { source: RESSOURCE_SOURCE, post: "memoire-ia-notion" };
  assert.deepEqual(resolveDefaultAcquisition(EMPTY_ACQUISITION, fallback), fallback);
  // Une source déjà capturée (ex. ?source=linkedin) reste prioritaire.
  const linkedin = { source: "linkedin", post: null };
  assert.deepEqual(resolveDefaultAcquisition(linkedin, fallback), linkedin);
  assert.equal(
    formatAcquisitionChannel(resolveDefaultAcquisition(EMPTY_ACQUISITION, fallback)),
    `ressource${CHANNEL_SEPARATOR}memoire-ia-notion`,
  );
});

/** Faux navigateur minimal : URL + sessionStorage en mémoire. */
function withFakeWindow(search: string, store: Map<string, string>, fn: () => void) {
  const g = globalThis as unknown as { window?: unknown };
  const previous = g.window;
  g.window = {
    location: { search },
    sessionStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  };
  try {
    fn();
  } finally {
    g.window = previous;
  }
}

// Ordre volontaire : le module garde un repli mémoire pour l'onglet, donc le
// cas « onglet vierge » passe en premier.
test("capture ressource : onglet vierge -> ressource⎜<slug> mémorisé", () => {
  const store = new Map<string, string>();
  withFakeWindow("", store, () => {
    const acq = captureRessourceAcquisition("memoire-ia-notion");
    assert.equal(formatAcquisitionChannel(acq), `ressource${CHANNEL_SEPARATOR}memoire-ia-notion`);
  });
  assert.deepEqual(JSON.parse(store.get("nc:acquisition") ?? "null"), {
    source: "ressource",
    post: "memoire-ia-notion",
  });
});

test("capture ressource : une 2e ressource ne réécrit pas l'attribution", () => {
  const store = new Map<string, string>();
  withFakeWindow("", store, () => {
    const acq = captureRessourceAcquisition("autre-ressource");
    assert.equal(formatAcquisitionChannel(acq), `ressource${CHANNEL_SEPARATOR}memoire-ia-notion`);
  });
});

test("capture ressource : ?source=linkedin dans l'URL reste prioritaire", () => {
  withFakeWindow("?source=linkedin&post=carrousel", new Map(), () => {
    const acq = captureRessourceAcquisition("memoire-ia-notion");
    assert.equal(formatAcquisitionChannel(acq), `linkedin${CHANNEL_SEPARATOR}carrousel`);
  });
});
