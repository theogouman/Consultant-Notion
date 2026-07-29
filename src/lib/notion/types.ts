/** Types partagés pour l'intégration Notion (études de cas + rendu de blocs). */

/** Étude de cas telle qu'affichée dans la grille (§7 du brief). */
export interface CaseStudy {
  id: string;
  /** Propriété `Titre` (title). */
  title: string;
  /** Propriété `Image` (files) → couverture cliquable. */
  coverUrl: string | null;
  /** Propriété `Secteur d'activité` (multi-select) → badges + filtres. */
  sectors: string[];
}

/** Type d'annotation de texte riche Notion, normalisé. */
export interface RichText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: string;
  href?: string | null;
}

/**
 * Bloc Notion normalisé (~30 types supportés côté `router`).
 * `children` porte les blocs imbriqués (listes, toggles, colonnes…).
 */
export interface NotionBlock {
  id: string;
  type: NotionBlockType;
  richText?: RichText[];
  /** Niveau de titre pour heading_1/2/3. */
  level?: 1 | 2 | 3;
  /** URL pour image / video / file / bookmark / embed. */
  url?: string | null;
  /** Légende (image, code…). */
  caption?: RichText[];
  /** Langage pour les blocs de code. */
  language?: string;
  /** Icône (callout). */
  icon?: string | null;
  /** État coché (to_do). */
  checked?: boolean;
  children?: NotionBlock[];
}

export type NotionBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "to_do"
  | "toggle"
  | "quote"
  | "callout"
  | "code"
  | "image"
  | "video"
  | "file"
  | "bookmark"
  | "embed"
  | "divider"
  | "table"
  | "table_row"
  | "column_list"
  | "column"
  | "unsupported";

/** Étude de cas + corps de page (pour le panneau détaillé). */
export interface CaseStudyDetail extends CaseStudy {
  blocks: NotionBlock[];
}
