import "server-only";
import {
  queryDatabaseAll,
  getPage,
  getTitle,
  getMultiSelect,
  getFirstFileUrl,
} from "./client";
import { normalizeBlocks } from "./router";
import type { CaseStudy, CaseStudyDetail } from "./types";

/**
 * Accès aux études de cas (base Notion §7).
 * Propriétés utilisées : `Titre` (title), `Image` (files),
 * `Secteur d'activité` (multi-select).
 */

const DEFAULT_DB_ID = "a9a77a8e49af4c83bb6c3cfc67706b20";

function databaseId(): string {
  return process.env.NOTION_CASE_STUDIES_DATABASE_ID || DEFAULT_DB_ID;
}

const PROP_TITLE = "Titre";
const PROP_IMAGE = "Image";
const PROP_SECTOR = "Secteur d'activité";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toCaseStudy(page: any): CaseStudy {
  const props = page.properties || {};
  return {
    id: page.id,
    title: getTitle(props, PROP_TITLE) || "Étude de cas",
    coverUrl: getFirstFileUrl(props, PROP_IMAGE),
    sectors: getMultiSelect(props, PROP_SECTOR),
  };
}

/** Liste des études de cas pour la grille (couverture + titre + secteurs). */
export async function getCaseStudies(): Promise<CaseStudy[]> {
  const pages = await queryDatabaseAll(databaseId());
  return pages.map(toCaseStudy);
}

/** Étude de cas + corps de page rendu (pour le panneau détaillé). */
export async function getCaseStudyDetail(
  pageId: string,
): Promise<CaseStudyDetail | null> {
  const rawBlocks = await getPage(pageId);
  const blocks = await normalizeBlocks(rawBlocks);
  // Le titre/couverture/secteurs viennent de la liste ; ici on ne renvoie
  // que les blocs. L'appelant fusionne avec le CaseStudy correspondant.
  return {
    id: pageId,
    title: "",
    coverUrl: null,
    sectors: [],
    blocks,
  };
}

/** Toutes les études de cas avec leur corps de page (build-time + ISR). */
export async function getCaseStudiesWithBody(): Promise<CaseStudyDetail[]> {
  const list = await getCaseStudies();
  const detailed = await Promise.all(
    list.map(async (cs): Promise<CaseStudyDetail> => {
      const rawBlocks = await getPage(cs.id);
      const blocks = await normalizeBlocks(rawBlocks);
      return { ...cs, blocks };
    }),
  );
  return detailed;
}

/** Liste dédupliquée des secteurs (pour la barre de filtres). */
export function collectSectors(caseStudies: CaseStudy[]): string[] {
  const set = new Set<string>();
  caseStudies.forEach((cs) => cs.sectors.forEach((s) => set.add(s)));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
}
