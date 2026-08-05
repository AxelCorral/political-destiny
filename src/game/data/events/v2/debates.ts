import type { GameEventDefinition } from "@/game/types";

import { bloc, choice, decision, event, flag, hidden, outcome, stat, trait } from "../authoring";

const debatePhases = { campaign: 0.65, official_campaign: 1 } as const;

export const v2DebateEvents: GameEventDefinition[] = [
  event({
    id: "debate_economy_round",
    title: "Le duel sur les huit milliards",
    category: "debate",
    summary:
      "Lors du débat de premier tour sur France 2, votre adversaire additionne vos nouvelles dépenses et affirme qu’il manque huit milliards. Vous disposez de quatre-vingt-dix secondes, du tableau budgétaire et d’une promesse que votre propre équipe vient de réviser.",
    themes: ["economy", "fiscality"],
    importance: "decisive",
    phaseWeights: debatePhases,
    minDecisionIndex: 8,
    entityReferences: [
      { entityId: "france_2", role: "host" },
      { entityId: "debat_premier_tour", role: "context" },
    ],
    editorialSensitivity: "none",
    chain: { id: "debate_evidence", step: 1 },
    choices: [
      choice({
        id: "economy_round_walk_numbers",
        label:
          "Reprendre les huit milliards poste par poste et nommer la mesure récemment corrigée",
        tag: "TECHNIQUE",
        strategy: "media_response",
        outcomes: [
          outcome(
            "economy_round_numbers_land",
            "Le tableau tient à l’écran",
            "Vous isolez chaque recette et reconnaissez la correction sans perdre le fil. Le format est serré, mais la démonstration rend l’accusation moins crédible et confirme la préparation budgétaire.",
            [
              stat("credibility", 6, "Réponse chiffrée"),
              hidden("economicCompetence", 5),
              stat("momentum", 3, "Duel remporté"),
            ],
            {
              weight: 0.64,
              modifiers: [
                { source: "trait", key: "competence", coefficient: 0.04 },
                { source: "consistency", key: "global", coefficient: 0.03 },
              ],
            },
          ),
          outcome(
            "economy_round_numbers_overrun",
            "Le chronomètre coupe la démonstration",
            "La première moitié du calcul est solide, puis votre temps expire avant la recette principale. Votre adversaire conserve sa formule simple et votre équipe doit publier la réponse complète après l’émission.",
            [
              stat("credibility", -2, "Démonstration inachevée"),
              stat("mediaPresence", 2, "Extrait très commenté"),
              hidden("economicCompetence", 1),
            ],
            { weight: 0.36 },
          ),
        ],
      }),
      decision({
        id: "economy_round_counter_project",
        label:
          "Comparer immédiatement le coût de votre projet à celui annoncé par votre adversaire",
        tag: "OFFENSIF",
        strategy: "media_response",
        result: outcome(
          "economy_round_counterattack",
          "Les deux projets passent au même test",
          "Vous évitez de nier la dépense et obligez votre adversaire à défendre ses propres hypothèses. Le duel devient équilibré, sans fermer complètement la question sur vos huit milliards.",
          [
            stat("mediaPresence", 4, "Confrontation directe"),
            stat("momentum", 2, "Adversaire mis en défense"),
            stat("credibility", -1, "Réponse partielle"),
          ],
        ),
      }),
      decision({
        id: "economy_round_drop_measure",
        label: "Retirer en direct la dépense non financée et annoncer la mise à jour du programme",
        tag: "TRANSPARENT",
        strategy: "policy_commitment",
        statement: {
          topic: "budget",
          policyTopic: "fiscality",
          text: "Toute mesure sans financement robuste sera retirée du programme",
          stance: 15,
        },
        result: outcome(
          "economy_round_live_arbitration",
          "Une promesse tombe sur le plateau",
          "La décision surprend votre adversaire et prouve que la contrainte budgétaire a un effet réel. Les bénéficiaires de la mesure retirée apprennent cependant votre arbitrage en même temps que le pays.",
          [
            stat("credibility", 5, "Arbitrage immédiat"),
            stat("popularity", -3, "Promesse abandonnée"),
            hidden("consistency", 2),
          ],
          { setFlags: { debate_measure_withdrawn: true } },
        ),
      }),
      decision({
        id: "economy_round_values",
        label:
          "Refuser la bataille comptable et défendre les bénéficiaires concrets de chaque dépense",
        tag: "POPULAIRE",
        strategy: "symbolic_action",
        result: outcome(
          "economy_round_values_over_accounts",
          "Les bénéficiaires remplacent les colonnes",
          "Votre réponse redonne un sens social aux montants et mobilise votre socle. Les téléspectateurs qui attendaient un financement restent sans réponse, ce qui fragilise votre crédibilité économique après le débat.",
          [
            stat("mobilization", 4, "Priorités incarnées"),
            bloc("young_precarious", 3),
            stat("credibility", -4, "Financement éludé"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "debate_security_round",
    title: "Trois minutes sur la sécurité",
    category: "debate",
    summary:
      "Le débat de premier tour aborde les violences du quotidien. Une maire fictive décrit des agressions autour d’une gare et demande une mesure applicable cet été. Votre programme partage les moyens entre police, justice et prévention.",
    themes: ["security", "civil_liberties"],
    importance: "decisive",
    phaseWeights: debatePhases,
    minDecisionIndex: 10,
    entityReferences: [{ entityId: "debat_premier_tour", role: "context" }],
    editorialSensitivity: "contextual",
    choices: [
      decision({
        id: "security_round_local_plan",
        label:
          "Proposer une cellule police-justice locale avec objectifs publics et renforts durant six mois",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "sécurité",
          policyTopic: "security",
          text: "Des cellules locales police-justice recevront des objectifs publics et des renforts temporaires",
          stance: 30,
          ideology: { authority: 2 },
        },
        result: outcome(
          "security_round_local_contract",
          "La maire obtient une chaîne de responsabilité",
          "La réponse nomme les services, la durée et l’évaluation attendue. Elle paraît moins spectaculaire qu’une promesse nationale d’expulsion ou d’effectifs, mais s’applique directement au cas présenté.",
          [
            stat("credibility", 5, "Réponse applicable"),
            stat("localStrength", 3, "Maire associée"),
            hidden("securityCompetence", 4),
          ],
        ),
      }),
      decision({
        id: "security_round_police_posts",
        label:
          "Annoncer dix mille recrutements de policiers et les affecter prioritairement aux transports",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "sécurité",
          policyTopic: "security",
          text: "Dix mille policiers supplémentaires seront affectés en priorité aux transports",
          stance: 60,
          ideology: { authority: 5 },
        },
        result: outcome(
          "security_round_police_commitment",
          "Le chiffre domine la séquence",
          "La promesse donne une réponse simple et rassure les électeurs les plus préoccupés par la sécurité. Le délai de formation et le financement deviennent les deux objections centrales dès la fin du débat.",
          [
            bloc("conservative_retirees", 6),
            bloc("middle_class_workers", 3),
            stat("mediaPresence", 4, "Engagement chiffré"),
            hidden("economicCompetence", -2),
          ],
        ),
      }),
      decision({
        id: "security_round_prevention",
        label:
          "Financer des médiateurs, léclairage et les transports nocturnes avant de promettre de nouveaux effectifs",
        tag: "PRUDENT",
        strategy: "policy_commitment",
        statement: {
          topic: "sécurité",
          policyTopic: "security",
          text: "La prévention locale et les transports nocturnes précéderont les recrutements nationaux",
          stance: -30,
          ideology: { authority: -3 },
        },
        result: outcome(
          "security_round_prevention_first",
          "La prévention répond au lieu, pas à toute la peur",
          "Les mesures peuvent être déployées rapidement autour de la gare et convainquent les élus urbains. Une partie du public y voit une réponse périphérique qui refuse de parler de police et de sanctions.",
          [
            bloc("young_urban_graduates", 4),
            stat("localStrength", 3, "Mesures urbaines"),
            bloc("conservative_retirees", -5),
            stat("rejection", 2, "Réponse jugée insuffisante"),
          ],
        ),
      }),
      decision({
        id: "security_round_liberties",
        label:
          "Conditionner tout renfort à un contrôle indépendant des pratiques et à des données publiques",
        tag: "TRANSPARENT",
        strategy: "legal_action",
        statement: {
          topic: "sécurité",
          policyTopic: "civil_liberties",
          text: "Les renforts de sécurité seront accompagnés d’un contrôle indépendant et de données publiques",
          stance: -45,
          ideology: { authority: -4 },
        },
        result: outcome(
          "security_round_rights_condition",
          "La sécurité reçoit un contrôle public",
          "Vous acceptez le besoin de renforts tout en fixant une garantie mesurable sur les pratiques. La nuance élargit le débat, mais ne répond pas complètement à la demande d’une mesure dès cet été.",
          [
            bloc("green_progressives", 4),
            stat("credibility", 3, "Garantie contrôlable"),
            hidden("transferability", 2),
            stat("popularity", -1, "Urgence partiellement traitée"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "debate_free_conclusion",
    title: "La minute qui vous appartient",
    category: "debate",
    summary:
      "À la fin du grand débat, chaque candidat dispose d’une minute libre. Vos interventions techniques ont rassuré sans créer de moment fort ; votre équipe hésite entre résumer le contrat proposé, raconter une rencontre ou viser directement le vote utile.",
    themes: ["institutions"],
    importance: "decisive",
    phaseWeights: debatePhases,
    minDecisionIndex: 15,
    choices: [
      decision({
        id: "free_conclusion_contract",
        label: "Résumer trois engagements, leur financement et la première décision des cent jours",
        tag: "PRÉSIDENTIEL",
        strategy: "media_response",
        result: outcome(
          "free_conclusion_governing_contract",
          "Une minute de contrat gouvernemental",
          "La conclusion relie la campagne à l’exercice du pouvoir et confirme votre sérieux. Elle ne produit pas la phrase virale espérée, mais donne aux électeurs hésitants une raison ordonnée de vous choisir.",
          [
            stat("credibility", 5, "Contrat de gouvernement"),
            hidden("transferability", 4),
            stat("momentum", 2, "Conclusion solide"),
          ],
        ),
      }),
      decision({
        id: "free_conclusion_story",
        label:
          "Raconter la rencontre d’une aide-soignante et relier son quotidien à votre priorité sociale",
        tag: "POPULAIRE",
        strategy: "symbolic_action",
        result: outcome(
          "free_conclusion_story_resonates",
          "Un visage reste après le débat",
          "Le récit est précis, respectueux et ramène plusieurs thèmes à une expérience concrète. Il humanise votre candidature sans détailler les arbitrages, ce qui renforce ladhésion émotionnelle plus que la crédibilité technique.",
          [
            stat("popularity", 5, "Récit incarné"),
            bloc("public_services", 4),
            stat("credibility", -1, "Peu de détails"),
          ],
        ),
      }),
      decision({
        id: "free_conclusion_useful_vote",
        label:
          "Appeler les électeurs proches à concentrer leurs voix sur votre candidature dès le premier tour",
        tag: "OFFENSIF",
        strategy: "long_term_strategy",
        result: outcome(
          "free_conclusion_useful_vote",
          "Le vote utile entre dans la dernière ligne droite",
          "L’appel inquiète les candidats voisins et convainc certains indécis que la qualification se joue maintenant. Il réduit votre capacité à négocier sereinement avec ces mêmes partis après le débat.",
          [
            stat("polling", 1.4, "Vote utile"),
            stat("momentum", 4, "Qualification mise en jeu"),
            hidden("transferability", -4),
            stat("rejection", 1, "Pression sur les électeurs"),
          ],
          { setFlags: { useful_vote_appeal: true } },
        ),
      }),
      decision({
        id: "free_conclusion_democratic",
        label:
          "Demander aux téléspectateurs de comparer les programmes et promettre de respecter leur choix",
        tag: "RASSEMBLEUR",
        strategy: "long_term_strategy",
        result: outcome(
          "free_conclusion_democratic_tone",
          "La campagne se termine sans ultimatum",
          "Le ton apaise un débat tendu et améliore votre image auprès des électeurs susceptibles de vous rejoindre plus tard. Vos militants regrettent une conclusion peu combative à quelques jours du scrutin.",
          [
            hidden("transferability", 6),
            stat("rejection", -3, "Ton démocratique"),
            stat("mobilization", -2, "Socle moins stimulé"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "debate_duel_interruption",
    title: "L’adversaire refuse de vous laisser répondre",
    category: "debate",
    summary:
      "Pendant un duel économique, votre adversaire fictif vous coupe quatre fois et transforme l’échange en brouhaha. La modératrice intervient sans parvenir à rétablir le temps de parole. Votre prochaine réaction définira le ton de la confrontation.",
    themes: ["economy", "institutions"],
    importance: "major",
    phaseWeights: debatePhases,
    minDecisionIndex: 9,
    entityReferences: [{ entityId: "debat_premier_tour", role: "context" }],
    editorialSensitivity: "none",
    choices: [
      choice({
        id: "duel_interruption_wait",
        label: "Attendre le silence, rappeler calmement la règle puis répondre au chiffre contesté",
        tag: "PRÉSIDENTIEL",
        strategy: "media_response",
        outcomes: [
          outcome(
            "duel_interruption_authority",
            "Le calme impose enfin le silence",
            "Votre pause devient visible et la salle se tait avant votre rappel de la règle. La réponse économique passe ensuite sans interruption et vous gagnez la séquence par maîtrise plutôt que par volume.",
            [
              stat("credibility", 4, "Maîtrise du débat"),
              stat("popularity", 3, "Autorité calme"),
              hidden("transferability", 2),
            ],
            {
              weight: 0.66,
              modifiers: [{ source: "trait", key: "authority", coefficient: 0.045 }],
            },
          ),
          outcome(
            "duel_interruption_silence_lost",
            "La pause ressemble à une hésitation",
            "L’adversaire profite du silence pour conclure sa critique et la modératrice change de thème. Votre retenue évite le chaos, mais votre réponse économique ne sera jamais entendue.",
            [
              stat("mediaPresence", -2, "Réponse inaudible"),
              stat("momentum", -2, "Duel subi"),
              hidden("economicCompetence", -1),
            ],
            { weight: 0.34 },
          ),
        ],
      }),
      decision({
        id: "duel_interruption_confront",
        label: "Couper à votre tour et exiger que chacun lise son propre financement à voix haute",
        tag: "OFFENSIF",
        strategy: "personal_risk",
        result: outcome(
          "duel_interruption_showdown",
          "Le brouhaha devient épreuve de vérité",
          "La confrontation est désordonnée mais le défi sur les financements marque les esprits. Votre adversaire refuse l’exercice, ce qui vous offre un extrait favorable sans restaurer la qualité du débat.",
          [
            stat("mediaPresence", 5, "Duel spectaculaire"),
            stat("momentum", 3, "Défi lancé"),
            stat("rejection", 2, "Brouhaha prolongé"),
          ],
        ),
      }),
      decision({
        id: "duel_interruption_moderator",
        label: "Demander à la modératrice de restituer précisément votre temps avant de poursuivre",
        tag: "INSTITUTIONNEL",
        strategy: "legal_action",
        result: outcome(
          "duel_interruption_time_restored",
          "Le chronomètre rend la parole",
          "La production vous accorde quarante secondes supplémentaires et applique la même règle à tous. Votre réponse est entendue, mais certains commentateurs jugent l’appel au règlement excessivement procédurier.",
          [
            stat("credibility", 3, "Temps de parole restauré"),
            stat("popularity", -1, "Réaction procédurière"),
            hidden("consistency", 1),
          ],
        ),
      }),
      decision({
        id: "duel_interruption_direct_address",
        label:
          "Cesser de répondre à l’adversaire et expliquer votre mesure directement à la caméra",
        tag: "POPULAIRE",
        strategy: "media_response",
        result: outcome(
          "duel_interruption_camera_answer",
          "La caméra remplace le duel",
          "Vous rendez la mesure compréhensible sans alimenter la querelle et plusieurs téléspectateurs retiennent le contraste de ton. L’adversaire vous accuse toutefois d’avoir évité sa critique précise.",
          [
            stat("popularity", 4, "Adresse directe"),
            stat("credibility", 1, "Mesure expliquée"),
            stat("mediaPresence", 2, "Contraste de ton"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "debate_unknown_question",
    title: "La question venue de Mayotte",
    category: "debate",
    summary:
      "Une habitante de Mayotte vous interroge sur l’accès à l’eau et la reconstruction des services publics. La fiche prévue par votre équipe traite surtout d’immigration ; vous connaissez le cadre national, pas les chiffres locaux demandés.",
    themes: ["public_services", "immigration"],
    importance: "major",
    phaseWeights: debatePhases,
    minDecisionIndex: 8,
    entityReferences: [{ entityId: "mayotte", role: "location" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "unknown_question_admit",
        label:
          "Reconnaître que vous ignorez le chiffre local et annoncer une réponse documentée sous vingt-quatre heures",
        tag: "TRANSPARENT",
        strategy: "media_response",
        result: outcome(
          "unknown_question_honest_limit",
          "Une limite reconnue, une réponse attendue",
          "L’aveu surprend dans un débat où chacun prétend tout maîtriser. Votre équipe publie le lendemain des données vérifiées et un calendrier, ce qui transforme la lacune en preuve de méthode.",
          [
            stat("credibility", 4, "Ignorance reconnue"),
            stat("mediaPresence", 2, "Réponse documentée ensuite"),
            stat("localStrength", 2, "Engagement ultramarin"),
            trait("integrity", 1, "Limite reconnue"),
          ],
          {
            delayedEffects: [
              {
                afterDecisions: 1,
                narrative: "Le dossier promis sur Mayotte est publié avec des chiffres vérifiés.",
                effects: [
                  stat("credibility", 2, "Promesse documentaire tenue"),
                  hidden("consistency", 2),
                ],
              },
            ],
            setFlags: { mayotte_answer_promised: true },
          },
        ),
      }),
      decision({
        id: "unknown_question_national_plan",
        label:
          "Répondre par votre plan national pour l’eau et garantir une priorité ultramarine au premier budget",
        tag: "PRÉSIDENTIEL",
        strategy: "policy_commitment",
        statement: {
          topic: "services publics ultramarins",
          policyTopic: "public_services",
          text: "Le premier budget donnera la priorité à l’eau et aux services publics ultramarins",
          stance: -40,
        },
        result: outcome(
          "unknown_question_national_commitment",
          "Mayotte obtient une priorité budgétaire",
          "Vous ne fournissez pas le chiffre demandé, mais l’engagement de premier budget donne une conséquence au débat. Les autres territoires ultramarins demandent aussitôt s’ils bénéficieront de la même priorité.",
          [
            stat("localStrength", 5, "Priorité ultramarine"),
            stat("credibility", 1, "Engagement daté"),
          ],
        ),
      }),
      choice({
        id: "unknown_question_estimate",
        label:
          "Estimer le chiffre à partir de vos notes et proposer immédiatement un montant d’investissement",
        tag: "RISQUÉ",
        strategy: "personal_risk",
        outcomes: [
          outcome(
            "unknown_question_estimate_close",
            "L’ordre de grandeur est juste",
            "Votre estimation correspond aux données disponibles et le montant proposé paraît compatible avec les besoins. La prise de risque donne une réponse nette sans prétendre connaître chaque détail territorial.",
            [
              stat("credibility", 5, "Estimation correcte"),
              stat("momentum", 3, "Réponse improvisée"),
              stat("localStrength", 3, "Mayotte prise en compte"),
            ],
            {
              weight: 0.46,
              modifiers: [{ source: "trait", key: "competence", coefficient: 0.04 }],
            },
          ),
          outcome(
            "unknown_question_estimate_wrong",
            "Le chiffre confond deux réseaux",
            "Vous utilisez une donnée qui concerne l’assainissement plutôt que l’accès à l’eau. La confusion est corrigée en direct et devient un exemple de la faible préparation ultramarine de votre campagne.",
            [
              stat("credibility", -6, "Chiffre territorial erroné"),
              stat("rejection", 2, "Mayotte mal préparée"),
              stat("localStrength", -4, "Confiance ultramarine perdue"),
            ],
            { weight: 0.54, setFlags: { mayotte_number_error: true } },
          ),
        ],
      }),
      decision({
        id: "unknown_question_local_audit",
        label:
          "Proposer un audit de quatre semaines mené avec les élus et les services publics de Mayotte",
        tag: "INSTITUTIONNEL",
        strategy: "long_term_strategy",
        result: outcome(
          "unknown_question_audit_committed",
          "Un audit territorial remplace le chiffre improvisé",
          "Vous ne prétendez pas résoudre le dossier en direct et décrivez une méthode associant les acteurs locaux. Le délai paraît sérieux, mais la questionneuse attendait aussi une réponse sur l’urgence immédiate.",
          [
            stat("credibility", 3, "Méthode territoriale"),
            stat("localStrength", 4, "Élus associés"),
            stat("popularity", -1, "Urgence différée"),
          ],
          {
            delayedEffects: [
              {
                afterDecisions: 3,
                narrative:
                  "L’audit promis à Mayotte publie ses premières priorités sur l’eau et les services.",
                effects: [stat("credibility", 2, "Audit publié"), hidden("consistency", 2)],
              },
            ],
            setFlags: { mayotte_local_audit: true },
          },
        ),
      }),
    ],
  }),
  event({
    id: "debate_all_candidates",
    title: "Neuf candidats face au climat",
    category: "debate",
    summary:
      "Dans le débat réunissant neuf candidatures, chacun doit nommer une mesure climatique abandonnée si elle échoue au contrôle de financement. Les réponses précédentes se ressemblent et votre tour arrive après trois promesses de rénovation.",
    themes: ["ecology", "economy"],
    importance: "decisive",
    phaseWeights: debatePhases,
    minDecisionIndex: 12,
    entityReferences: [{ entityId: "debat_premier_tour", role: "context" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "all_candidates_drop_subsidy",
        label:
          "Retirer une subvention automobile et transférer les crédits vers les transports régionaux",
        tag: "TRANSPARENT",
        strategy: "policy_commitment",
        statement: {
          topic: "climat",
          policyTopic: "ecology",
          text: "Une subvention automobile sera abandonnée au profit des transports régionaux",
          stance: -35,
          ideology: { ecology: 4 },
        },
        result: outcome(
          "all_candidates_transport_choice",
          "Le rail gagne ce que l’automobile perd",
          "Vous êtes le premier à nommer une dépense supprimée et son bénéficiaire de remplacement. Les territoires dépendants de la voiture contestent l’arbitrage, mais le choix donne une cohérence tangible à votre plan climatique.",
          [
            bloc("green_progressives", 6),
            stat("credibility", 4, "Arbitrage explicite"),
            bloc("rural_working_class", -4),
            hidden("consistency", 3),
          ],
        ),
      }),
      decision({
        id: "all_candidates_carbon_contract",
        label:
          "Conditionner chaque dépense climatique à une baisse d’émissions mesurée deux ans après son lancement",
        tag: "TECHNIQUE",
        strategy: "legal_action",
        statement: {
          topic: "climat",
          policyTopic: "ecology",
          text: "Chaque dépense climatique sera évaluée sur ses réductions d’émissions après deux ans",
          stance: -10,
        },
        result: outcome(
          "all_candidates_carbon_metric",
          "Une clause de résultat remplace la liste",
          "Vous refusez de sacrifier une mesure avant l’évaluation et imposez un critère commun. La méthode convainc les électeurs sensibles à l’efficacité, sans fournir le nom précis demandé par le format.",
          [
            stat("credibility", 4, "Évaluation carbone"),
            bloc("executives", 3),
            stat("popularity", -1, "Question contournée"),
          ],
        ),
      }),
      decision({
        id: "all_candidates_local_adaptation",
        label: "Supprimer le grand sommet annuel et financer cent plans communaux d’adaptation",
        tag: "POPULAIRE",
        strategy: "symbolic_action",
        statement: {
          topic: "climat",
          policyTopic: "ecology",
          text: "Le sommet climatique annuel sera remplacé par cent plans communaux d’adaptation",
          stance: -25,
          ideology: { ecology: 3 },
        },
        result: outcome(
          "all_candidates_local_shift",
          "Cent communes remplacent une grand-messe",
          "Le contraste est facile à retenir et les maires y voient un financement utilisable. Les experts rappellent que le sommet supprimé coûtait beaucoup moins que les plans annoncés, ce qui oblige à trouver le solde ailleurs.",
          [
            stat("localStrength", 5, "Plans communaux"),
            stat("mediaPresence", 3, "Image nette"),
            hidden("economicCompetence", -2),
          ],
        ),
      }),
      decision({
        id: "all_candidates_refuse_cut",
        label:
          "Refuser toute suppression et annoncer une contribution exceptionnelle des secteurs les plus émetteurs",
        tag: "CLIVANT",
        strategy: "program_shift",
        statement: {
          topic: "climat",
          policyTopic: "ecology",
          text: "Les secteurs les plus émetteurs financeront les mesures climatiques par une contribution exceptionnelle",
          stance: -65,
          ideology: { ecology: 6, economy: -4 },
        },
        result: outcome(
          "all_candidates_emitter_levy",
          "Une nouvelle recette évite l’arbitrage",
          "La contribution mobilise votre base et rend votre réponse différente des autres candidatures. Elle contrevient à la contrainte posée par le débat et ouvre immédiatement une bataille sur les secteurs concernés.",
          [
            stat("mobilization", 5, "Pollueurs mis à contribution"),
            stat("rejection", 3, "Nouvelle taxe contestée"),
            bloc("green_progressives", 5),
            hidden("economicCompetence", -2),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "debate_fact_card",
    title: "La fiche rouge de la rédaction",
    category: "debate",
    summary:
      "Après votre réponse économique, la rédaction affiche une fiche indiquant que votre comparaison utilise des années différentes. La correction est incontestable, mais elle ne dit pas si votre conclusion politique reste valable.",
    themes: ["economy", "fiscality"],
    importance: "major",
    phaseWeights: debatePhases,
    minDecisionIndex: 10,
    entityReferences: [{ entityId: "france_2", role: "host" }],
    editorialSensitivity: "none",
    chain: {
      id: "debate_evidence",
      step: 2,
      followsEventIds: ["debate_economy_round"],
      minimumDelay: 1,
      maximumDelay: 8,
    },
    choices: [
      decision({
        id: "fact_card_correct",
        label:
          "Corriger les années, refaire la comparaison et reconnaître que l’écart est plus faible",
        tag: "TRANSPARENT",
        strategy: "media_response",
        result: outcome(
          "fact_card_correction_complete",
          "La correction conserve une conclusion réduite",
          "Vous reprenez le calcul sans contester la rédaction. L’écart demeure mais perd sa force initiale ; la franchise protège votre crédibilité au prix d’un avantage rhétorique.",
          [
            stat("credibility", 4, "Erreur corrigée"),
            stat("momentum", -1, "Argument affaibli"),
            hidden("consistency", 2),
          ],
        ),
      }),
      decision({
        id: "fact_card_context",
        label:
          "Accepter la correction puis expliquer pourquoi les deux années restent politiquement comparables",
        tag: "TECHNIQUE",
        strategy: "media_response",
        result: outcome(
          "fact_card_context_debated",
          "La méthode reste en discussion",
          "Votre explication distingue les prix constants et les choix budgétaires, ce qui sauve une partie de l’analyse. Le public le moins spécialiste retient surtout qu’une erreur avait bien été commise.",
          [
            hidden("economicCompetence", 3),
            stat("credibility", 1, "Contexte expliqué"),
            stat("popularity", -1, "Réponse complexe"),
          ],
        ),
      }),
      decision({
        id: "fact_card_attack",
        label:
          "Contester la pertinence de la fiche et poursuivre votre attaque sans modifier le chiffre",
        tag: "OFFENSIF",
        strategy: "personal_risk",
        result: outcome(
          "fact_card_denial_replayed",
          "Le refus de corriger tourne en boucle",
          "La rédaction rediffuse les sources à l’écran et votre chiffre devient faux sans ambiguïté. Votre fermeté mobilise quelques partisans, mais la séquence dégrade durablement votre réputation de sérieux.",
          [
            stat("mobilization", 2, "Socle défensif"),
            stat("credibility", -7, "Erreur maintenue"),
            stat("rejection", 3, "Correction refusée"),
            hidden("consistency", -4),
          ],
          { setFlags: { fact_card_denied: true } },
        ),
      }),
      decision({
        id: "fact_card_withdraw_argument",
        label:
          "Retirer la comparaison, publier vos sources et revenir à la mesure économique proposée",
        tag: "TRANSPARENT",
        strategy: "policy_commitment",
        result: outcome(
          "fact_card_argument_withdrawn",
          "La proposition survit à l’argument retiré",
          "Vous abandonnez explicitement le chiffre fautif puis exposez le mécanisme de votre mesure. La correction coûte le bénéfice de l’attaque initiale, mais empêche l’erreur de contaminer tout le programme.",
          [
            stat("credibility", 5, "Sources publiées"),
            stat("momentum", -2, "Attaque abandonnée"),
            hidden("economicCompetence", 2),
            hidden("consistency", 2),
            flag("fact_card_argument_withdrawn", true, "Argument retiré"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "debate_post_show_spin",
    title: "Les soutiens envahissent le plateau",
    category: "debate",
    summary:
      "À peine le débat terminé, les chaînes demandent à vos soutiens de désigner un vainqueur. Votre performance a été inégale : forte sur l’économie, faible sur un sujet territorial. L’équipe doit choisir le récit de la nuit.",
    themes: ["institutions"],
    importance: "major",
    phaseWeights: debatePhases,
    minDecisionIndex: 12,
    choices: [
      decision({
        id: "post_show_claim_win",
        label: "Revendiquer la victoire et diffuser immédiatement vos trois meilleurs extraits",
        tag: "OFFENSIF",
        strategy: "media_response",
        result: outcome(
          "post_show_victory_claim",
          "Trois extraits imposent votre meilleur débat",
          "La diffusion coordonnée domine les premières heures et nourrit une dynamique favorable. Les analyses du lendemain rappellent la faiblesse territoriale, sans annuler l’avantage de la première impression.",
          [
            stat("mediaPresence", 5, "Extraits coordonnés"),
            stat("momentum", 4, "Victoire revendiquée"),
            stat("credibility", -1, "Bilan sélectif"),
          ],
        ),
      }),
      decision({
        id: "post_show_balanced",
        label:
          "Reconnaître la réponse territoriale insuffisante et publier dès le matin une proposition corrigée",
        tag: "TRANSPARENT",
        strategy: "long_term_strategy",
        result: outcome(
          "post_show_correction_plan",
          "Le point faible reçoit une suite",
          "Vos soutiens ne prétendent pas que tout fut réussi et annoncent un travail précis sur le sujet manqué. La dynamique immédiate reste modeste, mais la campagne gagne un mécanisme de correction crédible.",
          [
            stat("credibility", 5, "Faiblesse traitée"),
            hidden("consistency", 3),
            stat("momentum", 1, "Après-débat constructif"),
          ],
        ),
      }),
      decision({
        id: "post_show_allies",
        label: "Répartir les plateaux entre vos alliés selon les thèmes qu’ils maîtrisent le mieux",
        tag: "RASSEMBLEUR",
        strategy: "alliance",
        result: outcome(
          "post_show_coalition_team",
          "La coalition prolonge le débat",
          "Chaque soutien développe une partie différente du projet et l’équipe paraît prête à gouverner. Les interventions divergent légèrement sur les mesures nouvelles, révélant le coût d’un récit moins centralisé.",
          [
            stat("cohesion", 4, "Équipe visible"),
            hidden("transferability", 4),
            stat("credibility", 2, "Compétences réparties"),
            hidden("consistency", -1),
          ],
        ),
      }),
      decision({
        id: "post_show_no_spin",
        label:
          "Refuser les plateaux d’après-débat et laisser les propositions circuler sans commentaire partisan",
        tag: "PRUDENT",
        strategy: "silence",
        result: outcome(
          "post_show_silence",
          "Le silence cède les premières heures",
          "Le refus de proclamer une victoire artificielle plaît aux électeurs lassés du commentaire permanent. Vos concurrents occupent cependant seuls les plateaux et fixent une partie de l’interprétation avant le matin.",
          [
            stat("rejection", -2, "Sobriété appréciée"),
            stat("mediaPresence", -4, "Plateaux abandonnés"),
            stat("momentum", -1, "Récit subi"),
          ],
        ),
      }),
    ],
  }),
];
