import type { GameEventDefinition } from "@/game/types";

import { makeScenario, type ScenarioSeed } from "./factory";

const worldSeeds: ScenarioSeed[] = [
  {
    id: "world_economic_slowdown",
    title: "L’activité ralentit soudainement",
    category: "world",
    summary:
      "Un indicateur économique entièrement fictif signale un ralentissement plus marqué que prévu. Tous les candidats doivent adapter leur discours sans disposer encore d’un diagnostic définitif.",
    prudent: "Présenter des mesures temporaires et révisables",
    bold: "Annoncer un plan massif de relance immédiate",
    collective: "Proposer une conférence économique pluraliste",
    successEffects: [
      { kind: "party_stat", stat: "credibility", delta: 4, label: "Crédibilité économique +4" },
      { kind: "world", stat: "economicClimate", delta: -5, visibility: "hidden" },
    ],
    setbackEffects: [
      { kind: "party_stat", stat: "credibility", delta: -4, label: "Crédibilité −4" },
      { kind: "world", stat: "economicClimate", delta: -7, visibility: "hidden" },
    ],
    setFlagsOnBold: { crisis_responsibility: true },
  },
  {
    id: "world_national_strike",
    title: "La grève s’étend au pays",
    category: "world",
    summary:
      "Une grève nationale fictive touche transports et services essentiels. Le mouvement reste pacifique, mais chaque camp attend que vous choisissiez entre soutien, médiation et fermeté.",
    prudent: "Appeler à une médiation avec calendrier public",
    bold: "Soutenir entièrement l’un des deux camps",
    collective: "Réunir syndicats et employeurs fictifs",
    successEffects: [
      { kind: "party_stat", stat: "popularity", delta: 2, label: "Popularité +2" },
      { kind: "world", stat: "socialTension", delta: -3, visibility: "hidden" },
    ],
    setbackEffects: [
      { kind: "party_stat", stat: "rejection", delta: 3, label: "Rejet +3" },
      { kind: "world", stat: "socialTension", delta: 7, visibility: "hidden" },
    ],
    setFlagsOnBold: { social_confrontation: true },
  },
  {
    id: "world_floods",
    title: "Des crues bouleversent la campagne",
    category: "world",
    summary:
      "Des inondations fictives touchent plusieurs communes sans description graphique. Les secours demandent de ne pas gêner leur travail, tandis que les habitants attendent des engagements de reconstruction.",
    prudent: "Suspendre la campagne locale et soutenir les secours",
    bold: "Se rendre rapidement sur place avec une petite équipe",
    collective: "Mobiliser les antennes pour une aide coordonnée",
    successEffects: [
      { kind: "party_stat", stat: "credibility", delta: 3, label: "Sens des responsabilités +3" },
      { kind: "world", stat: "climateConcern", delta: 7, visibility: "hidden" },
    ],
    setbackEffects: [
      { kind: "party_stat", stat: "popularity", delta: -3, label: "Popularité −3" },
      { kind: "world", stat: "climateConcern", delta: 5, visibility: "hidden" },
    ],
  },
  {
    id: "world_security_attack",
    title: "Une attaque endeuille le pays",
    category: "world",
    summary:
      "Un attentat fictif, évoqué sans aucun détail graphique, interrompt la campagne. Les autorités demandent retenue et unité pendant que l’enquête suit son cours.",
    prudent: "Suspendre toute polémique et respecter le temps national",
    bold: "Présenter rapidement une réponse sécuritaire complète",
    collective: "Participer à une déclaration républicaine commune",
    successEffects: [
      { kind: "party_stat", stat: "credibility", delta: 3, label: "Stature +3" },
      { kind: "world", stat: "securityConcern", delta: 12, visibility: "hidden" },
    ],
    setbackEffects: [
      { kind: "party_stat", stat: "rejection", delta: 5, label: "Rejet +5" },
      { kind: "world", stat: "securityConcern", delta: 12, visibility: "hidden" },
    ],
    sensitiveActorIds: ["fictional_campaign_manager"],
    sensitiveTags: ["violence"],
    setFlagsOnBold: { security_exception: true },
  },
  {
    id: "world_international_crisis",
    title: "Une crise éclate en Europe",
    category: "world",
    summary:
      "Une crise diplomatique fictive entre États imaginaires met à l’épreuve les alliances européennes. Aucun affrontement n’est décrit ; la question porte sur coordination, sanctions et autonomie.",
    prudent: "Soutenir une réponse européenne graduée",
    bold: "Proposer une initiative française unilatérale",
    collective: "Réunir publiquement les candidats sur une position commune",
    topic: "Europe",
    setFlagsOnBold: { crisis_responsibility: true },
  },
  {
    id: "world_energy_price_spike",
    title: "Le prix de l’énergie bondit",
    category: "world",
    summary:
      "Dans le scénario fictif, une rupture d’approvisionnement fait grimper brutalement les prix de l’énergie. Ménages et entreprises demandent une protection dès les prochaines factures.",
    prudent: "Cibler une aide temporaire sur les plus exposés",
    bold: "Bloquer nationalement les prix pendant six mois",
    collective: "Négocier un mécanisme commun avec les partenaires européens",
    topic: "énergie",
  },
  {
    id: "world_heatwave",
    title: "La canicule change tous les agendas",
    category: "world",
    summary:
      "Une canicule fictive conduit plusieurs villes à annuler les rassemblements extérieurs. La campagne doit protéger publics et équipes sans disparaître d’une actualité dominée par l’adaptation.",
    prudent: "Annuler les meetings et publier des mesures pratiques",
    bold: "Transformer la tournée en campagne d’adaptation",
    collective: "Mettre les réseaux militants au service des communes",
    successEffects: [
      { kind: "party_stat", stat: "credibility", delta: 2, label: "Responsabilité +2" },
      { kind: "world", stat: "climateConcern", delta: 9, visibility: "hidden" },
    ],
    setbackEffects: [
      { kind: "party_stat", stat: "mobilization", delta: -3, label: "Mobilisation −3" },
      { kind: "world", stat: "climateConcern", delta: 9, visibility: "hidden" },
    ],
  },
  {
    id: "world_public_service_outage",
    title: "Une panne bloque les démarches",
    category: "world",
    summary:
      "Une panne informatique fictive paralyse plusieurs services administratifs pendant une journée. La situation se rétablit progressivement, mais nourrit le débat sur la modernisation et la résilience.",
    prudent: "Proposer un audit de résilience et des guichets de secours",
    bold: "Annoncer une refonte numérique complète de l’État",
    collective: "Associer agents et usagers au plan de continuité",
    topic: "services publics",
  },
  {
    id: "world_industrial_closure",
    title: "Un grand site menace de fermer",
    category: "world",
    summary:
      "Un groupe industriel entièrement fictif envisage de fermer un site important. Les salariés demandent une intervention tandis que la direction invoque des pertes et une transition technologique.",
    prudent: "Conditionner une aide à un projet industriel vérifié",
    bold: "Proposer une prise de contrôle publique temporaire",
    collective: "Construire une reprise avec salariés et territoire",
    topic: "économie",
  },
  {
    id: "world_housing_protest",
    title: "Le logement déclenche une mobilisation",
    category: "world",
    summary:
      "Une mobilisation nationale fictive réunit locataires, étudiants et maires face au manque de logements accessibles. Les solutions opposent construction, régulation et soutien financier.",
    prudent: "Cibler la construction dans les zones les plus tendues",
    bold: "Geler temporairement certains loyers au niveau national",
    collective: "Négocier un pacte avec villes et bailleurs",
    topic: "logement",
  },
  {
    id: "world_european_vote",
    title: "Un vote européen vous divise",
    category: "world",
    summary:
      "Le Parlement européen fictif adopte de justesse un texte qui partage votre mouvement. Soutenir, rejeter ou demander une renégociation affectera plusieurs blocs électoraux à la fois.",
    prudent: "Expliquer les avancées et les réserves du texte",
    bold: "Rompre avec la ligne de votre famille européenne",
    collective: "Consulter les adhérents avant la position finale",
    topic: "Europe",
  },
  {
    id: "world_budget_warning",
    title: "Les comptes publics se dégradent",
    category: "world",
    summary:
      "Une projection budgétaire fictive réduit les marges de manœuvre du futur gouvernement. Chaque candidat doit préciser quelles promesses sont prioritaires et lesquelles dépendront de la conjoncture.",
    prudent: "Hiérarchiser les promesses avec une clause de revue",
    bold: "Maintenir tout le programme et changer de financement",
    collective: "Créer un conseil budgétaire pluraliste dès l’élection",
    topic: "fiscalité",
  },
];

const rareSeeds: ScenarioSeed[] = [
  {
    id: "rare_printer_slogan",
    title: "L’imprimante invente votre slogan",
    category: "rare",
    summary:
      "Une imprimante défaillante fusionne deux slogans en une formule absurde mais étonnamment mémorable. Des militants la photographient avant que l’équipe puisse retirer les affiches.",
    prudent: "Retirer les affiches et conserver le slogan officiel",
    bold: "Adopter avec humour la formule accidentelle",
    rarity: "rare",
    baseWeight: 1.2,
    setFlagsOnBold: { viral_monarchy_slogan: true },
  },
  {
    id: "rare_hologram_revolt",
    title: "L’hologramme refuse votre discours",
    category: "rare",
    summary:
      "Lors d’un meeting expérimental, un décalage technique fait répéter à votre hologramme fictif une phrase précédente au milieu du passage suivant. Le public hésite entre panne et satire.",
    prudent: "Couper la projection et poursuivre sur scène",
    bold: "Dialoguer en direct avec votre double décalé",
    rarity: "rare",
    baseWeight: 1,
  },
  {
    id: "rare_parrot_quote",
    title: "Le perroquet répète la mauvaise phrase",
    category: "rare",
    summary:
      "Le perroquet d’un militant fictif répète devant les caméras une formule de préparation qui ne devait jamais sortir du car de campagne. La scène devient immédiatement partageable.",
    prudent: "Rire brièvement puis revenir au message prévu",
    bold: "Faire du perroquet la mascotte d’une journée",
    rarity: "rare",
    baseWeight: 0.9,
  },
  {
    id: "rare_debate_blackout",
    title: "Le studio plonge dans le noir",
    category: "rare",
    summary:
      "Une panne générale fictive interrompt un débat sans danger pour le public. Les micros de secours fonctionnent encore et le modérateur propose de continuer sans prompteur.",
    prudent: "Attendre le retour de la lumière avec les autres",
    bold: "Continuer votre conclusion dans l’obscurité",
    rarity: "rare",
    baseWeight: 1,
    minDecisionIndex: 12,
  },
  {
    id: "rare_crown_petition",
    title: "La couronne devient une pétition",
    category: "rare",
    summary:
      "Uchronie satirique : après le slogan accidentel, une pétition fictive propose de vous nommer gardien symbolique de la République. Le canular gagne un sérieux parfaitement disproportionné.",
    prudent: "Rappeler sobrement votre attachement républicain",
    bold: "Jouer une dernière fois avec le symbole",
    rarity: "secret",
    baseWeight: 0.45,
    eligibility: [{ kind: "flag", key: "viral_monarchy_slogan", equals: true }],
    setFlagsOnBold: { secret_monarchy: true },
    minDecisionIndex: 16,
  },
  {
    id: "rare_exceptional_powers",
    title: "Les garde-fous vacillent",
    category: "rare",
    summary:
      "Uchronie critique : plusieurs propositions d’exception se combinent dans une crise institutionnelle fictive. Juristes et associations alertent sur l’affaiblissement possible des contre-pouvoirs.",
    prudent: "Renoncer aux mesures d’exception et consulter le Parlement",
    bold: "Maintenir le paquet institutionnel sans garantie supplémentaire",
    rarity: "secret",
    baseWeight: 0.35,
    eligibility: [
      { kind: "flag", key: "exceptional_institutions", equals: true },
      { kind: "flag", key: "public_order_escalation", equals: true },
    ],
    setFlagsOnBold: { secret_authoritarian: true },
    minDecisionIndex: 18,
  },
  {
    id: "rare_fragmented_congress",
    title: "Le congrès se fragmente en direct",
    category: "rare",
    summary:
      "Uchronie fictive : après plusieurs frondes, chaque courant annonce sa propre structure pendant le même congrès. Les alliances nationales deviennent presque impossibles à lire.",
    prudent: "Suspendre le congrès et ouvrir une médiation",
    bold: "Assumer la recomposition et lancer votre propre bloc",
    rarity: "secret",
    baseWeight: 0.35,
    eligibility: [{ kind: "flag", key: "fronde_party", equals: true }],
    setFlagsOnBold: { secret_fragmentation: true },
    minDecisionIndex: 18,
  },
  {
    id: "rare_national_union",
    title: "L’appel à l’union nationale",
    category: "rare",
    summary:
      "Uchronie fictive : une crise extérieure et l’absence de majorité conduisent plusieurs adversaires à envisager un gouvernement temporaire commun, strictement encadré dans le temps.",
    prudent: "Soutenir une coordination sans entrer au gouvernement",
    bold: "Proposer une coalition nationale temporaire",
    rarity: "secret",
    baseWeight: 0.35,
    eligibility: [
      { kind: "flag", key: "crisis_responsibility", equals: true },
      { kind: "flag", key: "coalition_open", equals: true },
    ],
    setFlagsOnBold: { secret_national_union: true },
    minDecisionIndex: 19,
  },
  {
    id: "rare_civil_suspension",
    title: "Le scrutin doit être suspendu",
    category: "rare",
    summary:
      "Uchronie fictive et sobre : l’accumulation de tensions sociales et sécuritaires conduit les institutions à envisager un report très encadré, sans détail de violence ni glorification.",
    prudent: "Appeler au calme et défendre le calendrier constitutionnel",
    bold: "Soutenir publiquement une suspension exceptionnelle",
    rarity: "secret",
    baseWeight: 0.25,
    eligibility: [
      { kind: "flag", key: "social_confrontation", equals: true },
      { kind: "flag", key: "security_exception", equals: true },
    ],
    setFlagsOnBold: { secret_civil_unrest: true },
    minDecisionIndex: 20,
  },
];

export const worldEvents: GameEventDefinition[] = [
  ...worldSeeds.map(makeScenario),
  ...rareSeeds.map(makeScenario),
];
