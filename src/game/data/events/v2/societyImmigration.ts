import type { GameEventDefinition } from "@/game/types";

import { bloc, decision, event, hidden, outcome, stat } from "../authoring";

/**
 * P3 (post-audit corrections): the société and immigration axes moved far
 * less than economy in simulation (mean |delta| 0.30 and 0.91 vs 6.71 —
 * AUDIT_POST_CORRECTIONS.md). Root cause traced to content volume, not
 * amplitude: ideology movement in this engine is driven almost entirely by
 * `statement.policyTopic` choices (see engine/statements.ts), and the
 * catalog had 73 economy-mapped statement choices against only 5 each for
 * social_issues and immigration. These events add genuinely distinct new
 * arbitrages on topics not yet covered by program_immigration or the
 * scattered social_issues statements elsewhere in the catalog, following
 * the same authoring pattern as program.ts.
 */

const societyImmigrationPhases = {
  pre_campaign: 0.55,
  campaign: 1,
  official_campaign: 0.75,
} as const;

export const v2SocietyImmigrationEvents: GameEventDefinition[] = [
  event({
    id: "program_end_of_life",
    title: "La question de la fin de vie",
    category: "program",
    summary:
      "Une proposition de loi sur la fin de vie revient devant le Parlement pendant la campagne. Les associations de patients, les soignants et les cultes attendent une position claire, et le silence serait lui-même interprété comme un choix.",
    themes: ["social_issues"],
    importance: "major",
    phaseWeights: societyImmigrationPhases,
    choices: [
      decision({
        id: "end_of_life_active_assistance",
        label: "Autoriser l’aide active à mourir sous conditions médicales strictes",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "fin de vie",
          policyTopic: "social_issues",
          text: "Une aide active à mourir sera autorisée sous conditions médicales strictes et un contrôle collégial",
          stance: -60,
          ideology: { society: -6 },
        },
        result: outcome(
          "end_of_life_law_progressive",
          "Une liberté nouvelle, encadrée",
          "Les associations de patients saluent une avancée réclamée depuis des années. Une partie du corps soignant s’inquiète des conditions d’application et des cultes organisent une mobilisation contre le texte.",
          [
            bloc("young_urban_graduates", 4),
            bloc("green_progressives", 4),
            bloc("conservative_retirees", -6),
            stat("mediaPresence", 3, "Débat de société relancé"),
          ],
        ),
      }),
      decision({
        id: "end_of_life_palliative_only",
        label: "Financer davantage les soins palliatifs sans légiférer sur l’aide active à mourir",
        tag: "PRUDENT",
        strategy: "compromise",
        statement: {
          topic: "fin de vie",
          policyTopic: "social_issues",
          text: "L’effort portera sur les soins palliatifs, sans légiférer sur l’aide active à mourir dans ce mandat",
          stance: 10,
          ideology: { society: 1 },
        },
        result: outcome(
          "end_of_life_palliative_investment",
          "Le soin plutôt que la loi",
          "L’engagement budgétaire sur les soins palliatifs est concret et difficile à contester. Les partisans d’une nouvelle loi jugent la position temporisatrice et continuent de faire pression.",
          [
            stat("credibility", 3, "Mesure budgétaire précise"),
            bloc("moderate_retirees", 3),
            stat("mobilization", -1, "Sujet perçu comme évité"),
          ],
        ),
      }),
      decision({
        id: "end_of_life_referendum",
        label: "Soumettre la question à référendum après un an de débat parlementaire",
        tag: "INSTITUTIONNEL",
        strategy: "long_term_strategy",
        statement: {
          topic: "fin de vie",
          policyTopic: "social_issues",
          text: "La question sera tranchée par référendum après un an de débat parlementaire organisé",
          stance: 0,
          ideology: { society: 0, authority: 1 },
        },
        result: outcome(
          "end_of_life_referendum_path",
          "La décision revient aux citoyens",
          "La méthode évite de trancher seul un sujet de conscience et paraît difficile à attaquer sur le fond. Les deux camps du débat reprochent au calendrier de retarder une décision qu’ils jugent urgente.",
          [
            hidden("consistency", 2),
            stat("credibility", 1, "Méthode institutionnelle"),
            stat("mediaPresence", -2, "Position jugée dilatoire"),
          ],
        ),
      }),
      decision({
        id: "end_of_life_keep_ban",
        label: "Maintenir l’interdiction actuelle et renforcer l’accompagnement familial",
        tag: "LOYAL",
        strategy: "policy_commitment",
        statement: {
          topic: "fin de vie",
          policyTopic: "social_issues",
          text: "L’interdiction de l’aide active à mourir est maintenue, au profit de l’accompagnement familial renforcé",
          stance: 50,
          ideology: { society: 5 },
        },
        result: outcome(
          "end_of_life_ban_maintained",
          "Le cadre actuel, mais mieux accompagné",
          "La position rassure une partie de l’électorat attachée au cadre existant et les cultes saluent la constance. Les associations de patients dénoncent un refus d’avancer sur une demande ancienne.",
          [
            bloc("conservative_retirees", 5),
            bloc("rural_working_class", 2),
            bloc("young_urban_graduates", -4),
            stat("rejection", 2, "Immobilisme reproché"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_secularism",
    title: "La laïcité à l’épreuve du quotidien",
    category: "program",
    summary:
      "Un incident dans un établissement scolaire relance le débat sur l’application de la laïcité dans les services publics. Votre équipe de campagne doit fixer une doctrine avant que d’autres ne le fassent à votre place dans les médias.",
    themes: ["social_issues", "civil_liberties"],
    importance: "major",
    phaseWeights: societyImmigrationPhases,
    choices: [
      decision({
        id: "secularism_extend_ban",
        label: "Élargir l’interdiction des signes religieux ostensibles aux universités",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "laïcité",
          policyTopic: "social_issues",
          text: "L’interdiction des signes religieux ostensibles sera étendue aux établissements universitaires",
          stance: 55,
          ideology: { society: 5, authority: 2 },
        },
        result: outcome(
          "secularism_university_extension",
          "Un cadre étendu à l’enseignement supérieur",
          "La mesure est saluée comme une clarification par une partie de l’électorat attachée à une laïcité stricte. Des organisations étudiantes et des juristes contestent sa conformité avec la liberté universitaire.",
          [
            bloc("conservative_retirees", 4),
            bloc("rural_working_class", 2),
            bloc("green_progressives", -3),
            stat("rejection", 2, "Mesure jugée clivante"),
          ],
        ),
      }),
      decision({
        id: "secularism_current_framework",
        label: "En rester au cadre actuel et former les agents publics à son application",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "laïcité",
          policyTopic: "social_issues",
          text: "Le cadre légal actuel est maintenu, avec un effort de formation des agents publics à son application",
          stance: 5,
          ideology: { society: 1 },
        },
        result: outcome(
          "secularism_training_effort",
          "La formation plutôt qu’une nouvelle loi",
          "La proposition est concrète et administrativement réaliste, ce qui rassure les agents concernés. Elle ne répond pas aux attentes des camps qui espéraient un signal politique plus net, dans un sens ou dans l’autre.",
          [
            stat("credibility", 3, "Mesure administrative crédible"),
            hidden("economicCompetence", 1),
            stat("mediaPresence", -1, "Sujet traité sans éclat"),
          ],
        ),
      }),
      decision({
        id: "secularism_reasonable_accommodation",
        label: "Créer un statut souple d’accommodements raisonnables étudiés au cas par cas",
        tag: "OPPORTUNISTE",
        strategy: "compromise",
        statement: {
          topic: "laïcité",
          policyTopic: "social_issues",
          text: "Un statut d’accommodements raisonnables, étudiés au cas par cas, sera créé dans les services publics",
          stance: -45,
          ideology: { society: -4 },
        },
        result: outcome(
          "secularism_case_by_case",
          "La souplesse contre la règle uniforme",
          "Des associations locales saluent une réponse pragmatique aux situations concrètes du terrain. Des élus de tous bords dénoncent un risque d’arbitraire et de contentieux répétés faute de règle claire.",
          [
            bloc("young_urban_graduates", 3),
            bloc("urban_working_class", 2),
            bloc("conservative_retirees", -5),
            hidden("consistency", -1),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_school_values",
    title: "Ce que l’école doit transmettre",
    category: "program",
    summary:
      "Un rapport parlementaire relance le débat sur les enseignements civiques et le cadre de vie scolaire. Les syndicats enseignants, les parents d’élèves et les associations laïques attendent chacun un signal, souvent contradictoire.",
    themes: ["social_issues"],
    importance: "notable",
    phaseWeights: societyImmigrationPhases,
    choices: [
      decision({
        id: "school_values_civic_curriculum",
        label: "Introduire un enseignement moral et civique renforcé avec évaluation nationale",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "école et valeurs communes",
          policyTopic: "social_issues",
          text: "Un enseignement moral et civique renforcé sera généralisé avec une évaluation nationale",
          stance: 40,
          ideology: { society: 3, authority: 1 },
        },
        result: outcome(
          "school_civic_curriculum_national",
          "Un socle commun évalué",
          "La proposition rassure les parents inquiets d’un manque de repères communs et donne un cadre national lisible. Les syndicats enseignants contestent l’ajout d’une évaluation qu’ils jugent bureaucratique.",
          [
            bloc("moderate_retirees", 3),
            bloc("rural_working_class", 2),
            stat("credibility", 2, "Cadre nationalement lisible"),
            stat("cohesion", -1, "Syndicats enseignants réservés"),
          ],
        ),
      }),
      decision({
        id: "school_values_pedagogical_freedom",
        label: "Maintenir la liberté pédagogique des établissements sur les enseignements civiques",
        tag: "PRUDENT",
        strategy: "compromise",
        statement: {
          topic: "école et valeurs communes",
          policyTopic: "social_issues",
          text: "La liberté pédagogique des établissements sur les enseignements civiques sera préservée",
          stance: -30,
          ideology: { society: -3 },
        },
        result: outcome(
          "school_pedagogical_freedom_kept",
          "La confiance faite au terrain",
          "Les équipes pédagogiques saluent une position qui respecte leur expertise. Des parents et des élus locaux regrettent l’absence de cadre national identifiable dans un débat qu’ils jugent structurant.",
          [
            bloc("young_urban_graduates", 2),
            bloc("public_services", 3),
            bloc("conservative_retirees", -2),
          ],
        ),
      }),
      decision({
        id: "school_values_uniform_trial",
        label: "Lancer une expérimentation de l’uniforme scolaire dans les collèges volontaires",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "école et valeurs communes",
          policyTopic: "social_issues",
          text: "Une expérimentation de l’uniforme scolaire sera lancée dans les collèges volontaires",
          stance: 25,
          ideology: { society: 2 },
        },
        result: outcome(
          "school_uniform_experiment",
          "Une expérimentation limitée et volontaire",
          "La mesure est simple à expliquer et trouve un écho favorable dans une partie de l’opinion. Des pédagogues et des associations de parents la jugent secondaire face aux enjeux de moyens et de mixité sociale.",
          [
            stat("mediaPresence", 3, "Mesure très commentée"),
            bloc("moderate_retirees", 2),
            bloc("young_urban_graduates", -1),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_digital_rights",
    title: "Vie privée et réseaux : la ligne numérique",
    category: "program",
    summary:
      "Un rapport sur l’exposition des mineurs aux réseaux sociaux et la multiplication des contenus haineux en ligne poussent votre équipe à préciser une doctrine numérique avant un prochain débat télévisé consacré au sujet.",
    themes: ["social_issues", "civil_liberties"],
    importance: "notable",
    phaseWeights: societyImmigrationPhases,
    choices: [
      decision({
        id: "digital_rights_age_verification",
        label: "Créer une majorité numérique à seize ans avec vérification d’âge obligatoire",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "libertés numériques",
          policyTopic: "social_issues",
          text: "Une majorité numérique à seize ans sera instaurée, avec vérification d’âge obligatoire sur les réseaux",
          stance: 30,
          ideology: { society: 2, authority: 2 },
        },
        result: outcome(
          "digital_age_verification_law",
          "Un seuil clair, une vérification à organiser",
          "Les associations de protection de l’enfance saluent un signal fort. Des défenseurs des libertés numériques s’inquiètent des données collectées pour vérifier l’âge et du risque de contournement.",
          [
            bloc("moderate_retirees", 3),
            bloc("urban_working_class", 1),
            bloc("young_urban_graduates", -2),
            hidden("scandalRisk", 1),
          ],
        ),
      }),
      decision({
        id: "digital_rights_moderation_only",
        label:
          "Doubler les moyens de modération sans nouvelle obligation d’identification en ligne",
        tag: "PRUDENT",
        strategy: "compromise",
        statement: {
          topic: "libertés numériques",
          policyTopic: "social_issues",
          text: "La modération des contenus sera renforcée sans nouvelle obligation d’identification en ligne",
          stance: -20,
          ideology: { society: -2 },
        },
        result: outcome(
          "digital_moderation_reinforced",
          "Le contenu ciblé, l’anonymat préservé",
          "La mesure évite le débat sur l’identification et cible directement les contenus problématiques. Des associations familiales la jugent insuffisante face à l’ampleur de l’exposition des mineurs.",
          [
            bloc("young_urban_graduates", 3),
            bloc("green_progressives", 2),
            stat("credibility", 1, "Mesure ciblée"),
          ],
        ),
      }),
      decision({
        id: "digital_rights_independent_authority",
        label: "Confier la régulation à une autorité indépendante dotée de pouvoirs de sanction",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "libertés numériques",
          policyTopic: "social_issues",
          text: "Une autorité indépendante recevra des pouvoirs de sanction pour réguler les plateformes numériques",
          stance: 10,
          ideology: { society: 1, authority: 1 },
        },
        result: outcome(
          "digital_independent_authority",
          "Une autorité dédiée, hors du politique",
          "Le choix institutionnel rassure sur l’indépendance de la régulation vis-à-vis du pouvoir en place. Certains commentateurs regrettent l’absence de mesure immédiate visible avant la mise en place effective de l’autorité.",
          [
            hidden("consistency", 2),
            stat("credibility", 2, "Réponse institutionnelle"),
            stat("mediaPresence", -1, "Effet différé"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_family_reunification",
    title: "Le regroupement familial en question",
    category: "program",
    summary:
      "Une proposition de loi sur les conditions du regroupement familial est déposée au Parlement. Contrairement au débat sur l’asile déjà tranché dans votre programme, ce texte porte spécifiquement sur les familles déjà installées.",
    themes: ["immigration"],
    importance: "major",
    phaseWeights: societyImmigrationPhases,
    choices: [
      decision({
        id: "family_reunification_extend_delay",
        label: "Fixer à trois ans le délai de résidence requis avant regroupement familial",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "regroupement familial",
          policyTopic: "immigration",
          text: "Le délai de résidence requis avant regroupement familial sera porté à trois ans",
          stance: 45,
          ideology: { immigration: 4 },
        },
        result: outcome(
          "family_reunification_delay_extended",
          "Un délai plus long, un signal de fermeté",
          "La mesure répond à une demande de contrôle exprimée dans vos réunions publiques. Des associations familiales et certains partenaires sociaux dénoncent une séparation prolongée des familles déjà installées.",
          [
            bloc("conservative_retirees", 4),
            bloc("rural_working_class", 2),
            bloc("young_urban_graduates", -3),
            stat("rejection", 2, "Séparation familiale contestée"),
          ],
        ),
      }),
      decision({
        id: "family_reunification_faster_processing",
        label: "Maintenir les délais actuels et accélérer l’instruction des dossiers",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "regroupement familial",
          policyTopic: "immigration",
          text: "Les délais actuels de regroupement familial sont maintenus, avec une instruction des dossiers accélérée",
          stance: -5,
          ideology: { immigration: -1 },
        },
        result: outcome(
          "family_reunification_processing_speed",
          "Le même cadre, appliqué plus vite",
          "La mesure administrative est difficile à contester sur le fond et rassure les familles en attente. Elle ne répond pas à la demande de fermeté exprimée par une partie de votre électorat.",
          [
            stat("credibility", 3, "Mesure administrative concrète"),
            hidden("economicCompetence", 1),
            stat("mobilization", -1, "Sujet jugé peu tranché"),
          ],
        ),
      }),
      decision({
        id: "family_reunification_resource_condition",
        label: "Conditionner le regroupement à un niveau de ressources et de logement vérifié",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "regroupement familial",
          policyTopic: "immigration",
          text: "Le regroupement familial sera conditionné à un niveau de ressources et de logement vérifié",
          stance: 20,
          ideology: { immigration: 2, authority: 1 },
        },
        result: outcome(
          "family_reunification_resource_test",
          "Une condition matérielle plutôt qu’un délai",
          "Le critère matériel paraît objectif et évite une polémique sur la durée de séparation familiale. Des associations dénoncent un obstacle supplémentaire pour les familles aux revenus modestes.",
          [
            bloc("entrepreneurs", 2),
            bloc("middle_class_workers", 2),
            bloc("urban_working_class", -2),
            hidden("consistency", 1),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_labor_immigration",
    title: "L’immigration de travail, un choix économique assumé ou non",
    category: "program",
    summary:
      "Des fédérations patronales de la restauration, du bâtiment et du soin à domicile alertent publiquement sur des postes non pourvus. Le sujet, distinct de l’asile déjà tranché, oblige à préciser votre ligne sur l’immigration de travail.",
    themes: ["immigration", "economy"],
    importance: "major",
    phaseWeights: societyImmigrationPhases,
    choices: [
      decision({
        id: "labor_immigration_shortage_list",
        label:
          "Ouvrir une liste de métiers en tension avec délivrance accélérée de titres de séjour",
        tag: "OPPORTUNISTE",
        strategy: "policy_commitment",
        statement: {
          topic: "immigration de travail",
          policyTopic: "immigration",
          text: "Une liste de métiers en tension ouvrira droit à une délivrance accélérée de titres de séjour",
          stance: -50,
          ideology: { immigration: -5, economy: -1 },
        },
        result: outcome(
          "labor_immigration_shortage_open",
          "Les métiers en tension trouvent une réponse",
          "Les fédérations patronales concernées saluent une réponse concrète à leurs alertes répétées. Une partie de votre socle électoral dénonce une politique migratoire dictée par des besoins économiques de court terme.",
          [
            bloc("entrepreneurs", 5),
            bloc("executives", 2),
            bloc("conservative_retirees", -5),
            stat("rejection", 3, "Ligne migratoire contestée"),
          ],
        ),
      }),
      decision({
        id: "labor_immigration_european_priority",
        label: "Réserver les embauches en tension aux résidents européens avant toute ouverture",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "immigration de travail",
          policyTopic: "immigration",
          text: "Les embauches sur les métiers en tension seront réservées aux résidents européens avant toute ouverture",
          stance: 45,
          ideology: { immigration: 4, europe: 1 },
        },
        result: outcome(
          "labor_immigration_european_priority_set",
          "La priorité européenne avant l’ouverture",
          "La mesure rassure une partie de l’électorat sur la maîtrise des flux tout en restant dans le cadre européen. Les fédérations patronales des secteurs concernés jugent le délai de mise en œuvre incompatible avec leurs besoins immédiats.",
          [
            bloc("rural_working_class", 3),
            bloc("conservative_retirees", 3),
            bloc("entrepreneurs", -3),
            stat("mediaPresence", 2, "Ligne de fermeté commentée"),
          ],
        ),
      }),
      decision({
        id: "labor_immigration_sector_negotiation",
        label:
          "Confier aux branches professionnelles la négociation annuelle des quotas par métier",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        statement: {
          topic: "immigration de travail",
          policyTopic: "immigration",
          text: "Les quotas d’immigration de travail par métier seront négociés chaque année par les branches professionnelles",
          stance: -10,
          ideology: { immigration: -1 },
        },
        result: outcome(
          "labor_immigration_branch_negotiation",
          "Le dialogue social fixe le curseur",
          "La méthode déplace la décision vers les partenaires sociaux et paraît difficile à instrumentaliser politiquement. Des élus de tous bords regrettent qu’aucun chiffre national ne soit fixé par le pouvoir politique lui-même.",
          [
            hidden("consistency", 2),
            stat("credibility", 1, "Méthode de dialogue social"),
            stat("mediaPresence", -2, "Sujet renvoyé aux branches"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_integration_contract",
    title: "Le contrat d’intégration, jusqu’où aller",
    category: "program",
    summary:
      "Un rapport de la Cour des comptes pointe l’hétérogénéité des dispositifs d’intégration selon les territoires. Votre équipe doit trancher entre renforcer les obligations existantes ou investir davantage dans l’accompagnement.",
    themes: ["immigration", "social_issues"],
    importance: "notable",
    phaseWeights: societyImmigrationPhases,
    choices: [
      decision({
        id: "integration_contract_mandatory_tests",
        label:
          "Imposer un contrat d’intégration obligatoire avec tests de langue et de compétences civiques",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "intégration",
          policyTopic: "immigration",
          text: "Un contrat d’intégration obligatoire, avec tests de langue et de compétences civiques, sera généralisé",
          stance: 35,
          ideology: { immigration: 3, authority: 1 },
        },
        result: outcome(
          "integration_contract_mandatory",
          "Un cadre obligatoire et évalué",
          "La mesure donne un cadre national lisible et répond à une demande de clarté sur les attentes réciproques. Des associations d’accompagnement alertent sur le risque d’exclusion des personnes les plus fragiles si les tests sont trop exigeants.",
          [
            bloc("moderate_retirees", 3),
            bloc("middle_class_workers", 2),
            bloc("green_progressives", -2),
            stat("credibility", 2, "Cadre national lisible"),
          ],
        ),
      }),
      decision({
        id: "integration_contract_more_support",
        label:
          "Financer davantage l’accompagnement à l’intégration sans nouvelle obligation contractuelle",
        tag: "PRUDENT",
        strategy: "compromise",
        statement: {
          topic: "intégration",
          policyTopic: "immigration",
          text: "Les moyens d’accompagnement à l’intégration seront renforcés, sans nouvelle obligation contractuelle",
          stance: -30,
          ideology: { immigration: -3 },
        },
        result: outcome(
          "integration_contract_support_investment",
          "Investir avant de contraindre",
          "Les associations de terrain saluent un choix qui répond à leurs difficultés de moyens constatées depuis des années. Une partie de l’opinion attendait un signal plus ferme sur les obligations des personnes concernées.",
          [
            bloc("public_services", 3),
            bloc("young_urban_graduates", 2),
            bloc("conservative_retirees", -3),
          ],
        ),
      }),
      decision({
        id: "integration_contract_nationality_link",
        label: "Conditionner l’accès à la nationalité à la réussite du contrat d’intégration",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "intégration",
          policyTopic: "immigration",
          text: "L’accès à la nationalité sera conditionné à la réussite du contrat d’intégration",
          stance: 55,
          ideology: { immigration: 5, authority: 2 },
        },
        result: outcome(
          "integration_contract_nationality_condition",
          "L’intégration comme condition de la nationalité",
          "La proposition marque une ligne nette et mobilise une partie de votre socle. Des juristes et des associations de défense des droits contestent la conformité du dispositif avec les engagements internationaux existants.",
          [
            bloc("rural_working_class", 4),
            bloc("conservative_retirees", 3),
            bloc("young_urban_graduates", -4),
            stat("rejection", 3, "Mesure jugée dure par ses opposants"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_border_control",
    title: "Contrôles aux frontières : quels moyens",
    category: "program",
    summary:
      "Une hausse des passages signalés à une frontière intérieure de l’espace Schengen relance le débat sur les contrôles nationaux, distinct des orientations déjà prises sur l’asile et le regroupement familial.",
    themes: ["immigration", "europe"],
    importance: "notable",
    phaseWeights: societyImmigrationPhases,
    choices: [
      decision({
        id: "border_control_systematic_checks",
        label:
          "Imposer des contrôles systématiques aux frontières intérieures de l’espace Schengen",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "contrôle aux frontières",
          policyTopic: "immigration",
          text: "Des contrôles systématiques seront rétablis aux frontières intérieures de l’espace Schengen",
          stance: 50,
          ideology: { immigration: 5, europe: -3 },
        },
        result: outcome(
          "border_control_systematic",
          "Le contrôle national réaffirmé",
          "La mesure répond directement à l’incident qui a relancé le débat et rassure une partie de l’opinion. Des partenaires européens et des acteurs économiques transfrontaliers dénoncent un coût logistique et diplomatique important.",
          [
            bloc("rural_working_class", 3),
            bloc("conservative_retirees", 3),
            bloc("entrepreneurs", -2),
            stat("mediaPresence", 3, "Mesure très commentée"),
          ],
        ),
      }),
      decision({
        id: "border_control_european_cooperation",
        label: "Financer Frontex et la coopération européenne plutôt que des contrôles nationaux",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        statement: {
          topic: "contrôle aux frontières",
          policyTopic: "immigration",
          text: "L’effort portera sur Frontex et la coopération européenne plutôt que sur des contrôles nationaux",
          stance: -35,
          ideology: { immigration: -3, europe: 3 },
        },
        result: outcome(
          "border_control_european_route",
          "La réponse européenne plutôt que nationale",
          "La cohérence avec votre ligne européenne est nette et rassure vos partenaires du continent. Une partie de votre électorat juge la réponse trop lente face à un incident qui appelait, selon elle, un signal immédiat.",
          [
            hidden("transferability", 3),
            hidden("consistency", 2),
            stat("mobilization", -1, "Réponse jugée différée"),
          ],
        ),
      }),
      decision({
        id: "border_control_mobile_checks",
        label: "Lancer des contrôles mobiles ciblés sur les axes routiers frontaliers",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "contrôle aux frontières",
          policyTopic: "immigration",
          text: "Des contrôles mobiles ciblés seront expérimentés sur les axes routiers frontaliers",
          stance: 15,
          ideology: { immigration: 1, authority: 1 },
        },
        result: outcome(
          "border_control_mobile_pilot",
          "Une réponse ciblée et réversible",
          "La mesure évite la lourdeur d’un contrôle systématique tout en donnant une réponse concrète à l’incident. Certains commentateurs la jugent trop modeste pour peser réellement sur les passages constatés.",
          [
            stat("credibility", 2, "Réponse proportionnée"),
            bloc("middle_class_workers", 1),
            stat("mediaPresence", -1, "Mesure jugée limitée"),
          ],
        ),
      }),
    ],
  }),
];
