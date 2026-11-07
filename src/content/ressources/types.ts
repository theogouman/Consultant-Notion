/**
 * Modèle d'une ressource (guide, tutoriel…) publiée sous /ressources/<slug>.
 *
 * Une ressource = un fichier TypeScript typé dans ce dossier, enregistré dans
 * `index.ts`. Le rendu est entièrement générique (template unique
 * `src/app/ressources/[slug]/page.tsx`) : on n'écrit que du contenu.
 *
 * Convention : tout fait non confirmé par la source s'écrit `[À VÉRIFIER]`
 * dans le texte. Le marqueur est mis en évidence au rendu pour la relecture.
 */

/** Noms des animations codées disponibles. */
export type AnimationNom = "memoire-ia";

/** Média principal du hero. Fichiers dans `public/ressources/<slug>/`. */
export type RessourceMedia =
  | {
      type: "video";
      /** Chemin public, ex. `/ressources/<slug>/animation.mp4`. */
      src: string;
      /** Image affichée avant lecture (optionnelle). */
      poster?: string;
      /** Description du contenu de la vidéo (accessibilité). */
      alt: string;
    }
  | {
      /** Animation codée (composant React), enregistrée dans
       *  `src/components/ressources/animations/index.ts`. */
      type: "animation";
      nom: AnimationNom;
      /** Description de l'animation (aria-label). */
      alt: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
      width: number;
      height: number;
    };

/** Paragraphe(s) de texte courant, avec titre optionnel. */
export interface SectionIntro {
  type: "intro";
  id?: string;
  titre?: string;
  paragraphes: string[];
  /** `encadre` : rendu en carte (exemple, mise en situation). */
  style?: "normal" | "encadre";
}

/** Liste à puces « titre + explication ». */
export interface SectionListe {
  type: "liste";
  id?: string;
  titre: string;
  intro?: string;
  items: { titre: string; texte: string }[];
}

/** Liste numérotée d'étapes. */
export interface SectionEtapes {
  type: "etapes";
  id?: string;
  titre: string;
  intro?: string;
  etapes: { titre: string; texte: string; details?: string[] }[];
}

/** Encadré « À copier » avec bouton Copier. */
export interface SectionCopie {
  type: "copie";
  id?: string;
  titre: string;
  /** Texte exact copié dans le presse-papiers. */
  valeur: string;
  /** Consigne d'usage affichée sous la valeur. */
  consigne: string;
}

/** Questions fréquentes (accordéons). */
export interface SectionFaq {
  type: "faq";
  id?: string;
  titre: string;
  questions: { q: string; r: string }[];
}

/** Appel à l'action vers la prise de rendez-vous (modal de réservation). */
export interface SectionCta {
  type: "cta";
  id?: string;
  /** `discret` : rappel léger en cours de lecture. `final` : bloc de fin. */
  variante: "discret" | "final";
  titre: string;
  texte?: string;
  bouton: string;
}

export type RessourceSection =
  | SectionIntro
  | SectionListe
  | SectionEtapes
  | SectionCopie
  | SectionFaq
  | SectionCta;

export interface Ressource {
  /** Identifiant d'URL : minuscules, chiffres et tirets. Aussi le `post` CRM. */
  slug: string;
  /** Titre H1 de la page. */
  titre: string;
  /** Sous-titre du hero + accroche de la carte dans l'index. */
  accroche: string;
  /** Meta description (≈ 150–160 caractères). */
  descriptionSeo: string;
  /** Date de publication, format ISO `AAAA-MM-JJ`. */
  datePublication: string;
  /** Date de dernière mise à jour (sitemap), format ISO. */
  dateMiseAJour?: string;
  /** Le premier tag sert d'étiquette sur la carte. */
  tags: string[];
  media?: RessourceMedia;
  /** Source citée en bas de page (document officiel, etc.). */
  source?: { label: string; url: string };
  sections: RessourceSection[];
}
