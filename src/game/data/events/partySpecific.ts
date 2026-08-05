import type { GameEventDefinition } from "@/game/types";

import { makeScenario } from "./factory";

interface PartyEventConfig {
  id: string;
  name: string;
  shortName: string;
  identityIssue: string;
  crisisCause: string;
  partnerId: string;
  partnerLabel: string;
  allianceTerms: string;
  signatureIssue: string;
  topic: string;
  localAsset: string;
}

const configs: PartyEventConfig[] = [
  {
    id: "lfi",
    name: "La France insoumise",
    shortName: "LFI",
    identityIssue:
      "l’équilibre entre mouvement de rupture, élargissement populaire et place des partenaires de gauche provoque un débat stratégique",
    crisisCause:
      "des cadres fictifs reprochent au siège une campagne trop centralisée et demandent davantage d’autonomie thématique",
    partnerId: "ecologistes",
    partnerLabel: "Les Écologistes",
    allianceTerms:
      "une plateforme sociale et écologique ainsi que des règles communes pour le second tour",
    signatureIssue: "la réforme des institutions et la planification écologique",
    topic: "institutions",
    localAsset: "les groupes d’action très mobilisés dans plusieurs métropoles",
  },
  {
    id: "ps",
    name: "le Parti socialiste",
    shortName: "PS",
    identityIssue:
      "la synthèse entre ancrage social-démocrate, union de la gauche et autonomie présidentielle reste contestée",
    crisisCause:
      "une coalition de fédérations fictives juge que les élus locaux ne sont pas assez associés aux décisions nationales",
    partnerId: "ecologistes",
    partnerLabel: "Les Écologistes",
    allianceTerms: "des candidatures communes et un calendrier partagé de réformes sociales",
    signatureIssue: "la reconstruction des services publics et la justice fiscale",
    topic: "services publics",
    localAsset: "un réseau d’élus locaux capable d’organiser une tournée dense",
  },
  {
    id: "ecologistes",
    name: "Les Écologistes",
    shortName: "ÉCO",
    identityIssue:
      "la tension entre candidature autonome, rassemblement progressiste et urgence climatique traverse les instances",
    crisisCause:
      "deux sensibilités fictives s’opposent sur la place de la décroissance et menacent de présenter des textes concurrents",
    partnerId: "ps",
    partnerLabel: "le Parti socialiste",
    allianceTerms: "une priorité climatique contraignante et des investitures équilibrées",
    signatureIssue: "l’adaptation climatique et la transformation du modèle énergétique",
    topic: "écologie",
    localAsset: "des municipalités écologistes fictives prêtes à présenter leurs réalisations",
  },
  {
    id: "renaissance",
    name: "Renaissance",
    shortName: "REN",
    identityIssue:
      "l’héritage du pouvoir sortant et la volonté d’incarner un nouveau cycle tirent la campagne dans deux directions",
    crisisCause:
      "plusieurs cadres fictifs veulent une rupture plus nette avec le bilan tandis que d’autres défendent la continuité",
    partnerId: "horizons",
    partnerLabel: "Horizons",
    allianceTerms:
      "une candidature de coalition, une ligne européenne et un partage des responsabilités",
    signatureIssue: "l’investissement, l’Europe et la modernisation des services publics",
    topic: "Europe",
    localAsset:
      "des parlementaires et anciens ministres fictifs capables de crédibiliser le projet",
  },
  {
    id: "horizons",
    name: "Horizons",
    shortName: "HOR",
    identityIssue:
      "l’autonomie du parti face au bloc central doit devenir visible sans fermer la porte à une coalition",
    crisisCause:
      "des maires fictifs redoutent que la campagne nationale efface la promesse de décentralisation du mouvement",
    partnerId: "renaissance",
    partnerLabel: "Renaissance",
    allianceTerms: "un accord de gouvernement fondé sur le temps long et l’autonomie locale",
    signatureIssue: "la planification de long terme et la décentralisation",
    topic: "institutions",
    localAsset: "un réseau municipal fictif particulièrement organisé dans l’Ouest",
  },
  {
    id: "lr",
    name: "Les Républicains",
    shortName: "LR",
    identityIssue:
      "la ligne entre droite de gouvernement, concurrence nationale et renouvellement des cadres reste difficile à stabiliser",
    crisisCause:
      "une aile fictive exige une union plus large à droite tandis qu’une autre refuse tout accord avant le premier tour",
    partnerId: "nouvelle_energie",
    partnerLabel: "Nouvelle Énergie",
    allianceTerms: "un socle économique commun, l’autorité publique et une primaire de coalition",
    signatureIssue: "la maîtrise de la dépense et le rétablissement de l’autorité",
    topic: "sécurité",
    localAsset: "un maillage d’élus locaux capable de sécuriser la campagne",
  },
  {
    id: "rn",
    name: "le Rassemblement national",
    shortName: "RN",
    identityIssue:
      "la stratégie de normalisation et la pression d’un discours plus radical créent un arbitrage permanent",
    crisisCause:
      "des cadres fictifs proches de l’UDR souhaitent peser davantage sur le programme économique et les investitures",
    partnerId: "reconquete",
    partnerLabel: "Reconquête",
    allianceTerms: "des désistements réciproques et une répartition claire des priorités",
    signatureIssue: "l’immigration, le pouvoir d’achat et la crédibilité de gouvernement",
    topic: "immigration",
    localAsset: "un socle militant dense dans le Nord et l’Est",
  },
  {
    id: "reconquete",
    name: "Reconquête",
    shortName: "REC",
    identityIssue:
      "la fidélité à une ligne très identitaire se heurte au besoin d’élargir un socle soumis au vote utile",
    crisisCause:
      "plusieurs cadres fictifs veulent négocier tôt avec le Rassemblement national alors que la direction privilégie l’autonomie",
    partnerId: "rn",
    partnerLabel: "le Rassemblement national",
    allianceTerms:
      "une stratégie de désistements et la conservation de marqueurs programmatiques propres",
    signatureIssue: "l’identité, l’immigration et la bataille culturelle",
    topic: "immigration",
    localAsset: "des militants numériques capables de rendre une séquence très visible",
  },
  {
    id: "nouvelle_energie",
    name: "Nouvelle Énergie",
    shortName: "NE",
    identityIssue:
      "le mouvement doit choisir entre aventure présidentielle autonome et rôle d’aiguillon libéral de la droite",
    crisisCause:
      "des responsables fictifs craignent que le manque de notoriété transforme la candidature en simple témoignage",
    partnerId: "lr",
    partnerLabel: "Les Républicains",
    allianceTerms:
      "une plateforme de décentralisation, d’économies et une procédure commune de désignation",
    signatureIssue: "la simplification économique, l’éducation et la décentralisation",
    topic: "économie",
    localAsset: "des entrepreneurs et maires fictifs prêts à ouvrir leurs réseaux",
  },
];

function buildPartyEvents(config: PartyEventConfig): GameEventDefinition[] {
  const crisisId = `party_${config.id}_crisis_followup`;
  const identity = makeScenario({
    id: `party_${config.id}_identity`,
    title: `${config.shortName} cherche sa ligne commune`,
    category: "party",
    summary: `Au sein de ${config.name}, ${config.identityIssue}. Le candidat fictif doit donner une direction compréhensible sans transformer le débat interne en jugement moral.`,
    prudent: "Clarifier deux priorités sans exclure les sensibilités",
    bold: "Imposer une ligne unique jusqu’au premier tour",
    collective: "Faire voter une feuille de route par les adhérents",
    eligibleParties: [config.id],
  });

  const fronde = makeScenario({
    id: `party_${config.id}_fronde`,
    title: `Une fronde grandit chez ${config.shortName}`,
    category: "party",
    summary: `Dans ${config.name}, ${config.crisisCause}. La contestation concerne uniquement des personnages fictifs et peut encore rester une discussion organisée.`,
    prudent: "Recevoir les contestataires et fixer des garanties",
    bold: "Menacer les meneurs fictifs d’exclusion",
    collective: "Convoquer un conseil national extraordinaire",
    eligibleParties: [config.id],
    enqueueOnBold: [crisisId],
    setFlagsOnBold: { [`party_crisis_started_${config.id}`]: true, fronde_party: true },
    minDecisionIndex: 5,
  });

  const alliance = makeScenario({
    id: `party_${config.id}_alliance`,
    title: `Une alliance divise ${config.shortName}`,
    category: "party",
    summary: `${config.partnerLabel} propose à ${config.name} ${config.allianceTerms}. L’accord pourrait élargir la campagne, mais chaque concession sera relue à travers vos déclarations précédentes.`,
    prudent: "Négocier un soutien mutuel sans fusionner les programmes",
    bold: `Conclure immédiatement un accord avec ${config.partnerLabel}`,
    collective: "Soumettre les termes aux adhérents des deux mouvements",
    eligibleParties: [config.id],
    successEffects: [
      {
        kind: "alliance",
        partyId: "player",
        withPartyId: config.partnerId,
        action: "add",
        label: `Alliance avec ${config.partnerLabel}`,
      },
      { kind: "hidden_stat", stat: "transferability", delta: 5, visibility: "hidden" },
    ],
    setbackEffects: [
      { kind: "party_stat", stat: "cohesion", delta: -5, label: "Cohésion −5" },
      { kind: "hidden_stat", stat: "consistency", delta: -4, visibility: "hidden" },
    ],
    minDecisionIndex: 7,
  });

  const signature = makeScenario({
    id: `party_${config.id}_signature`,
    title: `Le marqueur programmatique de ${config.shortName}`,
    category: "party",
    summary: `Les équipes fictives de ${config.name} veulent remettre ${config.signatureIssue} au centre. Le choix doit distinguer la candidature sans réduire tout le projet à ce seul thème.`,
    prudent: "Relier ce marqueur à deux mesures déjà financées",
    bold: "En faire le cœur exclusif de la dernière ligne droite",
    collective: "Construire une convention publique autour du thème",
    eligibleParties: [config.id],
    topic: config.topic,
  });

  const local = makeScenario({
    id: `party_${config.id}_local_asset`,
    title: `Le réseau de ${config.shortName} s’active`,
    category: "party",
    summary: `La campagne peut s’appuyer sur ${config.localAsset}. Le siège doit choisir entre contrôler étroitement cette force ou accepter qu’elle adapte le message aux réalités locales.`,
    prudent: "Coordonner le réseau avec un kit national précis",
    bold: "Lancer une opération locale sans validation du siège",
    collective: "Faire remonter chaque initiative dans un tableau commun",
    eligibleParties: [config.id],
  });

  const crisis = makeScenario({
    id: crisisId,
    title: `La crise de ${config.shortName} éclate`,
    category: "party",
    summary: `La fronde fictive au sein de ${config.name} revient avec un ultimatum : changer la direction de campagne ou risquer une dissidence. Une médiation reste possible, mais le temps manque.`,
    prudent: "Accorder une représentation sans céder la direction",
    bold: "Refuser l’ultimatum et provoquer le vote",
    collective: "Nommer une médiation composée de plusieurs courants",
    eligibleParties: [config.id],
    eligibility: [{ kind: "flag", key: `party_crisis_started_${config.id}`, equals: true }],
    minDecisionIndex: 8,
  });
  const boldSetback = crisis.choices
    .find((choice) => choice.id === "risk_breakthrough")
    ?.outcomeGroups.find((outcome) => outcome.id === "risk_setback");
  if (boldSetback) {
    boldSetback.effects.push({
      kind: "party_split",
      partyId: "player",
      label: "Une dissidence fictive quitte le mouvement",
    });
  }

  return [identity, fronde, alliance, signature, local, crisis];
}

export const partySpecificEvents: GameEventDefinition[] = configs.flatMap(buildPartyEvents);
