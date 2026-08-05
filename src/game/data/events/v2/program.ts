import type { GameEventDefinition } from "@/game/types";

import { bloc, decision, event, hidden, outcome, stat } from "../authoring";

const programPhases = { pre_campaign: 0.6, campaign: 1, official_campaign: 0.7 } as const;

export const v2ProgramEvents: GameEventDefinition[] = [
  event({
    id: "program_pensions",
    title: "La ligne de départ des retraites",
    category: "program",
    summary:
      "Votre convention sociale doit arrêter une règle lisible sur les retraites. Les carrières longues, l’espérance de vie et le financement rendent toute promesse uniforme fragile, mais reporter l’arbitrage laisserait vos adversaires écrire votre position.",
    themes: ["pensions", "work"],
    importance: "major",
    phaseWeights: programPhases,
    choices: [
      decision({
        id: "pensions_age_64",
        label:
          "Maintenir l’âge légal à soixante-quatre ans avec des départs anticipés par durée de cotisation",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "retraites",
          policyTopic: "pensions",
          text: "L’âge légal reste fixé à soixante-quatre ans avec des exceptions pour les carrières longues",
          stance: 35,
          ideology: { economy: 2 },
        },
        result: outcome(
          "pensions_age_funded",
          "Une continuité assortie d’exceptions",
          "Le financement paraît plus robuste que les scénarios concurrents et les départs anticipés limitent la dureté du signal. Les syndicats contestent néanmoins le maintien de l’âge et annoncent qu’ils en feront un sujet de campagne.",
          [
            stat("credibility", 4, "Financement plus lisible"),
            bloc("executives", 3),
            bloc("public_services", -3),
            hidden("economicCompetence", 3),
          ],
        ),
      }),
      decision({
        id: "pensions_return_62",
        label:
          "Ramener l’âge légal à soixante-deux ans et financer l’écart par une hausse ciblée des cotisations",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "retraites",
          policyTopic: "pensions",
          text: "L’âge légal revient à soixante-deux ans avec une hausse ciblée des cotisations",
          stance: -50,
          ideology: { economy: -4 },
        },
        result: outcome(
          "pensions_62_contributions",
          "Le retour à soixante-deux ans est financé",
          "La mesure mobilise les salariés opposés au relèvement de l’âge et assume son coût par une recette identifiable. Les entreprises dénoncent la hausse de cotisations, qui devient le principal angle d’attaque économique.",
          [
            bloc("urban_working_class", 5),
            bloc("public_services", 4),
            bloc("entrepreneurs", -5),
            stat("mobilization", 3, "Promesse sociale forte"),
          ],
        ),
      }),
      decision({
        id: "pensions_points_choice",
        label: "Proposer un système par points avec âge de référence et compte pénibilité renforcé",
        tag: "INSTITUTIONNEL",
        strategy: "program_shift",
        statement: {
          topic: "retraites",
          policyTopic: "pensions",
          text: "Un système par points remplacera les régimes actuels avec un compte pénibilité renforcé",
          stance: 15,
          ideology: { economy: 1 },
        },
        result: outcome(
          "pensions_points_reopens_reform",
          "La réforme systémique rouvre tous les fronts",
          "Le projet répond aux différences de carrière et évite un âge unique, mais sa transition est difficile à expliquer. Votre équipe gagne une architecture complète et hérite d’un conflit technique jusque dans la dernière ligne droite.",
          [
            stat("credibility", 2, "Architecture complète"),
            stat("rejection", 3, "Transition anxiogène"),
            hidden("economicCompetence", 2),
          ],
          { setFlags: { pension_systemic_reform: true } },
        ),
      }),
      decision({
        id: "pensions_social_conference",
        label:
          "Convoquer une conférence sociale avec obligation d’équilibre avant toute modification de l’âge",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        statement: {
          topic: "retraites",
          policyTopic: "pensions",
          text: "L’âge de départ sera fixé par une conférence sociale tenue sous contrainte d’équilibre",
          stance: 0,
        },
        result: outcome(
          "pensions_method_without_age",
          "La méthode tient, l’âge reste absent",
          "Les partenaires sociaux apprécient l’espace de négociation et la règle d’équilibre. Les électeurs qui attendaient un chiffre y voient toutefois un report, que chaque concurrent interprète selon son intérêt.",
          [
            stat("cohesion", 2, "Compromis interne"),
            hidden("transferability", 3),
            stat("credibility", -1, "Âge non tranché"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_taxation",
    title: "Qui financera les priorités",
    category: "program",
    summary:
      "Le cadrage budgétaire laisse huit milliards d’euros à financer. Votre équipe doit choisir une recette avant la publication du programme : fiscalité du patrimoine, réduction de niches, taxe de consommation ou économies supplémentaires.",
    themes: ["fiscality", "economy"],
    importance: "major",
    phaseWeights: programPhases,
    choices: [
      decision({
        id: "taxation_wealth",
        label:
          "Créer un impôt progressif sur les patrimoines les plus élevés avec assiette publique",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "fiscalité",
          policyTopic: "fiscality",
          text: "Les patrimoines les plus élevés financeront les nouvelles priorités publiques",
          stance: -65,
          ideology: { economy: -5 },
        },
        result: outcome(
          "wealth_tax_funds_plan",
          "Le patrimoine devient la ligne de partage",
          "La recette est lisible et consolide votre électorat social. Les simulations de rendement restent débattues et les adversaires centrent aussitôt leurs critiques sur le risque de départ des capitaux.",
          [
            bloc("young_precarious", 4),
            bloc("executives", -4),
            stat("mobilization", 3, "Clivage fiscal assumé"),
            hidden("economicCompetence", -1),
          ],
        ),
      }),
      decision({
        id: "taxation_niches",
        label:
          "Supprimer dix niches fiscales identifiées et publier le rendement attendu de chacune",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "fiscalité",
          policyTopic: "fiscality",
          text: "Dix niches fiscales seront supprimées pour financer le programme",
          stance: -15,
          ideology: { economy: -1 },
        },
        result: outcome(
          "tax_niches_named",
          "Dix avantages ont désormais dix défenseurs",
          "La liste crédibilise le financement et permet une vérification précise. Chaque secteur concerné organise cependant sa riposte, transformant un arbitrage technique en dix conflits concrets.",
          [
            stat("credibility", 5, "Recettes documentées"),
            stat("rejection", 2, "Secteurs mécontents"),
            hidden("economicCompetence", 4),
          ],
          { setFlags: { tax_niches_listed: true } },
        ),
      }),
      decision({
        id: "taxation_vat",
        label:
          "Augmenter la TVA hors produits essentiels et compenser les ménages modestes par un crédit",
        tag: "RISQUÉ",
        strategy: "policy_commitment",
        statement: {
          topic: "fiscalité",
          policyTopic: "fiscality",
          text: "La TVA augmentera hors produits essentiels avec compensation ciblée",
          stance: 40,
          ideology: { economy: 3 },
        },
        result: outcome(
          "vat_compensation_scrutinized",
          "Une recette sûre, une compensation contestée",
          "Le rendement paraît robuste et la protection des produits essentiels limite l’effet immédiat. Le crédit compensatoire semble complexe et votre campagne doit désormais prouver qu’aucun ménage modeste ne perdra.",
          [
            hidden("economicCompetence", 4),
            bloc("entrepreneurs", 2),
            bloc("young_precarious", -3),
            stat("credibility", 1, "Recette stable"),
          ],
        ),
      }),
      decision({
        id: "taxation_cut_spending",
        label: "Retirer deux dépenses du programme plutôt que créer un prélèvement supplémentaire",
        tag: "PRUDENT",
        strategy: "long_term_strategy",
        statement: {
          topic: "fiscalité",
          policyTopic: "fiscality",
          text: "Le programme sera financé sans impôt nouveau grâce à deux priorités retirées",
          stance: 55,
          ideology: { economy: 4 },
        },
        result: outcome(
          "spending_promises_removed",
          "Le budget perd deux promesses",
          "L’absence d’impôt nouveau rassure une partie des classes moyennes et renforce votre discipline budgétaire. Les publics visés par les mesures retirées découvrent immédiatement le prix politique de l’arbitrage.",
          [
            stat("credibility", 4, "Arbitrage assumé"),
            bloc("middle_class_workers", 3),
            stat("popularity", -2, "Mesures retirées"),
            hidden("consistency", 2),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_wages",
    title: "Le salaire net au centre",
    category: "program",
    summary:
      "L’inflation ralentit sans effacer les pertes de pouvoir d’achat. La conférence économique attend votre mécanisme salarial : hausse du minimum légal, négociations de branche, baisse de cotisations ou prime ponctuelle.",
    themes: ["work", "economy"],
    phaseWeights: programPhases,
    choices: [
      decision({
        id: "wages_raise_minimum",
        label:
          "Augmenter le salaire minimum de huit pour cent et compenser temporairement les petites entreprises",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "salaires",
          policyTopic: "work",
          text: "Le salaire minimum augmentera de huit pour cent avec aide temporaire aux petites entreprises",
          stance: -50,
          ideology: { economy: -3 },
        },
        result: outcome(
          "minimum_wage_with_buffer",
          "La hausse est immédiate, la transition coûteuse",
          "Les salariés au minimum voient un gain direct et la compensation évite une rupture avec les petites entreprises. Le coût budgétaire des deux premières années fragilise cependant votre cadrage fiscal.",
          [
            bloc("urban_working_class", 6),
            bloc("rural_working_class", 4),
            stat("popularity", 3, "Hausse salariale"),
            hidden("economicCompetence", -2),
          ],
        ),
      }),
      decision({
        id: "wages_branch_negotiations",
        label:
          "Conditionner les allègements de cotisations à des négociations salariales conclues dans chaque branche",
        tag: "INSTITUTIONNEL",
        strategy: "negotiation",
        statement: {
          topic: "salaires",
          policyTopic: "work",
          text: "Les allègements de cotisations dépendront d’accords salariaux de branche",
          stance: -25,
        },
        result: outcome(
          "branch_deals_condition_aid",
          "Les aides deviennent un levier de négociation",
          "Les syndicats obtiennent un rapport de force concret et les entreprises gardent une marge sectorielle. Le résultat dépendra de dizaines de négociations, ce qui rend le gain salarial moins immédiat mais plus soutenable.",
          [
            stat("credibility", 4, "Mécanisme négocié"),
            bloc("middle_class_workers", 3),
            hidden("transferability", 2),
          ],
        ),
      }),
      decision({
        id: "wages_cut_contributions",
        label:
          "Baisser les cotisations salariales et financer le manque par une économie sur les dépenses courantes",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "salaires",
          policyTopic: "work",
          text: "Le salaire net augmentera par une baisse de cotisations financée par des économies",
          stance: 45,
          ideology: { economy: 4 },
        },
        result: outcome(
          "net_wage_budget_tradeoff",
          "Le net augmente, les services demandent la facture",
          "La mesure est facile à voir sur une fiche de paie et séduit des salariés du privé. Les agents publics et les associations demandent quelles dépenses courantes absorberont exactement la compensation.",
          [
            bloc("middle_class_workers", 5),
            bloc("public_services", -4),
            stat("credibility", 1, "Effet net chiffré"),
            hidden("economicCompetence", 2),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_energy",
    title: "Le mix électrique de 2040",
    category: "program",
    summary:
      "À Strasbourg, votre discours énergétique doit trancher la trajectoire nucléaire et renouvelable jusqu’en 2040. Le réseau, le coût, l’indépendance et la réduction des émissions imposent des délais que les slogans masquent mal.",
    themes: ["ecology", "economy"],
    importance: "major",
    phaseWeights: programPhases,
    entityReferences: [{ entityId: "strasbourg", role: "location" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "energy_nuclear_renewables",
        label:
          "Programmer six réacteurs et accélérer simultanément le solaire, l’éolien et les réseaux",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "énergie",
          policyTopic: "ecology",
          text: "La France développera simultanément six réacteurs et les renouvelables",
          stance: 5,
          ideology: { ecology: 1 },
        },
        result: outcome(
          "energy_dual_investment",
          "Deux filières, une facture massive",
          "La stratégie réduit le risque de dépendre d’une technologie et rassure l’industrie. Son coût d’investissement cumulé devient aussitôt l’un des principaux postes à financer de votre programme.",
          [
            stat("credibility", 3, "Mix diversifié"),
            bloc("executives", 3),
            bloc("green_progressives", 1),
            hidden("economicCompetence", -2),
          ],
        ),
      }),
      decision({
        id: "energy_renewables_priority",
        label:
          "Renoncer aux nouveaux réacteurs et concentrer les crédits sur sobriété, stockage et renouvelables",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "énergie",
          policyTopic: "ecology",
          text: "Aucun nouveau réacteur ne sera construit ; les crédits iront à la sobriété et aux renouvelables",
          stance: -55,
          ideology: { ecology: 6 },
        },
        result: outcome(
          "energy_renewable_break",
          "La sortie du nouveau nucléaire vous définit",
          "Les électeurs écologistes retrouvent une ligne nette et les acteurs du nucléaire annoncent une mobilisation contraire. Les questions de stockage et de stabilité du réseau deviennent désormais incontournables.",
          [
            bloc("green_progressives", 7),
            stat("mobilization", 3, "Marqueur écologique"),
            bloc("rural_working_class", -2),
            stat("rejection", 2, "Filière nucléaire opposée"),
          ],
          { setFlags: { no_new_nuclear: true } },
        ),
      }),
      decision({
        id: "energy_nuclear_priority",
        label:
          "Lancer dix réacteurs et ralentir les appels d’offres éoliens terrestres contestés localement",
        tag: "OFFENSIF",
        strategy: "policy_commitment",
        statement: {
          topic: "énergie",
          policyTopic: "ecology",
          text: "Dix nouveaux réacteurs assureront l’essentiel de la décarbonation électrique",
          stance: 60,
          ideology: { ecology: -3, economy: 2 },
        },
        result: outcome(
          "energy_nuclear_scale",
          "L’atome devient le pari industriel",
          "La proposition offre un horizon clair à la filière et réduit le conflit autour de l’éolien terrestre. Les délais de construction et l’adaptation climatique des centrales concentrent les critiques écologistes.",
          [
            bloc("executives", 5),
            bloc("conservative_retirees", 3),
            bloc("green_progressives", -6),
            hidden("economicCompetence", 1),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_immigration",
    title: "La loi migratoire du programme",
    category: "program",
    summary:
      "Le volet migratoire doit articuler contrôle des frontières, droit d’asile, travail et intégration. Une formule vague préserverait l’unité interne, mais laisserait le sujet aux candidats qui proposent déjà des mesures très précises.",
    themes: ["immigration", "civil_liberties"],
    importance: "major",
    phaseWeights: programPhases,
    choices: [
      decision({
        id: "immigration_faster_procedures",
        label:
          "Doubler les moyens des procédures d’asile et fixer un délai maximal pour chaque décision",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "immigration",
          policyTopic: "immigration",
          text: "Les procédures d’asile seront accélérées par des moyens supplémentaires et des délais garantis",
          stance: -10,
          ideology: { immigration: -1, authority: 1 },
        },
        result: outcome(
          "asylum_deadlines_funded",
          "La procédure devient votre réponse centrale",
          "Le dispositif promet des décisions plus rapides, qu’elles soient favorables ou non, et paraît administrativement applicable. Il satisfait peu les camps qui attendent une rupture quantitative ou une régularisation large.",
          [
            stat("credibility", 4, "Procédure applicable"),
            hidden("transferability", 2),
            stat("mediaPresence", -1, "Mesure peu clivante"),
          ],
        ),
      }),
      decision({
        id: "immigration_work_regularization",
        label:
          "Régulariser les travailleurs présents depuis cinq ans dans les métiers durablement en tension",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "immigration",
          policyTopic: "immigration",
          text: "Les travailleurs présents depuis cinq ans dans les métiers en tension seront régularisés",
          stance: -55,
          ideology: { immigration: -5, society: -2 },
        },
        result: outcome(
          "work_regularization_line",
          "Le travail devient le critère de régularisation",
          "Les employeurs concernés et les associations comprennent immédiatement la règle. Vos adversaires dénoncent un appel d’air et font de cette mesure le test principal de votre crédibilité aux frontières.",
          [
            bloc("young_urban_graduates", 4),
            bloc("entrepreneurs", 2),
            bloc("conservative_retirees", -5),
            stat("rejection", 3, "Régularisation contestée"),
          ],
        ),
      }),
      decision({
        id: "immigration_annual_quota",
        label:
          "Faire voter chaque année des objectifs migratoires par motif et renforcer les contrôles aux frontières",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "immigration",
          policyTopic: "immigration",
          text: "Le Parlement votera des objectifs migratoires annuels par motif",
          stance: 55,
          ideology: { immigration: 5, authority: 2 },
        },
        result: outcome(
          "migration_targets_parliament",
          "Le Parlement reçoit un objectif annuel",
          "La mesure répond à la demande de contrôle et donne un rendez-vous démocratique régulier. Les juristes rappellent que le droit d’asile ne peut être traité comme un quota, ce qui oblige à préciser rapidement le périmètre.",
          [
            bloc("conservative_retirees", 5),
            stat("mediaPresence", 3, "Objectifs annuels débattus"),
            bloc("green_progressives", -4),
            stat("credibility", 1, "Vote parlementaire"),
          ],
        ),
      }),
      decision({
        id: "immigration_european_pact",
        label:
          "Négocier un mécanisme européen d’asile et refuser tout objectif national avant cet accord",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        statement: {
          topic: "immigration",
          policyTopic: "immigration",
          text: "La politique d’asile sera négociée au niveau européen avant de fixer des objectifs nationaux",
          stance: 5,
          ideology: { europe: 4 },
        },
        result: outcome(
          "migration_european_priority",
          "L’échelle européenne prime sur la réponse immédiate",
          "La cohérence avec votre ligne européenne est nette et les électeurs modérés y voient une méthode réaliste. L’absence de mesure nationale immédiate alimente l’accusation d’attendre un accord incertain.",
          [
            hidden("consistency", 3),
            hidden("transferability", 3),
            stat("credibility", -1, "Accord encore hypothétique"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_health",
    title: "Le prochain budget de la santé",
    category: "program",
    summary:
      "Les directeurs d’hôpital et les soignants demandent des moyens immédiats, tandis que votre équipe insiste sur la prévention et la médecine de ville. Le programme ne peut financer toutes les priorités dès la première année.",
    themes: ["public_services", "social_issues"],
    importance: "major",
    phaseWeights: programPhases,
    choices: [
      decision({
        id: "health_hospital_staff",
        label:
          "Financer cinquante mille postes hospitaliers en relevant les recettes affectées à la santé",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "santé",
          policyTopic: "public_services",
          text: "Cinquante mille postes hospitaliers seront financés par des recettes nouvelles",
          stance: -55,
          ideology: { economy: -3 },
        },
        result: outcome(
          "hospital_staff_first",
          "Les effectifs passent avant la transformation",
          "Les équipes hospitalières disposent d’un engagement quantifié et mobilisateur. Le recrutement réel et la recette choisie restent à sécuriser, ce qui ouvre deux fronts techniques sans affaiblir la priorité politique.",
          [
            bloc("public_services", 7),
            stat("mobilization", 3, "Priorité hospitalière"),
            hidden("economicCompetence", -3),
            stat("credibility", 1, "Objectif chiffré"),
          ],
        ),
      }),
      decision({
        id: "health_primary_care",
        label:
          "Créer un service territorial de soins primaires avec équipes salariées dans les zones sous-dotées",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "santé",
          policyTopic: "public_services",
          text: "Un service territorial salarié garantira les soins primaires dans les zones sous-dotées",
          stance: -35,
        },
        result: outcome(
          "primary_care_service",
          "La médecine de proximité reçoit un opérateur",
          "Les collectivités voient comment ouvrir concrètement des équipes là où l’installation libérale ne suffit plus. Les représentants de médecins indépendants contestent le modèle salarié, mais le calendrier est jugé réalisable.",
          [
            stat("localStrength", 4, "Solution territoriale"),
            bloc("rural_working_class", 5),
            stat("credibility", 3, "Calendrier applicable"),
          ],
        ),
      }),
      decision({
        id: "health_prevention_budget",
        label:
          "Réserver dix pour cent des crédits nouveaux à la prévention et publier des objectifs sanitaires",
        tag: "TECHNIQUE",
        strategy: "long_term_strategy",
        statement: {
          topic: "santé",
          policyTopic: "public_services",
          text: "Dix pour cent des crédits nouveaux de santé seront consacrés à la prévention",
          stance: -15,
        },
        result: outcome(
          "prevention_budget_ringfenced",
          "La prévention obtient une part protégée",
          "Les objectifs sur le diabète, le dépistage et la santé au travail donnent une mesure à long terme. Les urgences hospitalières rappellent que ce fléchage ne réduit pas leur manque d’effectifs demain matin.",
          [
            stat("credibility", 4, "Objectifs sanitaires"),
            hidden("economicCompetence", 3),
            stat("popularity", -1, "Effet peu immédiat"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_school",
    title: "La promesse faite à l’école",
    category: "program",
    summary:
      "À Dijon, enseignants, parents et lycéens confrontent votre programme aux classes sans remplaçant et aux écarts de niveau. Les moyens, l’autonomie des établissements et les programmes scolaires appellent des réponses différentes.",
    themes: ["public_services", "social_issues"],
    phaseWeights: programPhases,
    entityReferences: [{ entityId: "dijon", role: "location" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "school_teacher_pay",
        label:
          "Augmenter les salaires enseignants contre deux heures hebdomadaires dédiées au suivi des élèves",
        tag: "INSTITUTIONNEL",
        strategy: "negotiation",
        statement: {
          topic: "école",
          policyTopic: "public_services",
          text: "Les enseignants seront revalorisés avec du temps garanti pour le suivi individuel",
          stance: -25,
        },
        result: outcome(
          "teacher_pay_with_time",
          "La revalorisation vient avec une nouvelle mission",
          "La hausse salariale répond à une attente ancienne, mais le temps supplémentaire est contesté selon les établissements. Le compromis ouvre une négociation sérieuse plutôt qu’une adhésion automatique.",
          [
            bloc("public_services", 4),
            stat("credibility", 3, "Contrepartie explicite"),
            stat("cohesion", 1, "Accord interne"),
          ],
        ),
      }),
      decision({
        id: "school_class_size",
        label:
          "Garantir vingt élèves maximum dans les écoles des quartiers et territoires les plus fragiles",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "école",
          policyTopic: "public_services",
          text: "Les classes seront limitées à vingt élèves dans les territoires les plus fragiles",
          stance: -45,
          ideology: { economy: -2 },
        },
        result: outcome(
          "class_size_targeted",
          "La taille des classes devient mesurable",
          "Le ciblage territorial rend la promesse plus finançable et parle directement aux familles concernées. Les communes juste au-dessus des critères dénoncent un seuil arbitraire que vous devrez défendre.",
          [
            bloc("young_precarious", 4),
            stat("localStrength", 3, "Priorité territoriale"),
            hidden("economicCompetence", -1),
          ],
        ),
      }),
      decision({
        id: "school_autonomy",
        label:
          "Donner aux établissements un budget et une autonomie de recrutement sous contrôle académique",
        tag: "CLIVANT",
        strategy: "program_shift",
        statement: {
          topic: "école",
          policyTopic: "public_services",
          text: "Les établissements disposeront d’une autonomie budgétaire et de recrutement contrôlée",
          stance: 45,
          ideology: { economy: 3, authority: 1 },
        },
        result: outcome(
          "school_autonomy_divides",
          "L’autonomie redessine le service public",
          "Les chefs d’établissement gagnent une marge d’action attendue et les syndicats craignent des inégalités durables entre territoires. La proposition élargit votre offre au prix d’un conflit idéologique clair.",
          [
            bloc("executives", 4),
            bloc("public_services", -5),
            stat("mediaPresence", 3, "Réforme structurante"),
            stat("rejection", 2, "Inégalités redoutées"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_europe",
    title: "La règle européenne à changer",
    category: "program",
    summary:
      "Votre chapitre européen doit expliquer ce que la France demandera, ce qu’elle acceptera en échange et ce qu’elle fera en cas de refus. La monnaie, le budget et la souveraineté rendent une position seulement symbolique peu crédible.",
    themes: ["europe", "economy"],
    importance: "major",
    phaseWeights: programPhases,
    entityReferences: [
      { entityId: "union_europeenne", role: "institution" },
      { entityId: "commission_europeenne", role: "context" },
      { entityId: "bce", role: "context" },
    ],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "europe_investment_rule",
        label:
          "Négocier lexclusion des investissements climatiques du calcul des déficits nationaux",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        statement: {
          topic: "Europe",
          policyTopic: "europe",
          text: "La France demandera une règle budgétaire distincte pour les investissements climatiques",
          stance: 35,
          ideology: { europe: 3, ecology: 2 },
        },
        result: outcome(
          "europe_green_investment_rule",
          "Le climat donne un objet à la négociation",
          "La demande rassemble plusieurs sensibilités favorables à l’Union et peut intéresser d’autres gouvernements. Son adoption n’est pas garantie, mais vous avez défini une priorité et une coalition possible.",
          [
            bloc("green_progressives", 5),
            bloc("executives", 2),
            stat("credibility", 3, "Demande européenne précise"),
            hidden("transferability", 3),
          ],
        ),
      }),
      decision({
        id: "europe_national_opt_out",
        label:
          "Demander une clause dexception nationale et suspendre les règles contestées en cas de refus",
        tag: "OFFENSIF",
        strategy: "break",
        statement: {
          topic: "Europe",
          policyTopic: "europe",
          text: "La France suspendra certaines règles si aucune clause d’exception n’est accordée",
          stance: -55,
          ideology: { europe: -6, authority: 2 },
        },
        result: outcome(
          "europe_opt_out_ultimatum",
          "La clause dexception devient un ultimatum",
          "La position séduit les électeurs attachés à l’autonomie nationale et inquiète les acteurs économiques exposés à l’Union. Vos partenaires potentiels exigent désormais de connaître précisément les règles visées.",
          [
            stat("mobilization", 4, "Souveraineté affirmée"),
            bloc("executives", -5),
            stat("rejection", 3, "Risque européen"),
            hidden("baseSupport", 2),
          ],
          { setFlags: { european_opt_out: true } },
        ),
      }),
      decision({
        id: "europe_federal_budget",
        label: "Proposer un budget européen permanent financé par des ressources communes",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "Europe",
          policyTopic: "europe",
          text: "Un budget européen permanent financera les biens communs du continent",
          stance: 70,
          ideology: { europe: 7 },
        },
        result: outcome(
          "europe_common_budget",
          "Le fédéralisme budgétaire est assumé",
          "La proposition donne une direction de long terme à votre projet et attire les plus européistes. Elle crée également une ligne d’attaque simple pour les souverainistes et complique les alliances du second tour.",
          [
            bloc("young_urban_graduates", 5),
            stat("cohesion", 2, "Ligne européenne nette"),
            bloc("rural_working_class", -4),
            hidden("transferability", -1),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_institutions",
    title: "La présidence que vous proposez",
    category: "program",
    summary:
      "Une conférence à l’Assemblée nationale vous oblige à préciser l’équilibre des pouvoirs. Référendum, proportionnelle, responsabilité présidentielle et rôle du Parlement peuvent se combiner, mais chaque réforme crée ses propres risques institutionnels.",
    themes: ["institutions", "civil_liberties"],
    importance: "major",
    phaseWeights: programPhases,
    entityReferences: [{ entityId: "assemblee_nationale", role: "location" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "institutions_proportional",
        label:
          "Introduire une dose majoritaire de proportionnelle et renforcer les droits du Parlement",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "institutions",
          policyTopic: "institutions",
          text: "Les législatives intégreront la proportionnelle et le Parlement contrôlera davantage l’exécutif",
          stance: -25,
          ideology: { authority: -3 },
        },
        result: outcome(
          "institutions_parliament_strengthened",
          "Le Parlement gagne du poids",
          "La réforme paraît compatible avec la Ve République tout en modifiant la représentation. Elle intéresse les partis susceptibles de devenir alliés et suscite les critiques de ceux qui redoutent des majorités instables.",
          [
            stat("credibility", 4, "Réforme applicable"),
            hidden("transferability", 5),
            stat("cohesion", 1, "Compromis institutionnel"),
          ],
        ),
      }),
      decision({
        id: "institutions_constituent",
        label: "Convoquer une assemblée constituante élue et soumettre son texte à référendum",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "institutions",
          policyTopic: "institutions",
          text: "Une assemblée constituante élue préparera une nouvelle République",
          stance: -75,
          ideology: { authority: -6 },
        },
        result: outcome(
          "institutions_constituent_process",
          "La rupture constitutionnelle a sa procédure",
          "Le calendrier électif et le référendum rendent la proposition moins abstraite et mobilisent les partisans d’une nouvelle République. Les électeurs attachés à la stabilité demandent ce qui gouvernera pendant la transition.",
          [
            stat("mobilization", 5, "Rupture institutionnelle"),
            bloc("young_precarious", 3),
            bloc("moderate_retirees", -5),
            stat("rejection", 3, "Transition incertaine"),
          ],
          { setFlags: { constituent_assembly_promised: true } },
        ),
      }),
      decision({
        id: "institutions_referendum",
        label:
          "Élargir le référendum dinitiative partagée avec contrôle préalable du Conseil constitutionnel",
        tag: "RASSEMBLEUR",
        strategy: "compromise",
        statement: {
          topic: "institutions",
          policyTopic: "institutions",
          text: "Le référendum dinitiative partagée sera accessible sous contrôle constitutionnel",
          stance: -35,
          ideology: { authority: -2 },
        },
        result: outcome(
          "institutions_referendum_guardrails",
          "La participation reçoit des garde-fous",
          "Le seuil abaissé rend l’outil réellement utilisable et le contrôle préalable rassure sur les libertés fondamentales. La mesure manque du souffle d’une nouvelle République mais élargit votre coalition potentielle.",
          [
            hidden("transferability", 5),
            stat("credibility", 3, "Garde-fous juridiques"),
            stat("mediaPresence", 1, "Réforme comprise"),
          ],
        ),
      }),
      decision({
        id: "institutions_presidential_power",
        label:
          "Conserver les institutions actuelles et limiter seulement les nominations présidentielles",
        tag: "PRUDENT",
        strategy: "long_term_strategy",
        statement: {
          topic: "institutions",
          policyTopic: "institutions",
          text: "La Ve République sera conservée avec un contrôle accru des nominations présidentielles",
          stance: 30,
          ideology: { authority: 2 },
        },
        result: outcome(
          "institutions_continuity_checked",
          "La continuité reçoit un contre-pouvoir ciblé",
          "Les électeurs soucieux de stabilité comprennent la réforme et les juristes la jugent réaliste. Votre camp le plus réformateur y voit une occasion manquée de corriger la concentration du pouvoir.",
          [
            bloc("moderate_retirees", 4),
            stat("credibility", 3, "Réforme limitée"),
            stat("cohesion", -2, "Réformateurs déçus"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "program_climate_adaptation",
    title: "La France à cinquante degrés",
    category: "program",
    summary:
      "À Montpellier, urbanistes, agriculteurs et médecins vous demandent comment adapter le pays aux canicules et aux sécheresses. La prévention exige des dépenses peu visibles avant que la prochaine crise ne les rende indispensables.",
    themes: ["ecology", "public_services"],
    importance: "major",
    phaseWeights: programPhases,
    entityReferences: [{ entityId: "montpellier", role: "location" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "climate_adaptation_fund",
        label:
          "Créer un fonds pluriannuel pour l’eau, les écoles, les hôpitaux et les logements exposés",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "adaptation climatique",
          policyTopic: "ecology",
          text: "Un fonds pluriannuel financera l’adaptation des services et logements aux canicules",
          stance: -45,
          ideology: { ecology: 5, economy: -2 },
        },
        result: outcome(
          "adaptation_fund_created",
          "L’adaptation reçoit un budget durable",
          "Les collectivités peuvent enfin planifier les travaux au-delà d’un exercice budgétaire. Le montant nécessaire est élevé et concurrence plusieurs promesses sociales déjà annoncées.",
          [
            bloc("green_progressives", 6),
            stat("localStrength", 4, "Collectivités financées"),
            hidden("economicCompetence", -2),
            stat("credibility", 2, "Budget pluriannuel"),
          ],
        ),
      }),
      decision({
        id: "climate_water_rules",
        label:
          "Réviser les règles de partage de l’eau bassin par bassin avec quotas activés en sécheresse",
        tag: "TECHNIQUE",
        strategy: "negotiation",
        statement: {
          topic: "adaptation climatique",
          policyTopic: "ecology",
          text: "Des quotas d’eau négociés par bassin s’appliqueront automatiquement en période de sécheresse",
          stance: -30,
          ideology: { ecology: 4 },
        },
        result: outcome(
          "water_basin_rules",
          "Le partage de l’eau devient anticipé",
          "La règle automatique évite de négocier au cœur de chaque crise et laisse aux bassins une adaptation locale. Les usages agricoles et industriels se préparent déjà à contester les quotas proposés.",
          [
            stat("credibility", 4, "Règle anticipée"),
            stat("localStrength", 3, "Négociation par bassin"),
            bloc("rural_working_class", -2),
          ],
        ),
      }),
      decision({
        id: "climate_insurance",
        label:
          "Obliger les assureurs à couvrir les risques climatiques avec garantie publique en dernier ressort",
        tag: "CLIVANT",
        strategy: "legal_action",
        statement: {
          topic: "adaptation climatique",
          policyTopic: "ecology",
          text: "Les risques climatiques resteront assurables grâce à une obligation et une garantie publique",
          stance: -20,
          ideology: { ecology: 3 },
        },
        result: outcome(
          "climate_insurance_guarantee",
          "L’assurabilité devient une responsabilité partagée",
          "Les propriétaires exposés accueillent la garantie et les assureurs demandent une tarification plus libre. Le mécanisme traite les pertes après sinistre, sans répondre à lui seul au besoin de prévention.",
          [
            bloc("middle_class_workers", 4),
            stat("credibility", 2, "Garantie explicite"),
            stat("rejection", 1, "Assureurs opposés"),
            hidden("economicCompetence", 1),
          ],
        ),
      }),
    ],
  }),
];
