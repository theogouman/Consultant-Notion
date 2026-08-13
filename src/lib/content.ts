/**
 * Contenu éditorial de la landing (copy intégré tel quel depuis le brief).
 * Les zones [À AFFINER] sont marquées TODO et regroupées ici pour être
 * complétées sans toucher aux composants.
 */

/** Cible unique de tous les CTA : la route du booker maison. */
export const CTA_HREF = "/rdv";
export const CTA_LABEL = "Faire le point sur mon organisation";

export const hero = {
  title:
    "Transformez votre désordre en une organisation claire avec Notion",
  subtitle:
    "On supprime le chaos organisationnel des entreprises en centralisant & automatisant leurs processus dans une solution sur-mesure pour maximiser la productivité",
  cta: "Faire le point sur mon organisation",
};

export const howItWorks = {
  eyebrow: "Comment ça se passe",
  title: "Notre méthode en 4 étapes",
  subtitle: "…On l’optimise en continu depuis 2022",
  steps: [
    {
      title: "Première étude.",
      body: "On fait un rapide premier point sur votre situation pour savoir si nous sommes en capacité de vous accompagner dans votre enjeu.",
    },
    {
      title: "Audit de votre organisation.",
      body: "C'est à ce moment qu'on approfondit vos process actuels pour identifier comment Notion peut vous faire gagner le plus de temps.",
    },
    {
      title: "Création du Notion sur-mesure.",
      body: "On crée le Notion sur-mesure pour répondre à vos enjeux et on vous livre le système prêt à l'emploi.",
    },
    {
      title: "Formation & Itérations.",
      body: "C'est la phase la plus importante pour que ce projet soit une réussite : on forme vos équipes pour qu'elles se l'approprient rapidement et nous itérons jusqu'à ce que ce Notion soit parfait.",
    },
  ],
};

export const caseStudies = {
  title:
    "Ils avaient aussi une organisation chaotique.\nVoilà comment on a rendu leurs équipes plus efficaces ↓",
  // [À AFFINER] — verbatims témoignages (nom, rôle, entreprise, 1–2 phrases)
  // ou branchement Notion. Placeholders neutres en attendant.
  testimonials: [
    {
      quote:
        "On a enfin arrêté de chercher l’information. Tout est au même endroit, et l’équipe s’en sert vraiment.",
      name: "Prénom Nom",
      role: "Dirigeant·e",
      company: "Entreprise",
    },
    {
      quote:
        "Notre ancien Notion était devenu illisible. Théo a tout simplifié — on a gagné en clarté et en temps.",
      name: "Prénom Nom",
      role: "Directeur·rice des opérations",
      company: "Entreprise",
    },
    {
      quote:
        "L’onboarding d’un nouvel arrivant se fait maintenant en quelques jours. C’est un vrai changement.",
      name: "Prénom Nom",
      role: "Fondateur·rice",
      company: "Entreprise",
    },
  ],
};

export const about = {
  name: "Qui suis-je ?",
  // Bio rendue avec des liens LinkedIn/YouTube intégrés dans la 2ᵉ phrase
  // (cf. About.tsx). Le texte plein est conservé ici pour le SEO / repli.
  bio: [
    "Je suis Théo Gouman, consultant Notion multi-certifié.",
    "Depuis 2022, je crée du contenu sur LinkedIn et YouTube au sujet de Notion.",
    "C'est ce qui m'a amené à accompagner +100 TPE / PME à implémenter cet outil dans leur organisation pour qu'elles gagnent en efficacité.",
  ],
  // Badges de certification Notion (images dans public/images/Annexes).
  // `label` = intitulé exact de la certification, affiché en tooltip au survol.
  certifications: [
    { src: "/images/Annexes/Essentials Badge.png", label: "Notion Academy Essentials" },
    { src: "/images/Annexes/Workflow Badge.png", label: "Notion Academy Workflows" },
    { src: "/images/Annexes/Advanced Badge.png", label: "Notion Academy Advanced" },
    { src: "/images/Annexes/Admin Badge.png", label: "Notion Certified Admin" },
    { src: "/images/Annexes/AI Badge.png", label: "Notion Academy AI" },
  ] as { src: string; label: string }[],
  // [À AFFINER] — inclure YouTube / newsletter comme preuve, ou non.
  socialProof: [] as { label: string; href: string }[],
};

export const faq = {
  eyebrow: "Questions fréquentes",
  title: "Ce qu’on me demande le plus souvent.",
  // [À AFFINER] — réponses à valider. Rédigées dans la voix de Théo en attendant.
  items: [
    {
      q: "Combien de temps prend un accompagnement ?",
      a: "Cela dépend de la taille de votre équipe et du périmètre. La plupart des accompagnements se déroulent sur quelques semaines, entre l’audit et la livraison clé en main. On cadre la durée précise ensemble lors de l’appel de qualification.",
    },
    {
      q: "Comment se passe le budget ?",
      a: "Il n’y a pas de grille publique : le budget se cadre en appel, une fois votre situation et vos enjeux compris. Vous saurez exactement à quoi vous vous engagez avant de démarrer, sans surprise.",
    },
    {
      q: "Qu’attendez-vous de mon équipe ?",
      a: "Quelques heures, réparties sur l’accompagnement : un peu de temps en audit pour comprendre votre fonctionnement, et une session de prise en main à la livraison. L’essentiel du travail de construction, c’est moi qui le porte.",
    },
    {
      q: "On a déjà un Notion mais c’est le bazar — vous faites quoi ?",
      a: "C’est l’un des deux points de départ les plus fréquents. Je pars de l’existant, j’identifie ce qui sert vraiment, je simplifie et je supprime ce qui encombre. L’objectif n’est pas d’ajouter, c’est de rendre votre Notion à nouveau lisible et utilisé.",
    },
    {
      q: "En quoi c’est différent d’un template ou d’une formation Notion ?",
      a: "Un template est générique et vous laisse seul face à l’installation. Une formation vous apprend l’outil. Moi, je construis votre organisation sur mesure, à partir de vos enjeux, et je vous la livre prête à l’emploi. Vos équipes connaissent déjà Notion — ce qu’elles s’approprient, c’est votre structure.",
    },
    {
      q: "Vous travaillez à distance ou sur site ?",
      a: "Principalement à distance, ce qui n’enlève rien à la qualité du suivi. Un déplacement sur site reste possible selon votre situation — on en parle lors de l’appel.",
    },
  ],
};

export const finalCta = {
  // En-tête du booker EMBARQUÉ dans la page (section « rendez-vous »).
  // Ce copywriting est propre à cette section : il n'est PAS repris dans le
  // modal de réservation, qui garde son en-tête par défaut.
  bookingHeading: {
    title: "Faisons un point sur votre organisation",
    subtitle:
      "1h pour faire un audit de votre organisation et déterminer si Notion est pertinent pour vous",
  },
};

export const footer = {
  name: "Théo Gouman",
  avatar: "/images/Annexes/theo-gouman-avatar.png",
  tagline: "Consultant Notion pour les TPE et PME depuis 2022",
  operatedBy: "Opéré par l'entreprise EURL Gouman Operates",
  siren: "SIREN : 100 120 609",
  domain: "consultant-notion.fr",
  socials: [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/theogouman/",
      icon: "/images/Annexes/linkedin-dark.svg",
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/theo.gouman/",
      icon: "/images/Annexes/instagram-dark.svg",
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@ThéoGouman?sub_confirmation=1",
      icon: "/images/Annexes/youtube-icon.svg",
    },
  ],
};
