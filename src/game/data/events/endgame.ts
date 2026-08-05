import type { GameEventDefinition } from "@/game/types";

import { makeScenario, type ScenarioSeed } from "./factory";

const runoffSeeds: ScenarioSeed[] = [
  {
    id: "runoff_endorsement_wave",
    title: "Les ralliements arrivent en ordre dispersé",
    category: "between_rounds",
    summary:
      "Plusieurs candidats fictifs éliminés vous soutiennent avec des nuances très différentes. Les afficher ensemble donnerait une image de rassemblement, mais aussi de coalition improvisée.",
    prudent: "Remercier chacun sans modifier immédiatement le programme",
    bold: "Organiser un grand rassemblement avec tous les soutiens",
    collective: "Rédiger une plateforme commune de second tour",
    eligibility: [{ kind: "qualified", value: true }],
  },
  {
    id: "runoff_final_debate",
    title: "Le débat du second tour",
    category: "between_rounds",
    summary:
      "Le duel final avec votre adversaire fictif concentre une année de campagne. Trois thèmes seront abordés et chaque contradiction ancienne peut réapparaître devant une audience massive.",
    prudent: "Préparer des réponses courtes et cohérentes",
    bold: "Chercher une confrontation directe dès l’ouverture",
    collective: "Faire valider la ligne par toute la coalition",
    eligibility: [{ kind: "qualified", value: true }],
  },
  {
    id: "runoff_vote_transfers",
    title: "Les reports résistent aux consignes",
    category: "between_rounds",
    summary:
      "Les électeurs des partis éliminés ne suivent pas mécaniquement leurs dirigeants fictifs. Il faut leur parler sans donner l’impression d’abandonner ceux qui vous ont qualifié.",
    prudent: "Présenter trois garanties destinées aux nouveaux soutiens",
    bold: "Recentrer entièrement le discours pour le second tour",
    collective: "Organiser des réunions avec chaque électorat allié",
    eligibility: [{ kind: "qualified", value: true }],
  },
  {
    id: "runoff_favorite_pressure",
    title: "Le statut de favori pèse",
    category: "between_rounds",
    summary:
      "Un sondage fictif vous place légèrement devant, sans certitude. Votre équipe hésite entre protéger cet avantage et maintenir l’offensive qui a permis la qualification.",
    prudent: "Réduire les risques et rappeler le projet",
    bold: "Continuer à attaquer comme si vous étiez derrière",
    collective: "Partager les rôles entre candidat et alliés",
    eligibility: [{ kind: "qualified", value: true }],
  },
  {
    id: "runoff_common_program",
    title: "La coalition veut un texte commun",
    category: "between_rounds",
    summary:
      "Vos nouveaux soutiens fictifs demandent une annexe au programme sur leurs priorités. Refuser menace la mobilisation ; accepter peut rouvrir toutes vos anciennes déclarations.",
    prudent: "Limiter le texte à une méthode de gouvernement",
    bold: "Intégrer plusieurs mesures nouvelles au programme",
    collective: "Négocier un contrat public et réversible",
    eligibility: [{ kind: "qualified", value: true }],
  },
  {
    id: "runoff_last_hours",
    title: "Les dernières heures de campagne",
    category: "between_rounds",
    summary:
      "La campagne officielle touche à sa fin. Un dernier déplacement peut mobiliser, tandis qu’une intervention mal maîtrisée laisserait très peu de temps pour réagir.",
    prudent: "Conclure par une adresse préparée et apaisée",
    bold: "Improviser un dernier rassemblement surprise",
    collective: "Faire campagne simultanément dans toutes les régions",
    eligibility: [{ kind: "qualified", value: true }],
  },
];

const eliminatedSeeds: ScenarioSeed[] = [
  {
    id: "eliminated_endorse_candidate",
    title: "Votre voix compte encore",
    category: "between_rounds",
    summary:
      "Éliminé du premier tour, vous pouvez soutenir un finaliste fictif. Vos électeurs restent libres et la proximité idéologique ne suffit pas à garantir leur report.",
    prudent: "Donner une consigne argumentée sans négocier de poste",
    bold: "Négocier publiquement un accord avec un finaliste",
    collective: "Consulter les adhérents avant toute consigne",
    eligibility: [{ kind: "qualified", value: false }],
    setFlagsOnBold: { kingmaker: true },
  },
  {
    id: "eliminated_no_instruction",
    title: "Le choix du ni-ni",
    category: "between_rounds",
    summary:
      "Les deux finalistes fictifs sont éloignés de votre ligne sur des sujets différents. Refuser de choisir préserve l’autonomie, mais abandonne une partie du débat de second tour.",
    prudent: "Présenter vos désaccords et laisser le vote libre",
    bold: "Refuser toute discussion avec les finalistes",
    collective: "Publier les critères choisis par les adhérents",
    eligibility: [{ kind: "qualified", value: false }],
  },
  {
    id: "eliminated_future_campaign",
    title: "Préparer déjà la prochaine bataille",
    category: "between_rounds",
    summary:
      "Votre résultat ne permet pas la qualification mais ouvre une perspective locale et parlementaire. Le parti fictif doit choisir entre capitaliser immédiatement ou prendre le temps du bilan.",
    prudent: "Lancer un audit complet avant toute annonce",
    bold: "Annoncer dès ce soir la suite de votre mouvement",
    collective: "Confier la stratégie future aux sections locales",
    eligibility: [{ kind: "qualified", value: false }],
  },
  {
    id: "eliminated_personal_future",
    title: "Votre propre avenir se décide",
    category: "between_rounds",
    summary:
      "Des proches fictifs vous conseillent de rester à la tête, tandis que d’autres souhaitent une relève rapide. Le choix pèsera sur le titre final de cette campagne.",
    prudent: "Rester jusqu’au congrès puis laisser le parti décider",
    bold: "Annoncer votre retrait immédiat de la direction",
    collective: "Organiser une transition ouverte à plusieurs candidats",
    eligibility: [{ kind: "qualified", value: false }],
    setFlagsOnBold: { retired: true },
  },
];

const governmentSeeds: ScenarioSeed[] = [
  {
    id: "government_prime_minister",
    title: "Choisir la tête du gouvernement",
    category: "government",
    summary:
      "Votre victoire fictive exige un premier choix symbolique. Une personnalité loyale, une experte indépendante ou une figure de coalition n’enverront pas le même signal.",
    prudent: "Nommer une personnalité expérimentée et compatible",
    bold: "Choisir une figure indépendante totalement inattendue",
    collective: "Faire proposer un nom par la coalition",
  },
  {
    id: "government_balance",
    title: "Composer une équipe crédible",
    category: "government",
    summary:
      "Les partenaires fictifs réclament représentation, parité, expérience et renouvellement. Le nombre de places est limité et chaque arbitrage annonce déjà votre manière de gouverner.",
    prudent: "Équilibrer compétences, territoires et coalition",
    bold: "Former une équipe très resserrée de nouveaux visages",
    collective: "Négocier publiquement une règle de composition",
  },
  {
    id: "government_first_address",
    title: "La première adresse au pays",
    category: "government",
    summary:
      "Le discours de victoire est terminé ; vient maintenant la première parole d’exercice du pouvoir fictif. Il faut choisir entre urgence, rassemblement et calendrier concret.",
    prudent: "Annoncer trois priorités et un calendrier réaliste",
    bold: "Promettre une transformation dès les cent premiers jours",
    collective: "Associer la coalition à une déclaration commune",
  },
  {
    id: "government_ministry_conflict",
    title: "Deux alliés veulent le même ministère",
    category: "government",
    summary:
      "Deux soutiens fictifs majeurs revendiquent le même portefeuille. Donner raison à l’un peut fragiliser l’autre avant même la première réunion du gouvernement.",
    prudent: "Choisir selon l’expérience et proposer un autre rôle",
    bold: "Écarter les deux et nommer une personnalité tierce",
    collective: "Redéfinir les portefeuilles avec toute la coalition",
  },
];

export const endgameEvents: GameEventDefinition[] = [
  ...runoffSeeds.map(makeScenario),
  ...eliminatedSeeds.map(makeScenario),
  ...governmentSeeds.map(makeScenario),
];
