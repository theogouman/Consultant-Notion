/**
 * Contenu éditorial de la landing (copy intégré tel quel depuis le brief).
 * Les zones [À AFFINER] sont marquées TODO et regroupées ici pour être
 * complétées sans toucher aux composants.
 */

export const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL || "https://cal.com/theo-gouman";

/** Ancre du formulaire de qualification — cible unique de tous les CTA. */
export const CTA_HREF = "#rendez-vous";
export const CTA_LABEL = "Faire le point sur mon organisation";

export const hero = {
  title: ["Un Notion qui fait moins.", "Pour faire mieux."],
  subtitle:
    "Consultant Notion pour TPE et PME. Que vous partiez d’outils éparpillés ou d’un Notion devenu illisible, je construis à partir de vos enjeux — pas d’un template — une organisation claire, livrée clé en main.",
  cta: "Faire le point sur mon organisation",
  microProof: "+100 entreprises accompagnées · certifications Notion · depuis 2022",
};

export const proof = {
  stat: "+100 entreprises accompagnées",
  // [À AFFINER] — liste des logos clients autorisés (noms ou fichiers).
  logos: [
    "Logo client",
    "Logo client",
    "Logo client",
    "Logo client",
    "Logo client",
    "Logo client",
  ] as string[],
};

export const problemMirror = {
  eyebrow: "Le miroir",
  title: "Vous vous reconnaissez ?",
  items: [
    "L’information existe, mais chacun la range à sa façon — la retrouver prend du temps.",
    "Vos outils se multiplient (drive, mails, tableurs, messagerie) et plus rien n’est vraiment centralisé.",
    "Vous pilotez votre activité à l’instinct, faute d’une vue claire sur les projets et les priorités.",
    "Vous avez lancé un Notion, puis il s’est transformé en bazar que plus personne ne maintient.",
    "Un nouveau collaborateur met des semaines à comprendre où trouver quoi.",
  ],
};

export const reframe = {
  eyebrow: "Le vrai problème",
  title:
    "Le problème n’est presque jamais l’outil. C’est ce qu’on lui demande de porter.",
  paragraphs: [
    "Deux situations, une même cause. Soit votre information est éparpillée entre le drive, les mails, les tableurs et trois applications — et personne n’a de vue d’ensemble. Soit vous avez déjà un Notion, mais à force d’empiler bases, templates et modules, il est devenu illisible.",
    "Dans les deux cas, le réflexe est d’ajouter. Un outil, une page, une automatisation de plus. Et la charge monte au lieu de baisser.",
    "Je fais l’inverse. Je pars de vos enjeux — ce qui doit vraiment être suivi, décidé, partagé — et je construis le système le plus simple qui y répond. Moins d’outils, moins de bases, moins d’endroits où l’information se perd.",
  ],
  highlight:
    "Faire moins, pour faire mieux. C’est ce qui fait qu’une organisation est encore utilisée douze mois plus tard, au lieu d’être abandonnée.",
};

export const benefits = {
  eyebrow: "Ce que vous obtenez",
  title: "Une organisation qui tient — et que votre équipe utilise vraiment.",
  items: [
    {
      title: "Une source unique de vérité.",
      body: "L’information à jour, au même endroit, accessible à toute l’équipe. Fini l’archéologie dans les mails et les drives.",
    },
    {
      title: "De la visibilité sur votre activité.",
      body: "Une vue claire sur vos projets, vos priorités et ce qui avance. Vous pilotez sur des repères fiables, plus à l’instinct.",
    },
    {
      title: "Une équipe qui adopte vraiment.",
      body: "Un système assez simple pour être utilisé au quotidien — pas un outil de plus qu’on abandonne au bout de trois mois.",
    },
    {
      title: "Un système qui tient dans le temps.",
      body: "Construit sur vos enjeux, il évolue avec vous et permet à un nouveau collaborateur d’être opérationnel en quelques jours, pas en quelques semaines.",
    },
  ],
};

export const howItWorks = {
  eyebrow: "Comment ça se passe",
  title: "Quatre étapes, du premier appel à la prise en main.",
  steps: [
    {
      title: "Appel de qualification.",
      body: "20 minutes, gratuit. On regarde votre situation ensemble et je vous dis franchement si je peux vous apporter de la valeur. Si ce n’est pas le cas, je vous le dis.",
    },
    {
      title: "Audit de votre organisation.",
      body: "J’analyse en détail votre fonctionnement actuel — vos outils, vos process, votre Notion s’il en existe un — pour identifier ce qui doit être structuré, simplifié ou supprimé.",
    },
    {
      title: "Construction clé en main.",
      body: "Je conçois et je livre votre espace Notion, taillé sur vos enjeux. Vous n’avez rien à bricoler : vous récupérez un système prêt à l’emploi.",
    },
    {
      title: "Prise en main.",
      body: "Une session avec vos équipes pour s’approprier la nouvelle organisation. Ce n’est pas une formation Notion — vos équipes connaissent déjà l’outil — c’est la prise en main de votre structure, pour que chacun sache où travailler dès le premier jour.",
    },
  ],
};

export const caseStudies = {
  eyebrow: "Preuve",
  title: "Des organisations construites sur mesure.",
  subtitle:
    "Chaque accompagnement part des enjeux de l’entreprise. Filtrez par secteur, ouvrez un cas pour voir le détail.",
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

export const forWhom = {
  eyebrow: "À qui c’est fait",
  title: "Pour qui c’est fait — et pour qui ça ne l’est pas.",
  forYou: {
    title: "C’est pour vous si",
    items: [
      "Vous dirigez une TPE ou une PME et votre organisation vous coûte du temps chaque semaine.",
      "Vous voulez un système que votre équipe utilise vraiment, pas un outil de plus.",
      "Vous préférez qu’on parte de vos enjeux plutôt que d’un template générique.",
    ],
  },
  notForYou: {
    title: "Ce n’est pas pour vous si",
    items: [
      "Vous cherchez un template à télécharger et à installer seul.",
      "Vous voulez le Notion le plus complexe possible, avec toutes les fonctionnalités.",
      "Vous n’êtes pas prêt à impliquer votre équipe une poignée d’heures dans le projet.",
    ],
  },
};

export const about = {
  eyebrow: "Qui je suis",
  name: "Théo Gouman",
  headline: "Consultant Notion. +100 entreprises accompagnées depuis 2022.",
  // [À AFFINER] — bio 3–4 phrases, voix de Théo, angle « faire moins pour mieux faire ».
  bio: [
    "Je suis Théo Gouman, consultant Notion indépendant. Depuis 2022, j’ai accompagné plus de 100 entreprises à structurer leur organisation autour d’un principe simple : faire moins, pour faire mieux.",
    "Mon travail ne commence pas par Notion, il commence par vos enjeux. Ce qui doit être suivi, décidé, partagé — et tout ce qui, au contraire, encombre plus qu’il n’aide. Je construis ensuite le système le plus simple qui y répond.",
    "Le vrai test d’une organisation, ce n’est pas le jour de la livraison : c’est douze mois plus tard, quand l’équipe l’utilise encore.",
  ],
  // [À AFFINER] — certifications Notion exactes à afficher.
  certifications: ["Notion Certified Consultant", "Notion Certified"] as string[],
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
  eyebrow: "Prochaine étape",
  title: "Faisons le point sur votre organisation.",
  reassurance:
    "20 minutes, gratuit, sans engagement. Je vous dis franchement si je peux vous aider.",
};

export const footer = {
  name: "Théo Gouman",
  tagline: "Consultant Notion pour TPE et PME.",
  domain: "consultant-notion.fr",
};
