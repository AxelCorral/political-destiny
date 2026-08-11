import type { GameEventDefinition } from "@/game/types";

import { bloc, choice, decision, event, hidden, outcome, stat } from "../authoring";

const mediaPhases = { pre_campaign: 0.55, campaign: 1, official_campaign: 0.85 } as const;

export const v2MediaEvents: GameEventDefinition[] = [
  event({
    id: "media_economic_morning",
    title: "Le chiffrage de la matinale",
    category: "media",
    summary:
      "Sur France Inter, la journaliste vous demande le coût annuel de votre mesure fiscale centrale, puis son financement. Vos fiches donnent une fourchette, pas le chiffre unique attendu à l’antenne. La réponse sera vérifiée avant midi.",
    themes: ["fiscality", "economy"],
    importance: "major",
    phaseWeights: mediaPhases,
    entityReferences: [
      { entityId: "france_inter", role: "host" },
      { entityId: "matinale_radio", role: "context" },
    ],
    editorialSensitivity: "none",
    chain: { id: "economic_fact_check", step: 1 },
    choices: [
      choice({
        id: "economic_morning_range",
        label: "Donner la fourchette disponible et publier les hypothèses de calcul avant midi",
        tag: "TRANSPARENT",
        strategy: "media_response",
        statement: {
          topic: "fiscalité",
          policyTopic: "fiscality",
          text: "Le financement sera présenté sous forme de fourchette documentée",
          stance: 15,
        },
        outcomes: [
          outcome(
            "economic_range_accepted",
            "Une imprécision assumée",
            "La réponse paraît moins spectaculaire qu’un chiffre rond, mais les documents publiés ensuite concordent avec vos propos. Les journalistes économiques retiennent surtout la méthode et l’absence d’esquive.",
            [
              stat("credibility", 4, "Chiffrage documenté"),
              stat("mediaPresence", 1, "Réponse reprise"),
              hidden("economicCompetence", 3),
            ],
            {
              followUps: [
                { eventId: "media_fact_check_followup", afterDecisions: 2, probability: 0.82 },
              ],
              setFlags: { morning_costing_published: true },
            },
          ),
        ],
      }),
      choice({
        id: "economic_morning_exact",
        label: "Annoncer de mémoire un coût précis et défendre immédiatement son financement",
        tag: "RISQUÉ",
        strategy: "personal_risk",
        statement: {
          topic: "fiscalité",
          policyTopic: "fiscality",
          text: "La mesure fiscale coûtera exactement le montant annoncé à l’antenne",
          stance: 20,
        },
        outcomes: [
          outcome(
            "economic_exact_right",
            "Le chiffre résiste à la vérification",
            "Votre mémoire tient bon : le montant correspond au dossier technique et l’explication du financement est jugée solide. La séquence renforce une compétence économique jusque-là peu visible.",
            [
              stat("credibility", 6, "Chiffre confirmé"),
              stat("momentum", 3, "Matinale réussie"),
              hidden("economicCompetence", 5),
            ],
            {
              weight: 0.48,
              modifiers: [
                { source: "trait", key: "competence", coefficient: 0.045 },
                { source: "party_stat", key: "credibility", coefficient: 0.025 },
              ],
              followUps: [
                { eventId: "media_fact_check_followup", afterDecisions: 2, probability: 0.9 },
              ],
              setFlags: { morning_exact_claim: true },
            },
          ),
          outcome(
            "economic_exact_wrong",
            "Deux milliards d’écart",
            "Le dossier publié par votre équipe contredit le montant donné en direct. L’erreur reste corrigeable, mais elle offre à vos adversaires une formule simple sur l’impréparation budgétaire.",
            [
              stat("credibility", -6, "Erreur de chiffrage"),
              stat("rejection", 2, "Doute sur la préparation"),
              hidden("economicCompetence", -5),
            ],
            {
              weight: 0.52,
              followUps: [
                { eventId: "media_fact_check_followup", afterDecisions: 1, probability: 1 },
              ],
              setFlags: { morning_exact_claim: true, costing_error: true },
            },
          ),
        ],
      }),
      decision({
        id: "economic_morning_defer",
        label:
          "Refuser le chiffre improvisé et annoncer une conférence budgétaire complète le soir même",
        tag: "TECHNIQUE",
        strategy: "long_term_strategy",
        result: outcome(
          "economic_deferred_conference",
          "Le rendez-vous budgétaire remplace l’esquive",
          "Le refus agace pendant l’entretien, puis la conférence du soir donne une architecture lisible au projet. Vous perdez le duel radiophonique mais gagnez un document de référence pour la suite.",
          [
            stat("popularity", -1, "Réponse frustrante"),
            stat("credibility", 4, "Présentation complète"),
            hidden("consistency", 2),
          ],
          {
            delayedEffects: [
              {
                afterDecisions: 2,
                narrative: "Le dossier budgétaire est désormais cité dans les entretiens suivants.",
                effects: [
                  hidden("economicCompetence", 3),
                  stat("credibility", 2, "Dossier budgétaire réutilisé"),
                ],
              },
            ],
          },
        ),
      }),
    ],
  }),
  event({
    id: "media_unflattering_photo",
    title: "La photographie du quai vide",
    category: "media",
    summary:
      "À la gare de Lille-Flandres, une photographie vous montre seul devant un quai presque vide, quelques secondes avant l’arrivée des militants. L’image circule sans son contexte et devient le symbole commode d’une campagne supposée sans public.",
    themes: ["institutions"],
    phaseWeights: mediaPhases,
    entityReferences: [
      { entityId: "lille", role: "location" },
      { entityId: "france_3", role: "context" },
    ],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "photo_publish_sequence",
        label:
          "Publier la séquence complète avec l’heure de prise de vue et reprendre le déplacement",
        tag: "TRANSPARENT",
        strategy: "media_response",
        result: outcome(
          "photo_context_restored",
          "Le cadre complet casse le récit",
          "La vidéo montre le quai se remplir deux minutes plus tard. Le démenti circule sans effacer totalement la première image, mais votre équipe évite de consacrer la journée à une polémique mineure.",
          [
            stat("credibility", 2, "Contexte vérifiable"),
            stat("mediaPresence", 1, "Rectification visible"),
          ],
        ),
      }),
      decision({
        id: "photo_self_mockery",
        label:
          "Détourner vous-même la photographie en invitant les internautes au prochain meeting",
        tag: "POPULAIRE",
        strategy: "symbolic_action",
        result: outcome(
          "photo_becomes_invitation",
          "Le quai vide devient une affiche",
          "Votre montage humoristique est massivement partagé et les inscriptions au prochain meeting progressent. Une partie de la presse juge la réponse légère, mais la campagne récupère l’image au lieu de la subir.",
          [
            stat("popularity", 3, "Autodérision appréciée"),
            stat("mobilization", 3, "Inscriptions au meeting"),
            stat("credibility", -1, "Réponse peu substantielle"),
          ],
        ),
      }),
      decision({
        id: "photo_ignore",
        label: "Ignorer la photographie et publier uniquement les engagements annoncés à Lille",
        tag: "PRUDENT",
        strategy: "silence",
        result: outcome(
          "photo_fades_without_answer",
          "Le fond reprend lentement sa place",
          "L’image anime quelques éditoriaux puis disparaît du flux. Vos mesures régionales sont mieux reprises par la presse locale que par les chaînes nationales, sans gain ni crise durable.",
          [
            stat("localStrength", 2, "Engagements régionaux visibles"),
            stat("mediaPresence", -1, "Polémique laissée aux autres"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "media_short_video",
    title: "Une minute sur les loyers",
    category: "media",
    summary:
      "franceinfo vous propose une vidéo verticale : soixante secondes pour répondre à une étudiante qui ne trouve plus de logement à Rennes. Le format exige une mesure compréhensible, mais votre programme partage l’effort entre l’État, les communes et les bailleurs.",
    themes: ["social_issues", "public_services"],
    phaseWeights: mediaPhases,
    entityReferences: [
      { entityId: "franceinfo", role: "host" },
      { entityId: "rennes", role: "location" },
    ],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "short_video_emergency_housing",
        label:
          "Annoncer la garantie publique des loyers étudiants et renvoyer le financement au programme",
        tag: "POPULAIRE",
        strategy: "program_shift",
        statement: {
          topic: "logement étudiant",
          policyTopic: "social_issues",
          text: "Une garantie publique sécurisera les loyers des étudiants",
          stance: -35,
        },
        result: outcome(
          "housing_guarantee_clips",
          "La garantie tient dans le format",
          "La proposition est immédiatement comprise et reprise dans les associations étudiantes. Les questions de coût arrivent ensuite, mais vous avez enfin une mesure identifiable sur le logement des jeunes.",
          [
            bloc("young_precarious", 5, "Garantie de loyer"),
            stat("popularity", 2, "Mesure lisible"),
            hidden("economicCompetence", -1),
          ],
        ),
      }),
      decision({
        id: "short_video_building_targets",
        label: "Détailler un objectif de construction à Rennes et les terrains publics mobilisés",
        tag: "TECHNIQUE",
        strategy: "media_response",
        statement: {
          topic: "construction de logements",
          policyTopic: "social_issues",
          text: "Les terrains publics serviront à accélérer la construction dans les villes universitaires",
          stance: -10,
        },
        result: outcome(
          "housing_target_grounded",
          "Une réponse locale et vérifiable",
          "Le chiffre de constructions prévues dépasse le format, mais les médias rennais vérifient les terrains cités. La séquence reste peu virale et renforce votre sérieux territorial.",
          [
            stat("credibility", 3, "Objectif local vérifiable"),
            stat("localStrength", 3, "Ancrage à Rennes"),
            stat("mediaPresence", -1, "Vidéo peu partagée"),
          ],
        ),
      }),
      decision({
        id: "short_video_refuse_reduction",
        label:
          "Refuser la réponse en soixante secondes et inviter l’étudiante à un échange filmé plus long",
        tag: "PRÉSIDENTIEL",
        strategy: "long_term_strategy",
        result: outcome(
          "housing_long_form_exchange",
          "Le refus du slogan devient un entretien",
          "Le premier extrait paraît défensif, puis l’échange complet montre une écoute réelle et plusieurs arbitrages. Vous renoncez à la viralité immédiate pour une séquence plus cohérente avec votre méthode.",
          [
            stat("mediaPresence", -2, "Format viral refusé"),
            stat("credibility", 2, "Échange approfondi"),
            bloc("young_urban_graduates", 2),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "media_long_podcast",
    title: "Deux heures sans élément de langage",
    category: "media",
    summary:
      "France Culture propose un entretien de deux heures sur votre parcours, vos lectures et trois désaccords internes au programme. Le temps long peut donner de l’épaisseur à la candidature, mais rend toute contradiction facile à isoler ensuite.",
    themes: ["institutions", "social_issues"],
    phaseWeights: mediaPhases,
    entityReferences: [{ entityId: "france_culture", role: "host" }],
    editorialSensitivity: "none",
    choices: [
      choice({
        id: "podcast_full_access",
        label: "Accepter les deux heures et répondre sans faire valider les questions à l’avance",
        tag: "RISQUÉ",
        strategy: "personal_risk",
        outcomes: [
          outcome(
            "podcast_candidate_revealed",
            "Le temps long vous révèle",
            "Les réponses personnelles restent liées au projet et l’entretien produit plusieurs extraits de fond. Même des adversaires reconnaissent une maîtrise rare des dossiers et une parole moins fabriquée.",
            [
              stat("credibility", 6, "Entretien maîtrisé"),
              stat("popularity", 3, "Candidature incarnée"),
              hidden("consistency", 3),
            ],
            {
              weight: 0.58,
              modifiers: [
                { source: "trait", key: "mediaSkill", coefficient: 0.04 },
                { source: "consistency", key: "global", coefficient: 0.03 },
              ],
            },
          ),
          outcome(
            "podcast_quote_trap",
            "Une parenthèse supplante l’entretien",
            "Une réponse improvisée sur votre propre camp contredit une déclaration antérieure. L’entretien complet reste riche, mais la phrase isolée nourrit trois jours de commentaires sur votre ligne réelle.",
            [
              stat("credibility", -4, "Contradiction relevée"),
              stat("mediaPresence", 4, "Extrait omniprésent"),
              hidden("consistency", -5),
            ],
            { weight: 0.42, setFlags: { podcast_contradiction: true } },
          ),
        ],
      }),
      decision({
        id: "podcast_topics_only",
        label:
          "Accepter quatre-vingt-dix minutes en excluant les conflits internes de la discussion",
        tag: "PRUDENT",
        strategy: "negotiation",
        result: outcome(
          "podcast_guardrails_visible",
          "Un entretien solide aux limites apparentes",
          "Votre propos programmatique est précis, mais l’animateur annonce clairement les thèmes refusés. Le contrôle évite l’accident tout en rappelant au public que la campagne choisit son terrain.",
          [
            stat("credibility", 3, "Programme détaillé"),
            stat("popularity", -1, "Questions écartées"),
            hidden("fatigue", 2),
          ],
        ),
      }),
      decision({
        id: "podcast_send_policy_lead",
        label:
          "Confier l’entretien à votre responsable du programme et publier votre propre réponse écrite",
        tag: "TECHNIQUE",
        strategy: "internal_discipline",
        result: outcome(
          "podcast_expert_not_candidate",
          "L’équipe brille, le candidat s’efface",
          "Votre responsable maîtrise l’exercice et installe plusieurs propositions dans le débat. Votre absence nourrit cependant l’idée que vous protégez trop votre parole lorsque le format devient imprévisible.",
          [
            stat("credibility", 3, "Équipe compétente"),
            stat("mediaPresence", -3, "Candidat absent"),
            stat("cohesion", 2, "Responsable valorisé"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "media_fictional_editorial_support",
    title: "Un soutien éditorial encombrant",
    category: "media",
    summary:
      "Gabriel Valès, polémiste engagé dans la campagne de Reconquête, salue publiquement votre proposition sur la liberté d’expression. Son appui offre de l’audience mais permet à vos concurrents de redéfinir votre position par association.",
    themes: ["civil_liberties", "institutions"],
    phaseWeights: mediaPhases,
    entityReferences: [{ entityId: "reconquete_vales", role: "subject" }],
    editorialSensitivity: "contextual",
    choices: [
      decision({
        id: "editorial_support_boundaries",
        label:
          "Remercier pour l’accord ponctuel tout en publiant vos désaccords précis avec Gabriel Valès",
        tag: "TRANSPARENT",
        strategy: "media_response",
        result: outcome(
          "support_kept_at_distance",
          "Un accord limité, des frontières nettes",
          "La mise au point évite la rupture théâtrale et empêche le soutien de devenir une alliance implicite. Elle consomme du temps médiatique, mais clarifie votre doctrine sur les libertés publiques.",
          [
            stat("credibility", 3, "Position clarifiée"),
            stat("mediaPresence", 2, "Mise au point suivie"),
            hidden("consistency", 2),
          ],
        ),
      }),
      decision({
        id: "editorial_support_reject",
        label:
          "Refuser explicitement ce soutien et retirer Gabriel Valès de toute invitation de campagne",
        tag: "CLIVANT",
        strategy: "break",
        result: outcome(
          "support_publicly_rejected",
          "La porte se ferme publiquement",
          "Le refus rassure les électeurs qui craignaient un rapprochement, tandis que les partisans du polémiste dénoncent une mise en scène. Gabriel Valès conserve une hostilité durable à votre candidature.",
          [
            stat("rejection", -2, "Ambiguïté levée"),
            bloc("young_urban_graduates", 2),
            hidden("potentialSupport", -1),
          ],
          { setFlags: { editorial_support_rejected: true } },
        ),
      }),
      decision({
        id: "editorial_support_meeting",
        label:
          "Inviter Gabriel Valès à débattre publiquement de vos divergences au prochain meeting",
        tag: "RISQUÉ",
        strategy: "personal_risk",
        result: outcome(
          "support_turns_into_debate",
          "Le soutien devient confrontation",
          "Le débat attire une audience inhabituelle et vous permet de marquer vos désaccords sans nier le point commun initial. Une partie de votre équipe juge néanmoins que le polémiste a reçu une scène disproportionnée.",
          [
            stat("mediaPresence", 5, "Débat très suivi"),
            stat("cohesion", -3, "Invitation contestée"),
            stat("popularity", 1, "Désaccord incarné"),
          ],
          { setFlags: { editorial_debate_held: true } },
        ),
      }),
    ],
  }),
  event({
    id: "media_fact_check_followup",
    title: "Le coût passe au crible",
    category: "media",
    summary:
      "Le Monde confronte votre réponse de matinale au document budgétaire de la campagne et aux séries publiques de l’Insee. La vérification distingue le coût brut, les recettes attendues et les hypothèses encore fragiles.",
    themes: ["fiscality", "economy"],
    importance: "major",
    phaseWeights: mediaPhases,
    minDecisionIndex: 2,
    entityReferences: [
      { entityId: "le_monde", role: "host" },
      { entityId: "insee", role: "institution" },
    ],
    editorialSensitivity: "none",
    chain: {
      id: "economic_fact_check",
      step: 2,
      followsEventIds: ["media_economic_morning"],
      minimumDelay: 1,
      maximumDelay: 8,
    },
    choices: [
      decision({
        id: "fact_check_release_model",
        label:
          "Publier le tableur complet, ses hypothèses et les corrections apportées depuis la matinale",
        tag: "TRANSPARENT",
        strategy: "legal_action",
        result: outcome(
          "fact_check_model_opened",
          "Les calculs deviennent auditables",
          "Les spécialistes repèrent deux hypothèses discutables mais aucune dissimulation. En donnant accès au modèle, vous transformez une vérification défensive en référence commune pour les prochains débats.",
          [
            stat("credibility", 5, "Calculs ouverts"),
            hidden("economicCompetence", 3),
            hidden("scandalRisk", -2),
          ],
          { setFlags: { budget_model_public: true } },
        ),
      }),
      decision({
        id: "fact_check_correct_error",
        label:
          "Reconnaître l’écart, corriger le montant et retirer une mesure pour équilibrer le financement",
        tag: "PRUDENT",
        strategy: "policy_commitment",
        statement: {
          topic: "fiscalité",
          policyTopic: "fiscality",
          text: "Le programme fiscal est corrigé et une dépense secondaire est retirée",
          stance: 5,
        },
        result: outcome(
          "fact_check_error_repaired",
          "Une promesse sacrifiée au sérieux",
          "La correction confirme votre erreur initiale, mais le retrait d’une dépense prouve que l’équilibre annoncé a une conséquence réelle. Les soutiens de la mesure abandonnée protestent sans pouvoir parler de déni.",
          [
            stat("credibility", 3, "Correction assumée"),
            stat("popularity", -2, "Promesse retirée"),
            hidden("consistency", 2),
          ],
          { setFlags: { budget_corrected: true } },
        ),
      }),
      decision({
        id: "fact_check_attack_method",
        label:
          "Contester la méthode du journal et maintenir le montant donné sans publier de nouveau calcul",
        tag: "OFFENSIF",
        strategy: "media_response",
        result: outcome(
          "fact_check_dispute_lingers",
          "La bataille de méthode remplace le chiffre",
          "Votre riposte mobilise les convaincus, mais aucun document nouveau ne clôt la discussion. La question budgétaire vous suit dans les interviews suivantes et réduit la confiance des électeurs les plus attentifs aux comptes.",
          [
            stat("mobilization", 2, "Socle mobilisé"),
            stat("credibility", -5, "Calcul non produit"),
            bloc("executives", -3),
          ],
          { setFlags: { fact_check_rejected: true } },
        ),
      }),
    ],
  }),
  event({
    id: "media_silence_day",
    title: "Vingt-quatre heures sans caméra",
    category: "media",
    summary:
      "Après neuf déplacements en six jours, Anaïs Vercel propose une journée de travail sans interview. Les rédactions veulent savoir s’il s’agit d’une préparation de fond, d’un problème de santé ou d’un simple repli tactique.",
    themes: ["institutions"],
    phaseWeights: mediaPhases,
    entityReferences: [{ entityId: "fictional_campaign_manager", role: "subject" }],
    editorialSensitivity: "contextual",
    choices: [
      decision({
        id: "silence_publish_schedule",
        label:
          "Maintenir la journée de travail et publier l’agenda précis des réunions programmatiques",
        tag: "PRUDENT",
        strategy: "silence",
        result: outcome(
          "silence_workday_understood",
          "Une pause lisible dans la campagne",
          "Les réunions documentées coupent court aux spéculations. Vous disparaissez brièvement des écrans, récupérez physiquement et revenez avec deux arbitrages mieux préparés.",
          [
            stat("mediaPresence", -2, "Journée sans interview"),
            stat("credibility", 2, "Travail documenté"),
            hidden("fatigue", -6),
          ],
        ),
      }),
      decision({
        id: "silence_cancel_pause",
        label: "Annuler la pause et accepter la première invitation au journal de vingt heures",
        tag: "RISQUÉ",
        strategy: "media_response",
        result: outcome(
          "silence_cancelled_on_air",
          "La fatigue passe à l’écran",
          "Votre présence dément les rumeurs, mais deux réponses hésitantes montrent pourquoi la pause avait été proposée. La couverture se concentre sur la forme et l’équipe perd une journée de préparation.",
          [
            stat("mediaPresence", 3, "Journal de vingt heures"),
            stat("credibility", -2, "Réponses hésitantes"),
            hidden("fatigue", 5),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "media_open_microphone",
    title: "Le micro resté ouvert",
    category: "media",
    summary:
      "Après une interview sur France 2, un micro capte votre remarque sèche sur Anaïs Vercel, directrice de campagne : vous dites que son organisation « ne tiendra pas un mois ». L’extrait est authentique et déjà diffusé.",
    themes: ["institutions"],
    importance: "major",
    phaseWeights: mediaPhases,
    minDecisionIndex: 5,
    entityReferences: [
      { entityId: "france_2", role: "host" },
      { entityId: "fictional_campaign_manager", role: "subject" },
    ],
    editorialSensitivity: "contextual",
    choices: [
      decision({
        id: "open_mic_apology",
        label:
          "Présenter vos excuses à Anaïs Vercel devant l’équipe et lui confirmer publiquement votre confiance",
        tag: "LOYAL",
        strategy: "internal_discipline",
        result: outcome(
          "open_mic_apology_received",
          "Les excuses referment la blessure",
          "Anaïs Vercel accepte les excuses sans nier les problèmes d’organisation. La crise devient l’occasion de redistribuer des responsabilités et l’équipe retient surtout que vous avez reconnu une faute personnelle.",
          [
            stat("cohesion", 4, "Excuses devant l’équipe"),
            stat("credibility", 1, "Faute reconnue"),
            hidden("cadreLoyalty", 3),
          ],
          {
            setFlags: { campaign_manager_apology: true },
          },
        ),
      }),
      decision({
        id: "open_mic_restructure",
        label:
          "Assumer le diagnostic et annoncer une réorganisation qui retire le calendrier à Anaïs Vercel",
        tag: "OFFENSIF",
        strategy: "internal_discipline",
        result: outcome(
          "open_mic_restructure_imposed",
          "La critique devient organigramme",
          "La nouvelle répartition corrige plusieurs retards, mais Anaïs Vercel vit l’annonce comme une humiliation publique. L’efficacité remonte au prix d’une loyauté plus fragile dans le dernier mois.",
          [
            stat("credibility", 2, "Organisation corrigée"),
            stat("cohesion", -4, "Direction fragilisée"),
            hidden("fatigue", -2),
          ],
          { setFlags: { campaign_manager_sidelined: true } },
        ),
      }),
      decision({
        id: "open_mic_blame_context",
        label:
          "Accuser la chaîne d’avoir diffusé une conversation privée et refuser de commenter le fond",
        tag: "CLIVANT",
        strategy: "legal_action",
        result: outcome(
          "open_mic_privacy_counterattack",
          "Le droit ne répond pas au malaise",
          "La protestation sur les conditions d’enregistrement soulève une vraie question professionnelle, sans effacer vos mots. L’équipe comprend votre silence comme un refus de traiter le conflit interne.",
          [
            stat("mediaPresence", 3, "Controverse sur l’enregistrement"),
            stat("cohesion", -5, "Conflit laissé ouvert"),
            stat("rejection", 2, "Riposte jugée défensive"),
          ],
          { setFlags: { open_mic_disputed: true } },
        ),
      }),
    ],
  }),
  event({
    id: "media_live_stream",
    title: "Le direct des questions citoyennes",
    category: "media",
    summary:
      "Votre session en direct dépasse déjà l’heure prévue. Une infirmière demande un engagement précis sur les effectifs hospitaliers, puis des centaines de questions remontent sur le même sujet. La prochaine étape commence dans quarante minutes.",
    themes: ["public_services", "work"],
    phaseWeights: mediaPhases,
    choices: [
      decision({
        id: "livestream_answer_three",
        label:
          "Répondre à trois questions hospitalières puis conclure avec le calendrier de votre réforme",
        tag: "PRUDENT",
        strategy: "media_response",
        statement: {
          topic: "hôpital public",
          policyTopic: "public_services",
          text: "Les effectifs hospitaliers seront renforcés selon un calendrier publié",
          stance: -35,
        },
        result: outcome(
          "livestream_concludes_with_plan",
          "Le direct se termine sur un calendrier",
          "Les réponses ne règlent pas tous les cas, mais la conclusion donne une date et un financement à l’engagement. Vous quittez le direct à l’heure, avec une séquence exploitable par les équipes de santé.",
          [
            stat("credibility", 3, "Calendrier hospitalier"),
            bloc("public_services", 3),
            hidden("fatigue", 1),
          ],
        ),
      }),
      decision({
        id: "livestream_continue_all",
        label: "Reporter le déplacement suivant et répondre jusqu’à épuiser la file de questions",
        tag: "POPULAIRE",
        strategy: "personal_risk",
        statement: {
          topic: "hôpital public",
          policyTopic: "public_services",
          text: "La priorité hospitalière justifie de modifier l’agenda de campagne",
          stance: -45,
        },
        result: outcome(
          "livestream_becomes_health_forum",
          "Le direct change votre journée",
          "Deux heures supplémentaires transforment l’émission en forum de santé très suivi. Les soignants apprécient le temps accordé, tandis que l’équipe locale dont la visite est annulée se sent sacrifiée.",
          [
            stat("popularity", 4, "Long échange citoyen"),
            bloc("public_services", 5),
            stat("localStrength", -3, "Étape annulée"),
            hidden("fatigue", 4),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "media_prime_time_invite",
    title: "Le fauteuil libéré au vingt heures",
    category: "media",
    summary:
      "Un adversaire annule sa venue au journal de TF1. La rédaction vous offre l’entretien de vingt minutes, sans thème négocié et avec deux heures de préparation. Votre débat économique de demain reste à finaliser.",
    themes: ["economy", "institutions"],
    importance: "major",
    phaseWeights: mediaPhases,
    entityReferences: [
      { entityId: "tf1", role: "host" },
      { entityId: "journal_20_heures", role: "context" },
    ],
    editorialSensitivity: "none",
    choices: [
      choice({
        id: "prime_time_accept_open",
        label: "Accepter sans condition et préparer quatre réponses prioritaires pendant le trajet",
        tag: "RISQUÉ",
        strategy: "personal_risk",
        outcomes: [
          outcome(
            "prime_time_opportunity_taken",
            "Le remplacement devient démonstration",
            "Vous imposez deux propositions et répondez nettement aux relances imprévues. L’audience découvre une candidature plus prête qu’attendu et la dynamique progresse avant le débat économique.",
            [
              stat("mediaPresence", 6, "Forte audience"),
              stat("momentum", 4, "Entretien convaincant"),
              stat("credibility", 2, "Réponses nettes"),
            ],
            {
              weight: 0.55,
              modifiers: [{ source: "trait", key: "mediaSkill", coefficient: 0.045 }],
            },
          ),
          outcome(
            "prime_time_questions_expose_gap",
            "Une lacune sous les projecteurs",
            "Une question sur les retraites révèle une contradiction entre deux fiches du programme. L’exposition reste précieuse, mais vos adversaires disposent désormais d’un angle simple pour le débat du lendemain.",
            [
              stat("mediaPresence", 5, "Audience nationale"),
              stat("credibility", -5, "Fiches contradictoires"),
              hidden("consistency", -4),
            ],
            { weight: 0.45, setFlags: { prime_time_pension_gap: true } },
          ),
        ],
      }),
      decision({
        id: "prime_time_decline_prepare",
        label: "Décliner l’invitation et consacrer la soirée au débat économique du lendemain",
        tag: "PRUDENT",
        strategy: "long_term_strategy",
        result: outcome(
          "prime_time_declined_for_debate",
          "Une audience cédée pour mieux préparer",
          "Le fauteuil revient à un autre candidat et votre absence est brièvement commentée. Votre équipe récupère en revanche les heures nécessaires pour harmoniser les chiffres et préparer les contradictions adverses.",
          [
            stat("mediaPresence", -4, "Invitation refusée"),
            stat("credibility", 2, "Dossier consolidé"),
            hidden("fatigue", -3),
          ],
          { setFlags: { debate_extra_preparation: true } },
        ),
      }),
      decision({
        id: "prime_time_send_ally",
        label: "Proposer qu’un allié présente votre programme pendant que vous préparez le débat",
        tag: "RASSEMBLEUR",
        strategy: "alliance",
        result: outcome(
          "prime_time_ally_gets_stage",
          "L’allié gagne son propre espace",
          "L’émission accepte le remplacement. Votre représentant défend bien le projet, mais gagne aussi une autonomie et une notoriété qui pèseront lors des prochains arbitrages de coalition.",
          [
            stat("cohesion", 3, "Responsabilité partagée"),
            stat("mediaPresence", 1, "Programme représenté"),
            hidden("rivalAmbition", 2),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "media_local_press",
    title: "Six rédactions face au désert médical",
    category: "media",
    summary:
      "À Clermont-Ferrand, six titres régionaux organisent un entretien commun sur l’accès aux soins. Les journalistes comparent votre objectif national aux fermetures de cabinets dans leurs départements et attendent un mécanisme applicable dès le prochain budget.",
    themes: ["public_services", "social_issues"],
    phaseWeights: mediaPhases,
    entityReferences: [
      { entityId: "clermont_ferrand", role: "location" },
      { entityId: "france_3", role: "host" },
    ],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "local_press_health_contracts",
        label:
          "Proposer des contrats territoriaux avec objectifs publics et financement garanti sur cinq ans",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "déserts médicaux",
          policyTopic: "public_services",
          text: "Des contrats territoriaux de santé engageront l’État sur cinq ans",
          stance: -25,
        },
        result: outcome(
          "health_contracts_examined_locally",
          "Les territoires obtiennent une méthode",
          "Les rédactions discutent les critères plutôt que vos intentions. Les élus locaux saluent la visibilité pluriannuelle, même si le dispositif ne promet pas un médecin dans chaque commune.",
          [
            stat("credibility", 4, "Contrats détaillés"),
            stat("localStrength", 3, "Élus locaux associés"),
            bloc("rural_working_class", 2),
          ],
        ),
      }),
      decision({
        id: "local_press_doctor_requirement",
        label:
          "Conditionner l’installation des nouveaux médecins à plusieurs années dans une zone sous-dotée",
        tag: "CLIVANT",
        strategy: "policy_commitment",
        statement: {
          topic: "installation des médecins",
          policyTopic: "public_services",
          text: "Les nouveaux médecins devront commencer dans une zone sous-dotée",
          stance: -55,
        },
        result: outcome(
          "doctor_requirement_divides",
          "L’obligation structure le débat",
          "La mesure est immédiatement comprise dans les communes touchées, tandis que les représentants des jeunes médecins dénoncent une contrainte injuste. Vous gagnez un marqueur puissant et un conflit durable à arbitrer.",
          [
            bloc("rural_working_class", 5, "Réponse aux zones sous-dotées"),
            stat("rejection", 3, "Obligation contestée"),
            stat("mediaPresence", 3, "Mesure débattue"),
          ],
        ),
      }),
      decision({
        id: "local_press_mobile_services",
        label: "Financer des maisons de santé mobiles gérées avec les départements volontaires",
        tag: "TECHNIQUE",
        strategy: "compromise",
        statement: {
          topic: "accès territorial aux soins",
          policyTopic: "public_services",
          text: "Des équipes mobiles compléteront les maisons de santé dans les territoires volontaires",
          stance: -15,
        },
        result: outcome(
          "mobile_health_service_pilot",
          "Une solution concrète mais partielle",
          "Deux départements proposent aussitôt d’expérimenter le dispositif. La réponse ne règle pas la pénurie de médecins, mais elle donne à votre déplacement un résultat mesurable et territorial.",
          [
            stat("localStrength", 5, "Expérimentation proposée"),
            stat("credibility", 2, "Solution applicable"),
            hidden("economicCompetence", -1),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "media_foreign_interview",
    title: "La France vue depuis Bruxelles",
    category: "media",
    summary:
      "Depuis Bruxelles, un entretien diffusé par franceinfo porte sur votre stratégie au Conseil européen. L’animateur vous demande ce que la France ferait si l’Allemagne et l’Italie refusaient votre réforme budgétaire.",
    themes: ["europe", "economy"],
    phaseWeights: mediaPhases,
    eligibleIdeologyFamilies: [
      "social_democrat",
      "green",
      "liberal_center",
      "center_right",
      "conservative_right",
      "custom",
    ],
    entityReferences: [
      { entityId: "franceinfo", role: "host" },
      { entityId: "belgique", role: "location" },
      { entityId: "allemagne", role: "context" },
      { entityId: "italie", role: "context" },
      { entityId: "union_europeenne", role: "institution" },
    ],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "foreign_interview_coalition",
        label: "Proposer une coalition de pays volontaires avant de renégocier la règle commune",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        statement: {
          topic: "gouvernance européenne",
          policyTopic: "europe",
          text: "La France cherchera une coalition européenne avant toute révision budgétaire",
          stance: 40,
          ideology: { europe: 3 },
        },
        result: outcome(
          "european_coalition_method",
          "Une méthode plutôt qu’un ultimatum",
          "La réponse paraît compatible avec le fonctionnement européen et rassure les électeurs favorables à la coopération. Elle déçoit ceux qui attendaient un rapport de force immédiat avec Bruxelles.",
          [
            stat("credibility", 4, "Méthode européenne"),
            hidden("transferability", 3),
            bloc("executives", 2),
          ],
        ),
      }),
      decision({
        id: "foreign_interview_veto",
        label:
          "Annoncer que la France bloquera les prochaines décisions jusqu’à obtenir une renégociation",
        tag: "OFFENSIF",
        strategy: "break",
        statement: {
          topic: "gouvernance européenne",
          policyTopic: "europe",
          text: "La France utilisera son veto pour imposer la renégociation budgétaire",
          stance: -60,
          ideology: { europe: -5 },
        },
        result: outcome(
          "european_veto_line",
          "Le veto devient votre ligne européenne",
          "L’annonce mobilise les électeurs qui veulent un rapport de force et inquiète ceux qui redoutent l’isolement. Vos futurs débats seront désormais jugés à l’aune de cet engagement sans ambiguïté.",
          [
            stat("mobilization", 4, "Rapport de force assumé"),
            stat("rejection", 4, "Risque d’isolement"),
            hidden("baseSupport", 2),
          ],
          { setFlags: { european_veto_promised: true } },
        ),
      }),
      decision({
        id: "foreign_interview_national_plan",
        label:
          "Présenter un plan national compatible avec les règles actuelles avant toute négociation",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "gouvernance européenne",
          policyTopic: "europe",
          text: "La priorité sera d’utiliser les marges nationales avant de modifier les règles européennes",
          stance: 15,
        },
        result: outcome(
          "european_national_margin",
          "La marge nationale remplace le grand bras de fer",
          "Les détails budgétaires rendent votre position crédible, mais l’entretien perd sa dimension diplomatique. Vous apparaissez préparé sans répondre complètement à l’hypothèse du refus allemand et italien.",
          [
            hidden("economicCompetence", 4),
            stat("credibility", 2, "Plan compatible"),
            stat("mediaPresence", -1, "Réponse peu diplomatique"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "media_documentary_access",
    title: "La caméra derrière la porte",
    category: "media",
    summary:
      "Une équipe documentaire de France 2 demande six semaines d’accès au siège, y compris aux réunions de préparation. Le film sera diffusé avant le premier tour ; aucune coupe ne pourra être exigée après tournage.",
    themes: ["institutions", "civil_liberties"],
    phaseWeights: { pre_campaign: 0.8, campaign: 1, official_campaign: 0.2 },
    maxDecisionIndex: 18,
    entityReferences: [
      { entityId: "france_2", role: "host" },
      { entityId: "fictional_campaign_manager", role: "subject" },
    ],
    editorialSensitivity: "contextual",
    chain: { id: "documentary_access", step: 1 },
    choices: [
      decision({
        id: "documentary_rules",
        label:
          "Ouvrir les réunions logistiques mais protéger les échanges personnels et les négociations confidentielles",
        tag: "PRUDENT",
        strategy: "negotiation",
        result: outcome(
          "documentary_access_framed",
          "Une transparence avec des portes identifiées",
          "Le contrat distingue clairement les espaces filmables. La production conserve son indépendance et l’équipe sait où elle peut parler librement, ce qui limite les scènes spectaculaires mais protège la confiance interne.",
          [
            stat("credibility", 2, "Règles transparentes"),
            stat("cohesion", 2, "Intimité protégée"),
          ],
          {
            followUps: [{ eventId: "media_past_words", afterDecisions: 5, probability: 0.48 }],
            setFlags: { documentary_framed_access: true },
          },
        ),
      }),
      decision({
        id: "documentary_full_access",
        label: "Accorder l’accès complet, y compris aux arbitrages et aux désaccords de l’équipe",
        tag: "RISQUÉ",
        strategy: "personal_risk",
        result: outcome(
          "documentary_full_access_granted",
          "La campagne accepte de ne plus contrôler le cadre",
          "La décision impressionne la production et inquiète plusieurs responsables. Les images promettent une campagne incarnée, mais chaque conflit futur pourra devenir une scène publique sans possibilité de retrait.",
          [
            stat("mediaPresence", 3, "Documentaire attendu"),
            stat("cohesion", -3, "Réunions sous caméra"),
            hidden("scandalRisk", 4),
          ],
          {
            followUps: [{ eventId: "media_past_words", afterDecisions: 4, probability: 0.88 }],
            setFlags: { documentary_full_access: true },
          },
        ),
      }),
      decision({
        id: "documentary_refuse_publish",
        label:
          "Refuser le tournage et publier chaque semaine un compte rendu écrit des décisions internes",
        tag: "TRANSPARENT",
        strategy: "legal_action",
        result: outcome(
          "documentary_replaced_by_minutes",
          "Des comptes rendus à la place des coulisses",
          "La production choisit un autre sujet, tandis que vos synthèses hebdomadaires installent une transparence plus austère. Elles deviennent utiles aux militants sans créer le rendez-vous populaire espéré.",
          [
            stat("mediaPresence", -3, "Documentaire refusé"),
            stat("credibility", 3, "Décisions documentées"),
            hidden("scandalRisk", -2),
          ],
          { setFlags: { public_campaign_minutes: true } },
        ),
      }),
    ],
  }),
  event({
    id: "media_past_words",
    title: "Une promesse revient au montage",
    category: "media",
    summary:
      "Le documentaire confronte votre dernière position à une intervention enregistrée plus tôt. Le changement peut être expliqué par de nouvelles données, mais le montage fait apparaître les deux phrases à quelques secondes d’intervalle.",
    themes: ["institutions", "civil_liberties"],
    importance: "major",
    rarity: "uncommon",
    phaseWeights: mediaPhases,
    minDecisionIndex: 8,
    entityReferences: [{ entityId: "france_2", role: "host" }],
    editorialSensitivity: "none",
    chain: {
      id: "documentary_access",
      step: 2,
      followsEventIds: ["media_documentary_access"],
      minimumDelay: 3,
      maximumDelay: 12,
    },
    choices: [
      decision({
        id: "past_words_timeline",
        label:
          "Fournir la chronologie complète et nommer précisément les faits qui ont modifié votre position",
        tag: "TRANSPARENT",
        strategy: "media_response",
        result: outcome(
          "past_words_evolution_explained",
          "Le changement retrouve sa chronologie",
          "La production intègre les documents nouveaux et conserve les deux phrases. Le public voit une évolution argumentée plutôt qu’une conversion invisible, ce qui réduit le dommage sans effacer la différence.",
          [
            stat("credibility", 3, "Évolution expliquée"),
            hidden("consistency", 3),
            stat("mediaPresence", 1, "Chronologie reprise"),
          ],
        ),
      }),
      decision({
        id: "past_words_restore_first",
        label:
          "Revenir à votre première position et reconnaître que le dernier infléchissement allait trop loin",
        tag: "LOYAL",
        strategy: "policy_commitment",
        statement: {
          topic: "réforme institutionnelle",
          policyTopic: "institutions",
          text: "La position institutionnelle initiale reste celle du programme",
          stance: 0,
        },
        result: outcome(
          "past_words_line_restored",
          "Le programme retrouve son point fixe",
          "Le retour rassure les militants attachés au texte adopté, mais expose votre précédent repositionnement comme une erreur. La cohésion remonte pendant que les nouveaux soutiens doutent de la stabilité de votre parole.",
          [
            stat("cohesion", 4, "Ligne initiale restaurée"),
            stat("popularity", -2, "Recul visible"),
            hidden("baseSupport", 2),
          ],
        ),
      }),
      decision({
        id: "past_words_attack_edit",
        label:
          "Dénoncer un montage trompeur et demander la diffusion intégrale des deux entretiens",
        tag: "OFFENSIF",
        strategy: "legal_action",
        result: outcome(
          "past_words_full_footage",
          "Les rushes confirment la contradiction",
          "France 2 publie de longs extraits : le montage était serré, mais les positions restent incompatibles. Votre attaque prolonge une difficulté qui aurait pu rester un passage du documentaire.",
          [
            stat("credibility", -5, "Contradiction confirmée"),
            stat("mediaPresence", 4, "Rushes très commentés"),
            stat("rejection", 2, "Accusation retournée"),
          ],
          { setFlags: { documentary_dispute_lost: true } },
        ),
      }),
    ],
  }),
  event({
    id: "media_front_page",
    title: "La une vous prête un tournant",
    category: "media",
    summary:
      "Les Échos titrent sur votre supposé « tournant pro-entreprises » après une proposition d’investissement. L’article est nuancé, mais la une suffit à inquiéter une partie des militants et à intéresser des dirigeants de PME.",
    themes: ["economy", "work"],
    phaseWeights: mediaPhases,
    entityReferences: [
      { entityId: "les_echos", role: "host" },
      { entityId: "cpme", role: "context" },
    ],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "front_page_balance",
        label:
          "Publier ensemble vos mesures pour l’investissement, les salaires et les droits des salariés",
        tag: "RASSEMBLEUR",
        strategy: "media_response",
        statement: {
          topic: "politique économique",
          policyTopic: "economy",
          text: "L’investissement productif sera conditionné à des engagements sur l’emploi et les salaires",
          stance: 0,
        },
        result: outcome(
          "front_page_balance_restored",
          "Le tournant devient un contrat",
          "La publication simultanée empêche chaque camp de ne retenir qu’une moitié du projet. Elle ne satisfait pleinement ni les syndicats ni les dirigeants, mais rend la cohérence économique plus difficile à caricaturer.",
          [
            stat("credibility", 4, "Architecture économique lisible"),
            hidden("consistency", 3),
            bloc("middle_class_workers", 2),
          ],
        ),
      }),
      decision({
        id: "front_page_embrace_business",
        label: "Assumer la une et annoncer un pacte d’investissement avec la CPME et le Medef",
        tag: "OPPORTUNISTE",
        strategy: "program_shift",
        statement: {
          topic: "politique économique",
          policyTopic: "economy",
          text: "Un pacte avec les organisations patronales accélérera l’investissement privé",
          stance: 55,
          ideology: { economy: 5 },
        },
        result: outcome(
          "front_page_turn_confirmed",
          "Le rapprochement patronal est officialisé",
          "Les organisations accueillent l’ouverture et proposent des groupes de travail. Vos militants les plus sociaux parlent d’un changement de cap, qui élargit le potentiel électoral tout en fragilisant le socle.",
          [
            bloc("entrepreneurs", 6, "Pacte d’investissement"),
            stat("cohesion", -5, "Virage contesté"),
            hidden("potentialSupport", 3),
            hidden("baseSupport", -2),
          ],
          { setFlags: { employer_pact_announced: true } },
        ),
      }),
      decision({
        id: "front_page_union_meeting",
        label:
          "Convoquer dès le lendemain les syndicats pour négocier les contreparties de l’investissement",
        tag: "INSTITUTIONNEL",
        strategy: "negotiation",
        statement: {
          topic: "politique économique",
          policyTopic: "work",
          text: "Les aides à l’investissement auront des contreparties négociées avec les syndicats",
          stance: -25,
        },
        result: outcome(
          "front_page_social_terms_negotiated",
          "La une ouvre une négociation sociale",
          "La CGT et la CFDT acceptent des rencontres séparées. Le processus ralentit votre annonce économique, mais il ancre les contreparties dans une négociation réelle plutôt que dans une formule de riposte.",
          [
            stat("credibility", 2, "Dialogue social engagé"),
            bloc("public_services", 2),
            stat("momentum", -1, "Annonce ralentie"),
          ],
        ),
      }),
    ],
  }),
];
