/**
 * Garde-fous du registre des ressources : slugs valides et uniques, dates ISO,
 * ordre antéchronologique, sections cohérentes.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDateFr, getRessource, ressources } from "./index";

test("slugs : format URL et unicité", () => {
  const slugs = ressources.map((r) => r.slug);
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, s);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("dates ISO valides et tri du plus récent au plus ancien", () => {
  for (const r of ressources) {
    assert.match(r.datePublication, /^\d{4}-\d{2}-\d{2}$/, r.slug);
    assert.ok(!Number.isNaN(Date.parse(r.datePublication)), r.slug);
  }
  const dates = ressources.map((r) => r.datePublication);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("chaque ressource a un contenu exploitable", () => {
  for (const r of ressources) {
    assert.ok(r.titre && r.accroche && r.descriptionSeo, r.slug);
    assert.ok(r.tags.length > 0, r.slug);
    assert.ok(r.sections.length > 0, r.slug);
    // Au moins un CTA vers la prise de rendez-vous.
    assert.ok(r.sections.some((s) => s.type === "cta"), `${r.slug} : aucun CTA`);
    // Ids d'ancre uniques dans la page.
    const ids = r.sections.map((s) => s.id).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, r.slug);
    if (r.media) assert.ok(r.media.src.startsWith(`/ressources/${r.slug}/`), r.slug);
  }
});

test("getRessource / formatDateFr", () => {
  assert.equal(getRessource("memoire-ia-notion")?.slug, "memoire-ia-notion");
  assert.equal(getRessource("inexistante"), undefined);
  assert.equal(formatDateFr("2026-11-07"), "7 novembre 2026");
});
