import type { Ressource } from "./types";

/**
 * Guide officiel Notion « Set up Notion for your agent » (v0.0.6, publié le
 * 30/10/2026) : https://developers.notion.com/prompts/setup
 *
 * Chaque affirmation ci-dessous a été vérifiée sur cette page. Durée de mise
 * en place et compatibilité Gemini non confirmées : volontairement absentes.
 */
const SETUP_URL = "https://developers.notion.com/prompts/setup";

export const memoireIaNotion: Ressource = {
  slug: "memoire-ia-notion",
  titre: "Donne une mémoire à toutes tes IA, dans ton Notion",
  accroche:
    "Un lien à coller, et Claude ou ChatGPT ne repartent plus de zéro à chaque conversation.",
  descriptionSeo:
    "Le guide officiel de Notion pour faire de ton espace la mémoire partagée de tes IA (Claude, ChatGPT…). Un lien à coller, et tes IA ne repartent plus de zéro.",
  datePublication: "2026-11-07",
  tags: ["IA", "Notion", "Guide"],
  media: {
    type: "video",
    src: "/ressources/memoire-ia-notion/animation.mp4",
    alt: "Animation : une IA enregistre son contexte dans Notion, puis une autre IA le relit.",
  },
  source: {
    label: "Guide officiel Notion « Set up Notion for your agent »",
    url: SETUP_URL,
  },
  sections: [
    {
      type: "copie",
      id: "lien",
      titre: "À copier",
      valeur: SETUP_URL,
      consigne:
        "Colle ce lien dans Claude ou ChatGPT et demande-lui de lancer la configuration.",
    },
    {
      type: "cta",
      id: "cta-final",
      variante: "final",
      titre:
        "Tu veux aller plus loin et structurer tout ton Notion pour que ton équipe et tes IA travaillent dessus ?",
      texte:
        "On fait le point sur ton organisation actuelle et on voit ce qui vaut le coup d'être construit.",
      bouton: "Réserver un appel",
    },
  ],
};
