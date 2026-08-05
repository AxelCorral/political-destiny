import type { GameEventDefinition } from "@/game/types";

import { makeScenario, type ScenarioSeed } from "./factory";

const internalSeeds: ScenarioSeed[] = [
  {
    id: "internal_nomination_rules",
    title: "La désignation laisse des traces",
    category: "internal",
    summary:
      "Plusieurs cadres fictifs contestent encore les règles qui ont conduit à votre candidature. Leur critique reste interne, mais une réunion décisive peut refermer ou élargir la fracture.",
    prudent: "Réunir les contestataires autour de garanties précises",
    bold: "Imposer une direction resserrée jusqu’au scrutin",
    collective: "Faire voter une charte commune de campagne",
    maxDecisionIndex: 10,
  },
  {
    id: "internal_congress_motion",
    title: "Une motion circule au congrès",
    category: "internal",
    summary:
      "Un texte fictif demande de modifier deux orientations de campagne et recueille des signatures inattendues. L’ignorer préserverait votre agenda, mais renforcerait ses promoteurs.",
    prudent: "Négocier séparément sur les deux orientations",
    bold: "Mettre immédiatement la motion au vote",
    collective: "Organiser une convention avec amendements ouverts",
  },
  {
    id: "internal_rival_interview",
    title: "Un rival parle trop librement",
    category: "internal",
    summary:
      "Un cadre fictif ambitieux accorde une interview où il soutient votre candidature tout en détaillant ce qu’il ferait différemment. Les militants y lisent déjà un positionnement pour l’après.",
    prudent: "Le rappeler à la discipline sans sanction publique",
    bold: "L’écarter immédiatement de l’équipe nationale",
    collective: "L’inviter à défendre sa proposition en réunion",
  },
  {
    id: "internal_staff_fatigue",
    title: "L’équipe arrive à saturation",
    category: "internal",
    summary:
      "Les déplacements s’enchaînent et plusieurs salariés fictifs de campagne signalent une fatigue sérieuse. Ralentir coûte du temps médiatique ; continuer augmente les erreurs et les départs.",
    prudent: "Annuler deux étapes et réorganiser les rotations",
    bold: "Maintenir le rythme avec une nouvelle équipe",
    collective: "Laisser chaque pôle revoir son calendrier",
  },
  {
    id: "internal_local_sections",
    title: "Les sections réclament leur autonomie",
    category: "internal",
    summary:
      "Les équipes locales jugent les consignes nationales trop rigides pour leurs territoires. Le siège craint qu’une liberté accrue ne transforme la campagne en plusieurs messages incompatibles.",
    prudent: "Autoriser des adaptations dans un cadre écrit",
    bold: "Laisser chaque section inventer sa campagne",
    collective: "Créer un conseil hebdomadaire des territoires",
  },
  {
    id: "internal_financial_review",
    title: "Les comptes exigent un audit",
    category: "internal",
    summary:
      "La trésorière fictive détecte des procédures mal documentées sans constater d’irrégularité. Une vérification complète rassurerait, mais gèlerait des dépenses pendant plusieurs jours.",
    prudent: "Lancer un audit interne ciblé et documenté",
    bold: "Publier immédiatement toutes les dépenses disponibles",
    collective: "Nommer un comité fictif indépendant de contrôle",
  },
  {
    id: "internal_volunteer_conflict",
    title: "Deux équipes refusent de coopérer",
    category: "internal",
    summary:
      "Les pôles terrain et numérique s’accusent mutuellement de détourner les ressources. Leur conflit fictif commence à retarder des opérations pourtant essentielles à votre stratégie.",
    prudent: "Fixer des objectifs communs et un arbitre",
    bold: "Fusionner les deux équipes sous une direction unique",
    collective: "Répartir le budget par vote des responsables",
  },
  {
    id: "internal_spokesperson_mistake",
    title: "Le porte-parole improvise une mesure",
    category: "internal",
    summary:
      "Un porte-parole fictif annonce à la radio une proposition absente de votre programme. Elle séduit une partie du public, mais oblige toute l’équipe à clarifier qui décide.",
    prudent: "Corriger la proposition sans humilier son auteur",
    bold: "Adopter la mesure et revendiquer l’audace collective",
    collective: "Soumettre la mesure au comité programmatique",
  },
  {
    id: "internal_strategy_leak",
    title: "La note stratégique a fuité",
    category: "internal",
    summary:
      "Un document interne décrivant vos électorats prioritaires circule dans la presse fictive. Rien n’est illégal, mais les publics moins ciblés découvrent leur faible place dans vos efforts.",
    prudent: "Expliquer la différence entre campagne et programme",
    bold: "Assumer publiquement vos priorités électorales",
    collective: "Réécrire la stratégie avec les fédérations",
    delayed: true,
  },
  {
    id: "internal_recruitment",
    title: "Une experte veut rejoindre l’équipe",
    category: "internal",
    summary:
      "Une haute fonctionnaire fictive reconnue propose de prendre la direction du programme. Son expertise rassure, mais son arrivée bousculerait des bénévoles présents depuis le début.",
    prudent: "L’intégrer comme conseillère sans changer l’équipe",
    bold: "Lui confier immédiatement la direction du programme",
    collective: "Créer une codirection avec les responsables actuels",
  },
  {
    id: "internal_primary_debt",
    title: "Les perdants de la primaire réclament",
    category: "internal",
    summary:
      "Deux anciens concurrents fictifs conditionnent leur participation active à des engagements programmatiques et à des places visibles. Leur soutien apporterait des réseaux utiles mais coûteux.",
    prudent: "Négocier des rôles sans promesse de poste",
    bold: "Refuser toute contrepartie et mobiliser seul",
    collective: "Signer un accord programmatique public",
  },
  {
    id: "internal_program_committee",
    title: "Les experts bloquent une promesse",
    category: "internal",
    summary:
      "Le comité fictif de chiffrage considère qu’une promesse centrale n’est pas finançable dans les délais annoncés. La modifier fragilise le récit ; la conserver expose une future contradiction.",
    prudent: "Réduire la portée et publier le nouveau chiffrage",
    bold: "Maintenir l’objectif en changeant le financement",
    collective: "Ouvrir les hypothèses à des experts extérieurs",
  },
  {
    id: "internal_headquarters_move",
    title: "Le siège doit déménager",
    category: "internal",
    summary:
      "Les locaux fictifs deviennent trop petits et peu sûrs pour accueillir la campagne. Un nouveau siège améliorerait le travail, mais détournerait argent et énergie à un moment sensible.",
    prudent: "Louer une annexe modeste pour les équipes",
    bold: "Installer un grand quartier général visible",
    collective: "Répartir les pôles dans plusieurs antennes locales",
  },
  {
    id: "internal_youth_wing",
    title: "Les jeunes veulent leur propre ligne",
    category: "internal",
    summary:
      "Le mouvement de jeunesse fictif demande plus d’autonomie et une position plus tranchée sur l’écologie et le logement. Ses militants sont précieux, mais leur campagne peut contredire la vôtre.",
    prudent: "Accorder une autonomie sur deux thèmes",
    bold: "Leur confier toute la campagne numérique",
    collective: "Inclure leurs représentants au comité stratégique",
  },
  {
    id: "internal_major_donor",
    title: "Un grand donateur pose ses conditions",
    category: "internal",
    summary:
      "Un donateur fictif propose un soutien légal important tout en demandant un accès régulier à votre équipe économique. La trésorerie en profiterait, mais l’indépendance serait questionnée.",
    prudent: "Accepter uniquement sans accès privilégié",
    bold: "Refuser publiquement et lancer une collecte populaire",
    collective: "Saisir le comité éthique fictif du mouvement",
  },
];

const allianceSeeds: ScenarioSeed[] = [
  {
    id: "alliance_left_roundtable",
    title: "La gauche cherche une table commune",
    category: "alliance",
    summary:
      "Plusieurs partis fictifs proposent une réunion sur quelques candidatures communes et un socle de second tour. Chacun veut l’unité, mais personne ne souhaite céder la première place.",
    prudent: "Négocier uniquement des engagements de second tour",
    bold: "Proposer une candidature commune immédiate",
    collective: "Organiser une convention ouverte des sympathisants",
  },
  {
    id: "alliance_center_pact",
    title: "Le centre rédige un pacte",
    category: "alliance",
    summary:
      "Des élus fictifs du centre souhaitent publier dix engagements de gouvernement commun. Le texte élargirait vos soutiens tout en limitant plusieurs promesses plus clivantes.",
    prudent: "Retenir cinq engagements compatibles",
    bold: "Signer les dix engagements sans réserve",
    collective: "Faire ratifier le pacte par les adhérents",
  },
  {
    id: "alliance_right_convention",
    title: "La droite reparle de coalition",
    category: "alliance",
    summary:
      "Une convention fictive réunit plusieurs courants de droite autour de l’économie, de l’autorité et de l’immigration. Les désaccords portent moins sur les thèmes que sur la hiérarchie.",
    prudent: "Chercher un accord limité aux législatives futures",
    bold: "Proposer un ticket présidentiel commun",
    collective: "Lancer des groupes de travail sans chef désigné",
  },
  {
    id: "alliance_mayors_appeal",
    title: "Cent maires lancent un appel",
    category: "alliance",
    summary:
      "Cent maires fictifs de sensibilités diverses signent un texte sur les services publics locaux. Ils vous invitent à le reprendre sans transformer leur démarche en ralliement partisan.",
    prudent: "Soutenir le texte sans revendiquer leurs signatures",
    bold: "Présenter l’appel comme un soutien à votre campagne",
    collective: "Coécrire un contrat territorial avec eux",
  },
  {
    id: "alliance_union_support",
    title: "Un syndicat hésite à soutenir",
    category: "alliance",
    summary:
      "Une organisation syndicale fictive envisage une prise de position exceptionnelle. Elle demande deux engagements sociaux précis et une autonomie complète pour critiquer le reste de votre projet.",
    prudent: "Accepter le soutien sans modifier votre programme",
    bold: "Adopter leurs deux demandes immédiatement",
    collective: "Signer une méthode de dialogue plutôt que des mesures",
  },
  {
    id: "alliance_fictional_celebrity",
    title: "Une artiste fictive se rallie",
    category: "alliance",
    summary:
      "Une chanteuse entièrement fictive, Liora Senn, souhaite apparaître à votre prochain meeting. Sa notoriété est forte, mais certains anciens messages publics divisent votre équipe.",
    prudent: "Accueillir son soutien dans un message séparé",
    bold: "Lui confier l’ouverture du grand meeting",
    collective: "L’inviter à une initiative culturelle pluraliste",
  },
  {
    id: "alliance_former_rival",
    title: "Un ancien rival revient",
    category: "alliance",
    summary:
      "Un adversaire fictif de votre désignation propose son soutien sans excuses ni conditions écrites. L’image d’unité serait puissante, mais personne ne connaît son objectif réel.",
    prudent: "Accepter un soutien sans rôle dans l’équipe",
    bold: "Le nommer conseiller spécial de campagne",
    collective: "Négocier sa place avec tous les anciens concurrents",
  },
  {
    id: "alliance_parliamentary_group",
    title: "Les parlementaires veulent des garanties",
    category: "alliance",
    summary:
      "Un petit groupe parlementaire fictif peut apporter élus, expertise et crédibilité. Il souhaite conserver son autonomie et obtenir un engagement sur la méthode de gouvernement.",
    prudent: "Signer un accord de méthode limité",
    bold: "Promettre plusieurs responsabilités gouvernementales",
    collective: "Créer un conseil commun de coalition",
    setFlagsOnBold: { coalition_open: true },
  },
  {
    id: "alliance_udr_autonomy",
    title: "L’UDR teste son autonomie",
    category: "alliance",
    summary:
      "Dans la simulation, le courant UDR envisage de conserver son alliance, de prendre son autonomie ou de soutenir un autre candidat fictif. Votre réponse peut modifier l’équilibre à droite.",
    prudent: "Laisser ouvertes les discussions sans annonce",
    bold: "Exiger une clarification publique immédiate",
    collective: "Proposer une plateforme commune négociée",
  },
  {
    id: "alliance_strategic_withdrawal",
    title: "Un petit candidat peut se retirer",
    category: "alliance",
    summary:
      "Un candidat fictif mal placé propose de se retirer en échange de la reprise de deux mesures. Son électorat est limité, mais très proche du vôtre et fortement mobilisé.",
    prudent: "Accepter une mesure et préserver son autonomie",
    bold: "Reprendre les deux mesures pour obtenir le retrait",
    collective: "Organiser un accord soumis aux deux mouvements",
  },
];

const scandalSeeds: ScenarioSeed[] = [
  {
    id: "scandal_treasurer_invoices",
    title: "Des factures interrogent le siège",
    category: "scandal",
    summary:
      "Un média fictif publie une enquête sur des factures validées par Maud Keravel, trésorière entièrement fictive. Les pièces sont incomplètes et aucune infraction n’est encore établie.",
    prudent: "Suspendre les paiements et vérifier chaque pièce",
    bold: "Publier les dossiers et commander un audit indépendant",
    collective: "Réunir le comité éthique fictif dès ce soir",
    sensitiveActorIds: ["fictional_treasurer"],
    sensitiveTags: ["fraud", "corruption"],
    enqueueOnBold: ["scandal_audit_conclusion"],
  },
  {
    id: "scandal_consultant_contract",
    title: "Le contrat du consultant fuit",
    category: "scandal",
    summary:
      "Le contrat légal mais coûteux de Léonard Pujol, consultant fictif, apparaît sur un site d’information fictif. La valeur réelle de ses conseils est vivement contestée.",
    prudent: "Détailler ses missions et renégocier le contrat",
    bold: "Rompre le contrat et publier tous ses livrables",
    collective: "Faire évaluer le travail par un comité indépendant",
    sensitiveActorIds: ["fictional_consultant"],
    sensitiveTags: ["corruption"],
  },
  {
    id: "scandal_local_expenses",
    title: "Une élue fictive est mise en cause",
    category: "scandal",
    summary:
      "Samira Bellon, élue locale entièrement fictive, est accusée par un média fictif d’avoir mélangé dépenses politiques et frais personnels. Elle conteste et fournit des justificatifs partiels.",
    prudent: "La suspendre provisoirement de la campagne",
    bold: "La défendre jusqu’à la fin des vérifications",
    collective: "Confier les pièces à un audit indépendant",
    sensitiveActorIds: ["fictional_local_official"],
    sensitiveTags: ["fraud"],
    delayed: true,
  },
  {
    id: "scandal_supplier_overbilling",
    title: "Le prestataire aurait surfacturé",
    category: "scandal",
    summary:
      "Étienne Marot, prestataire fictif, est soupçonné dans le jeu d’avoir gonflé plusieurs devis. Votre mouvement pourrait être victime, négligent ou complice aux yeux du public.",
    prudent: "Geler les contrats et saisir les conseils juridiques",
    bold: "Accuser publiquement le prestataire fictif",
    collective: "Publier un calendrier de contrôle externe",
    sensitiveActorIds: ["fictional_supplier"],
    sensitiveTags: ["fraud"],
  },
  {
    id: "scandal_campaign_data",
    title: "Un fichier a été mal protégé",
    category: "scandal",
    summary:
      "Sous la responsabilité fictive d’Anaïs Vercel, une liste de contacts de campagne a été accessible par erreur. Aucun usage malveillant n’est établi, mais la confiance est atteinte.",
    prudent: "Prévenir les personnes et corriger immédiatement",
    bold: "Suspendre la responsable fictive et tout auditer",
    collective: "Mandater une expertise indépendante et publique",
    sensitiveActorIds: ["fictional_campaign_manager"],
    sensitiveTags: ["fraud"],
  },
  {
    id: "scandal_donation_route",
    title: "Un circuit de dons paraît opaque",
    category: "scandal",
    summary:
      "Des versements légaux liés à un donateur entièrement fictif suivent un calendrier inhabituel. La conformité formelle ne suffit pas à dissiper le soupçon éditorial dans la simulation.",
    prudent: "Demander une vérification complète avant de répondre",
    bold: "Rendre chaque transaction publique dès maintenant",
    collective: "Saisir le comité de financement fictif",
    sensitiveActorIds: ["fictional_treasurer"],
    sensitiveTags: ["corruption", "fraud"],
  },
  {
    id: "scandal_plagiarized_report",
    title: "Une note reprend un ancien rapport",
    category: "scandal",
    summary:
      "Une note signée par Léonard Pujol, consultant fictif, reproduit sans citation plusieurs pages d’un rapport public. L’affaire n’est pas pénale mais fragilise votre exigence de sérieux.",
    prudent: "Retirer la note et reconnaître le manquement",
    bold: "Rompre avec le consultant et refaire tout le dossier",
    collective: "Publier une version corrigée par plusieurs experts",
    sensitiveActorIds: ["fictional_consultant"],
    sensitiveTags: ["fraud"],
  },
  {
    id: "scandal_family_hire",
    title: "Un recrutement familial embarrasse",
    category: "scandal",
    summary:
      "Un cadre fictif a recruté un proche dans une antenne locale sans procédure claire. Le travail existe, mais le favoritisme supposé heurte votre discours de campagne.",
    prudent: "Suspendre le contrat et ouvrir une procédure transparente",
    bold: "Démettre immédiatement le cadre fictif responsable",
    collective: "Faire examiner tous les recrutements locaux",
    sensitiveActorIds: ["fictional_local_official"],
    sensitiveTags: ["family", "corruption"],
  },
  {
    id: "scandal_false_resume",
    title: "Le CV ne correspond pas",
    category: "scandal",
    summary:
      "Une qualification inscrite sur le CV de Léonard Pujol, personnage fictif, ne peut être confirmée. Il évoque une erreur ancienne, mais son rôle reposait sur cette expertise.",
    prudent: "Le retirer des dossiers concernés pendant la vérification",
    bold: "Mettre fin à toutes ses missions immédiatement",
    collective: "Confier la vérification à un cabinet indépendant",
    sensitiveActorIds: ["fictional_consultant"],
    sensitiveTags: ["fraud"],
  },
  {
    id: "scandal_audit_conclusion",
    title: "L’audit rend ses conclusions",
    category: "scandal",
    summary:
      "L’audit fictif sur Maud Keravel distingue des erreurs de procédure de toute accusation pénale. Le rapport reste sévère sur le contrôle interne et exige une réponse durable.",
    prudent: "Appliquer toutes les recommandations sans mise en scène",
    bold: "Publier le rapport intégral et réorganiser la direction",
    collective: "Créer un contrôle permanent incluant les adhérents",
    sensitiveActorIds: ["fictional_treasurer"],
    sensitiveTags: ["fraud", "corruption"],
    minDecisionIndex: 5,
  },
];

export const internalEvents: GameEventDefinition[] = [
  ...internalSeeds.map(makeScenario),
  ...allianceSeeds.map(makeScenario),
  ...scandalSeeds.map(makeScenario),
];
