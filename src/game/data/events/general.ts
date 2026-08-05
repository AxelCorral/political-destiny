import type { GameEventDefinition } from "@/game/types";

import { makeScenario, type ScenarioSeed } from "./factory";

const campaignSeeds: ScenarioSeed[] = [
  {
    id: "campaign_official_launch",
    title: "Le lancement doit marquer les esprits",
    category: "campaign",
    summary:
      "Votre équipe a réservé une salle symbolique pour l’entrée officielle en campagne. Les militants attendent un cap clair, tandis que les journalistes cherchent surtout l’image qui résumera la soirée.",
    prudent: "Dérouler trois priorités déjà chiffrées",
    bold: "Annoncer un objectif national inattendu",
    collective: "Faire parler des militants de plusieurs territoires",
    maxDecisionIndex: 8,
  },
  {
    id: "campaign_factory_visit",
    title: "Une usine ouvre ses portes",
    category: "campaign",
    summary:
      "La direction et les représentants du personnel vous accueillent ensemble dans une usine fictive. Chacun espère que votre visite mettra en lumière des attentes très différentes sur l’emploi et l’investissement.",
    prudent: "Écouter séparément salariés et direction",
    bold: "Présenter sur place un pacte industriel",
    collective: "Organiser une table ronde sans caméra",
  },
  {
    id: "campaign_market_walkabout",
    title: "Le marché devient une arène",
    category: "campaign",
    summary:
      "Une déambulation annoncée comme tranquille attire partisans, opposants et dizaines de téléphones. Un échange tendu commence devant un étal, sous le regard d’une équipe de télévision locale.",
    prudent: "Répondre calmement puis reprendre la visite",
    bold: "Transformer l’échange en mini-débat public",
  },
  {
    id: "campaign_volunteer_surge",
    title: "Des bénévoles affluent au siège",
    category: "campaign",
    summary:
      "Une séquence favorable provoque un afflux de nouveaux bénévoles. Le siège fictif manque de responsables formés et doit choisir entre les intégrer vite ou protéger une organisation déjà fragile.",
    prudent: "Former les nouveaux par petits groupes",
    bold: "Lancer immédiatement une opération nationale",
    collective: "Confier leur accueil aux sections locales",
  },
  {
    id: "campaign_poster_shortage",
    title: "Les affiches arrivent trop tard",
    category: "campaign",
    summary:
      "Un imprimeur fictif annonce un retard important alors que plusieurs équipes locales ont déjà réservé leurs emplacements. La mésaventure peut rester logistique ou devenir un symbole de désorganisation.",
    prudent: "Répartir le stock disponible selon les priorités",
    bold: "Assumer le retard avec une campagne sans affiche",
    delayed: true,
  },
  {
    id: "campaign_endorsements_missing",
    title: "Les parrainages restent incertains",
    category: "campaign",
    summary:
      "Des élus fictifs promis à votre candidature tardent à confirmer leur soutien administratif. Le calendrier se resserre et chaque déplacement consacré aux parrainages éloigne le candidat des médias nationaux.",
    prudent: "Sécuriser discrètement les promesses existantes",
    bold: "Rendre publique la liste des hésitations",
    collective: "Mobiliser tous les élus du mouvement",
    maxDecisionIndex: 14,
  },
  {
    id: "campaign_budget_arbitration",
    title: "Le budget ne suivra pas tout",
    category: "campaign",
    summary:
      "La trésorière fictive présente trois dépenses impossibles à financer ensemble : un grand meeting, une tournée rurale et une campagne numérique. Votre arbitrage dira aussi quel public compte vraiment.",
    prudent: "Réduire chaque poste sans en supprimer aucun",
    bold: "Tout miser sur une tournée spectaculaire",
    collective: "Laisser les antennes choisir leurs priorités",
  },
  {
    id: "campaign_regional_rally",
    title: "Le meeting loin de Paris",
    category: "campaign",
    summary:
      "Une fédération locale propose un grand rendez-vous dans une région où votre parti est faible. Le succès serait un signal d’élargissement ; une salle vide confirmerait les doutes sur votre implantation.",
    prudent: "Choisir une salle compacte et bien remplie",
    bold: "Réserver la plus grande enceinte disponible",
    collective: "Inviter les associations et élus locaux",
  },
  {
    id: "campaign_door_to_door",
    title: "Cent quartiers en porte-à-porte",
    category: "campaign",
    summary:
      "Les responsables de terrain proposent une journée nationale de porte-à-porte. L’opération demande une logistique lourde, mais offrirait un test réel de la capacité du mouvement à sortir de ses cercles habituels.",
    prudent: "Cibler vingt territoires bien préparés",
    bold: "Déployer simultanément cent équipes locales",
    collective: "Donner carte blanche aux responsables locaux",
  },
  {
    id: "campaign_bus_breakdown",
    title: "Le car reste sur le bas-côté",
    category: "campaign",
    summary:
      "Le car de campagne tombe en panne avant une réunion importante. Les images circulent déjà et l’équipe hésite entre cacher l’incident ou transformer ce contretemps banal en moment de proximité.",
    prudent: "Rejoindre la réunion dans des véhicules discrets",
    bold: "Continuer le trajet avec les militants présents",
  },
  {
    id: "campaign_citizens_convention",
    title: "Une convention veut vous bousculer",
    category: "campaign",
    summary:
      "Un collectif citoyen fictif vous invite à répondre sans notes à vingt questions tirées au sort. L’exercice peut nourrir votre programme, mais expose aussi ses zones encore floues.",
    prudent: "Accepter dix questions préparées par tirage",
    bold: "Répondre aux vingt questions en direct",
    collective: "Venir avec trois responsables thématiques",
  },
  {
    id: "campaign_farmers_roundtable",
    title: "La colère gagne les campagnes",
    category: "campaign",
    summary:
      "Des agriculteurs fictifs bloquent symboliquement une route et demandent à rencontrer chaque candidat. Les revendications mêlent revenus, normes, eau et concurrence, sans solution simple ni uniforme.",
    prudent: "Proposer un calendrier précis de négociation",
    bold: "Soutenir publiquement leur action symbolique",
    collective: "Réunir agriculteurs, consommateurs et écologistes",
  },
  {
    id: "campaign_student_forum",
    title: "Les étudiants refusent les slogans",
    category: "campaign",
    summary:
      "Lors d’un forum universitaire fictif, les questions portent sur le logement, la précarité et l’avenir climatique. Le public réagit vite aux réponses trop générales ou trop longues.",
    prudent: "Détailler une mesure immédiatement applicable",
    bold: "Promettre un grand plan pour la jeunesse",
    collective: "Inviter des étudiants à amender la proposition",
  },
  {
    id: "campaign_hospital_night",
    title: "Une nuit aux urgences",
    category: "campaign",
    summary:
      "Une équipe soignante fictive accepte une visite tardive à condition qu’elle ne perturbe pas le service. Les caméras pourraient donner de la force au message, mais aussi rendre la séquence indécente.",
    prudent: "Visiter sans caméra et publier un compte rendu",
    bold: "Diffuser une séquence en direct très encadrée",
    collective: "Donner la parole aux soignants volontaires",
  },
  {
    id: "campaign_small_business",
    title: "Une PME teste votre projet",
    category: "campaign",
    summary:
      "Les salariés et la dirigeante d’une entreprise fictive passent vos propositions économiques au crible. Deux mesures paraissent se contredire lorsqu’elles sont appliquées à leur situation concrète.",
    prudent: "Reconnaître la tension et préciser le calendrier",
    bold: "Défendre la cohérence globale sans concession",
  },
  {
    id: "campaign_peripheral_town",
    title: "Le rendez-vous de la périphérie",
    category: "campaign",
    summary:
      "Dans une ville périphérique fictive, les habitants parlent transports, sécurité, emploi et sentiment d’abandon. Votre programme répond à certains sujets mais reste discret sur les autres.",
    prudent: "Concentrer la réponse sur deux engagements réalistes",
    bold: "Annoncer un contrat global pour les périphéries",
    collective: "Construire une feuille de route avec les associations",
  },
  {
    id: "campaign_overseas_trip",
    title: "Le déplacement ultramarin décisif",
    category: "campaign",
    summary:
      "Une étape ultramarine confronte votre équipe à des enjeux de prix, de services publics et d’adaptation climatique qu’elle maîtrise imparfaitement. Chaque approximation serait immédiatement remarquée.",
    prudent: "Écouter avant de présenter des engagements ciblés",
    bold: "Annoncer un vaste plan d’égalité réelle",
    collective: "Confier la séquence aux responsables ultramarins",
  },
  {
    id: "campaign_rural_desert",
    title: "Trois villages sans médecin",
    category: "campaign",
    summary:
      "Votre tournée traverse plusieurs villages fictifs touchés par la fermeture de services. Les maires demandent une réponse nationale tandis que vos experts défendent des solutions adaptées à chaque territoire.",
    prudent: "Proposer une expérimentation territoriale financée",
    bold: "Garantir un accès national à moins de trente minutes",
    collective: "Signer un pacte avec les maires volontaires",
  },
  {
    id: "campaign_union_meeting",
    title: "Le face-à-face syndical",
    category: "campaign",
    summary:
      "Une confédération syndicale fictive vous reçoit devant ses délégués. Elle soutient une partie de vos mesures mais exige une clarification sur le financement et le dialogue social.",
    prudent: "Ouvrir une négociation thème par thème",
    bold: "Signer immédiatement leurs trois priorités",
    collective: "Proposer une conférence sociale après l’élection",
  },
  {
    id: "campaign_donation_drive",
    title: "La collecte ralentit brutalement",
    category: "campaign",
    summary:
      "Les petits dons fictifs se tassent au moment où la campagne entre dans sa phase la plus coûteuse. Il faut relancer sans donner l’impression que chaque message demande de l’argent.",
    prudent: "Présenter un budget transparent et un objectif modeste",
    bold: "Organiser un marathon numérique de financement",
    collective: "Demander aux sections de lancer leurs collectes",
  },
  {
    id: "campaign_rally_security",
    title: "Le meeting sous haute tension",
    category: "campaign",
    summary:
      "Des contre-manifestants annoncent une présence pacifique près de votre meeting. Les organisateurs doivent garantir la sécurité tout en évitant une mise en scène qui dramatiserait artificiellement la situation.",
    prudent: "Maintenir le meeting avec un dispositif discret",
    bold: "Déplacer la prise de parole sur la place publique",
    collective: "Négocier des horaires séparés avec les organisateurs",
    setFlagsOnBold: { public_order_escalation: true },
  },
  {
    id: "campaign_calendar_conflict",
    title: "Deux invitations le même soir",
    category: "campaign",
    summary:
      "Un grand rendez-vous économique et une rencontre associative attendue se chevauchent. Choisir l’un enverra un signal politique ; tenter les deux risque de n’en réussir aucun.",
    prudent: "Assister au rendez-vous le mieux préparé",
    bold: "Traverser le pays pour participer aux deux",
    collective: "Envoyer un cadre fictif à chaque événement",
  },
  {
    id: "campaign_slogan_test",
    title: "Le slogan divise le siège",
    category: "campaign",
    summary:
      "L’agence fictive propose une formule courte, efficace mais ambiguë. Les militants la retiennent immédiatement, tandis que les cadres craignent qu’elle simplifie trop votre projet.",
    prudent: "Retenir une formule plus précise et moins brillante",
    bold: "Imprimer immédiatement le slogan le plus frappant",
    collective: "Tester trois slogans auprès des sections",
  },
  {
    id: "campaign_weather_disaster",
    title: "La pluie noie la tournée",
    category: "campaign",
    summary:
      "Une série d’étapes en extérieur devient impraticable sous une pluie persistante. Les équipes locales ont travaillé des semaines et redoutent une annulation vécue comme un abandon.",
    prudent: "Transformer les étapes en réunions couvertes",
    bold: "Maintenir une marche courte sous la pluie",
  },
  {
    id: "campaign_final_rally",
    title: "Le dernier grand meeting",
    category: "campaign",
    summary:
      "À quelques jours du vote, votre dernier meeting peut consolider les fidèles ou chercher encore des indécis. Le discours ne pourra pas tout faire sans perdre sa force.",
    prudent: "Rappeler le projet et les raisons de voter",
    bold: "Lancer un appel dramatique au vote utile",
    collective: "Faire monter alliés et militants sur scène",
    minDecisionIndex: 18,
  },
];

const mediaSeeds: ScenarioSeed[] = [
  {
    id: "media_economic_morning",
    title: "La matinale qui peut tout changer",
    category: "media",
    summary:
      "Une journaliste fictive vous demande de chiffrer votre mesure phare en direct. Le montant exact n’est pas dans vos notes et votre silence commence déjà à sembler trop long.",
    prudent: "Donner un ordre de grandeur prudent",
    bold: "Tenter le chiffrage détaillé de mémoire",
    collective: "Renvoyer au document publié par votre équipe",
    enqueueOnBold: ["media_fact_check_followup"],
    topic: "fiscalité",
  },
  {
    id: "media_unflattering_photo",
    title: "La photographie fait écran",
    category: "media",
    summary:
      "Une photographie prise au mauvais moment domine les réseaux et détourne l’attention d’un discours réussi. Votre équipe propose plusieurs façons de reprendre le contrôle de la séquence.",
    prudent: "Ignorer l’image et republier le fond du discours",
    bold: "Détourner vous-même la photographie avec humour",
  },
  {
    id: "media_short_video",
    title: "Trente secondes pour convaincre",
    category: "media",
    summary:
      "Une plateforme vous propose un format vidéo très court avec une question surprise. La simplicité peut toucher un nouveau public, mais toute nuance disparaîtra au montage.",
    prudent: "Préparer une réponse unique et factuelle",
    bold: "Accepter la question surprise sans répétition",
  },
  {
    id: "media_long_podcast",
    title: "Trois heures sans filet",
    category: "media",
    summary:
      "Un podcast fictif à forte audience vous invite pour un entretien exceptionnellement long. L’espace permet d’expliquer votre projet, mais multiplie aussi les occasions de contradiction.",
    prudent: "Accepter une heure centrée sur le programme",
    bold: "Participer aux trois heures en direct",
    delayed: true,
  },
  {
    id: "media_fictional_editorial_support",
    title: "Un éditorialiste fictif vous soutient",
    category: "media",
    summary:
      "Une figure médiatique entièrement fictive annonce son soutien. Sa popularité apporte de la visibilité, mais ses anciennes prises de position divisent fortement votre propre électorat.",
    prudent: "Remercier sans intégrer cette personne à la campagne",
    bold: "L’inviter au prochain grand meeting",
    collective: "Consulter les responsables locaux avant de répondre",
  },
  {
    id: "media_fact_check_followup",
    title: "Les chiffres passent au vérificateur",
    category: "media",
    summary:
      "Un collectif de vérification fictif compare votre dernière intervention aux documents publiés par votre équipe. La conclusion est nuancée, mais chacun n’en retiendra qu’une phrase.",
    prudent: "Publier toutes les hypothèses de calcul",
    bold: "Contester publiquement leur méthode",
    collective: "Proposer une rencontre technique ouverte",
    minDecisionIndex: 3,
  },
  {
    id: "media_silence_day",
    title: "Une journée hors du bruit",
    category: "media",
    summary:
      "Votre équipe veut instaurer une journée sans interview pour préparer la suite. Les journalistes y voient déjà un signe de fatigue ou une stratégie mystérieuse.",
    prudent: "Maintenir le silence en publiant l’agenda de travail",
    bold: "Disparaître totalement pendant vingt-quatre heures",
  },
  {
    id: "media_open_microphone",
    title: "Le micro était encore ouvert",
    category: "media",
    summary:
      "Après une émission, un micro capte une remarque sèche sur l’organisation de votre équipe fictive. La phrase est réelle dans l’univers du jeu, privée, et déjà partagée.",
    prudent: "Reconnaître l’agacement et présenter vos excuses",
    bold: "Assumer la critique comme une exigence de campagne",
    delayed: true,
  },
  {
    id: "media_live_stream",
    title: "Le direct refuse de finir",
    category: "media",
    summary:
      "Une session en ligne dépasse largement le temps prévu car les questions continuent d’affluer. Poursuivre crée de la proximité, mais votre fatigue devient visible.",
    prudent: "Conclure après trois dernières questions",
    bold: "Continuer jusqu’à épuiser la file de questions",
  },
  {
    id: "media_prime_time_invite",
    title: "L’invitation de dernière minute",
    category: "media",
    summary:
      "Une grande émission fictive vous propose le siège laissé vacant par un adversaire. Vous gagnerez une audience rare, avec seulement deux heures pour préparer un format exigeant.",
    prudent: "Accepter avec un thème clairement négocié",
    bold: "Accepter toutes les questions sans condition",
  },
  {
    id: "media_local_press",
    title: "La presse locale veut du concret",
    category: "media",
    summary:
      "Plusieurs titres locaux fictifs organisent un entretien commun consacré aux fermetures de services et aux transports. Les réponses nationales toutes faites ne suffiront pas.",
    prudent: "Préparer trois engagements territoriaux vérifiables",
    bold: "Promettre un moratoire national immédiat",
    collective: "Répondre avec vos élus locaux fictifs",
  },
  {
    id: "media_foreign_interview",
    title: "Le regard venu de l’étranger",
    category: "media",
    summary:
      "Une chaîne étrangère fictive veut vous interroger sur l’Europe et la place de la France. L’entretien offre une stature internationale, mais ses extraits seront retraduits et raccourcis.",
    prudent: "Rester sur trois principes diplomatiques",
    bold: "Annoncer une doctrine européenne complète",
    topic: "Europe",
  },
  {
    id: "media_documentary_access",
    title: "La caméra entre au siège",
    category: "media",
    summary:
      "Une équipe documentaire fictive demande un accès presque complet à votre campagne. La transparence peut humaniser l’équipe, mais les tensions internes deviendront impossibles à cacher.",
    prudent: "Ouvrir certaines réunions avec droit de retrait limité",
    bold: "Accorder un accès total jusqu’au scrutin",
    collective: "Soumettre les règles d’accès à toute l’équipe",
    delayed: true,
  },
  {
    id: "media_past_words",
    title: "Vos mots vous rattrapent",
    category: "media",
    summary:
      "Une déclaration enregistrée plus tôt dans la campagne semble contredire votre nouvelle stratégie. La formulation exacte conservée dans votre historique circule à nouveau.",
    prudent: "Expliquer clairement pourquoi votre position a évolué",
    bold: "Nier toute contradiction et changer de sujet",
    collective: "Réexaminer l’accord qui crée la contradiction",
    minDecisionIndex: 10,
  },
  {
    id: "media_front_page",
    title: "Votre visage en une",
    category: "media",
    summary:
      "Un hebdomadaire fictif prépare une couverture sur votre ascension. Le titre proposé est flatteur mais vous enferme dans une image personnelle éloignée du projet collectif.",
    prudent: "Accorder l’entretien en recentrant sur le programme",
    bold: "Assumer une mise en scène très personnelle",
    collective: "Demander une couverture consacrée à l’équipe",
  },
];

const debateSeeds: ScenarioSeed[] = [
  {
    id: "debate_economy_round",
    title: "Première manche sur l’économie",
    category: "debate",
    summary:
      "Le débat télévisé fictif commence par le pouvoir d’achat et le financement des promesses. Votre principal rival attaque la crédibilité de vos chiffres dès sa première intervention.",
    prudent: "Répondre avec deux chiffres et une priorité",
    bold: "Retourner l’attaque sur son propre programme",
    collective: "Citer les partenaires ayant construit la mesure",
    minDecisionIndex: 8,
    topic: "fiscalité",
  },
  {
    id: "debate_security_round",
    title: "Deuxième manche sur la sécurité",
    category: "debate",
    summary:
      "La discussion bascule vers sécurité, justice et libertés publiques. Les candidats fictifs cherchent la formule définitive, tandis que le public attend surtout des mesures applicables.",
    prudent: "Distinguer urgence, prévention et justice",
    bold: "Proposer une rupture juridique majeure",
    collective: "Appeler à un pacte républicain transversal",
    minDecisionIndex: 10,
    topic: "sécurité",
  },
  {
    id: "debate_free_conclusion",
    title: "La minute de conclusion libre",
    category: "debate",
    summary:
      "Il vous reste soixante secondes pour conclure un débat serré. Répéter le programme rassurera les fidèles ; une adresse plus personnelle peut toucher au-delà du socle.",
    prudent: "Résumer calmement vos trois engagements",
    bold: "Improviser une adresse personnelle au pays",
    minDecisionIndex: 12,
  },
  {
    id: "debate_duel_interruption",
    title: "Votre rival coupe la parole",
    category: "debate",
    summary:
      "Pendant un duel fictif, votre adversaire interrompt chacune de vos réponses. Le modérateur tarde à intervenir et votre maîtrise de la séquence devient elle-même le sujet.",
    prudent: "Demander calmement le respect du temps de parole",
    bold: "L’interrompre à votre tour plus fermement",
  },
  {
    id: "debate_unknown_question",
    title: "La question que personne n’attendait",
    category: "debate",
    summary:
      "Une citoyenne fictive pose une question technique absente de toutes les notes préparatoires. Répondre précisément serait risqué ; reconnaître une limite peut sembler inhabituel en direct.",
    prudent: "Reconnaître la limite puis donner votre méthode",
    bold: "Construire immédiatement une réponse détaillée",
  },
  {
    id: "debate_all_candidates",
    title: "Neuf pupitres sous les projecteurs",
    category: "debate",
    summary:
      "Tous les candidats fictifs se retrouvent sur le même plateau. Le temps est fragmenté et les plus petits veulent provoquer un échange direct avec les favoris.",
    prudent: "Choisir deux interventions fortes et préparées",
    bold: "Répondre à chaque attaque sans exception",
    collective: "Proposer un point d’accord démocratique commun",
  },
  {
    id: "debate_fact_card",
    title: "Une fiche contredit votre rival",
    category: "debate",
    summary:
      "Votre équipe vous transmet pendant la publicité un chiffre qui fragilise l’argument du principal adversaire fictif. Il est solide, mais son contexte demande plus de temps que prévu.",
    prudent: "Présenter le chiffre avec toutes ses limites",
    bold: "En faire l’attaque centrale de la reprise",
  },
  {
    id: "debate_post_show_spin",
    title: "La bataille continue en coulisses",
    category: "debate",
    summary:
      "Le débat est terminé, mais les équipes fictives envahissent les plateaux pour imposer leur lecture. Votre prestation correcte risque de disparaître derrière des commentaires plus bruyants.",
    prudent: "Diffuser trois extraits fidèles à vos réponses",
    bold: "Proclamer une victoire nette dès la sortie",
    collective: "Laisser plusieurs soutiens défendre leur lecture",
  },
];

const programSeeds: ScenarioSeed[] = [
  {
    id: "program_pensions",
    title: "Votre ligne sur les retraites",
    category: "program",
    summary:
      "À trois mois du scrutin, vos réponses sur les retraites sont jugées trop floues. Vous devez fixer un principe, un calendrier et la place du dialogue social.",
    prudent: "Ouvrir une conférence sociale avant toute réforme",
    bold: "Fixer immédiatement un nouvel âge légal",
    collective: "Proposer une réforme négociée par métiers",
    topic: "retraites",
    minDecisionIndex: 8,
  },
  {
    id: "program_taxation",
    title: "L’équation fiscale devient publique",
    category: "program",
    summary:
      "Les mesures nouvelles dépassent les économies déjà annoncées. Votre équipe doit clarifier qui paiera, quelles dépenses évolueront et à quel rythme le budget retrouvera un équilibre.",
    prudent: "Étaler les mesures avec une clause de financement",
    bold: "Assumer une refonte fiscale dès la première année",
    collective: "Confier le chiffrage à une convention pluraliste",
    topic: "fiscalité",
  },
  {
    id: "program_wages",
    title: "Les salaires entrent au premier plan",
    category: "program",
    summary:
      "Une mobilisation sociale fictive replace les salaires au centre de la campagne. Employeurs, syndicats et fonction publique attendent des mécanismes différents, parfois incompatibles.",
    prudent: "Cibler les bas salaires avec un financement précis",
    bold: "Annoncer une hausse générale soutenue par l’État",
    collective: "Convoquer une conférence nationale des rémunérations",
    topic: "salaires",
  },
  {
    id: "program_energy",
    title: "Le choix énergétique ne peut attendre",
    category: "program",
    summary:
      "Un rapport fictif projette des tensions sur l’approvisionnement. Nucléaire, renouvelables, sobriété et prix exigent un calendrier que votre programme laissait jusque-là ouvert.",
    prudent: "Présenter un mix progressif avec étapes révisables",
    bold: "Choisir une filière prioritaire pour vingt ans",
    collective: "Soumettre la trajectoire à un débat parlementaire",
    topic: "énergie",
  },
  {
    id: "program_immigration",
    title: "Immigration et intégration à trancher",
    category: "program",
    summary:
      "Vos adversaires fictifs vous pressent de préciser admission, intégration, éloignement et accueil. Une réponse courte sera forcément incomplète, mais le silence ne tient plus.",
    prudent: "Distinguer chaque procédure et ses garanties",
    bold: "Annoncer une réforme globale par référendum",
    collective: "Chercher un accord parlementaire sur trois mesures",
    topic: "immigration",
  },
  {
    id: "program_health",
    title: "La santé réclame des priorités",
    category: "program",
    summary:
      "Hôpital, médecine de ville, prévention et dépendance se disputent les mêmes moyens. Vous devez choisir la première réforme sans laisser croire que les autres disparaissent.",
    prudent: "Commencer par l’accès aux soins de proximité",
    bold: "Refondre simultanément financement et organisation",
    collective: "Lancer des conventions régionales de santé",
    topic: "santé",
  },
  {
    id: "program_school",
    title: "L’école attend votre première mesure",
    category: "program",
    summary:
      "Enseignants, parents et élèves fictifs décrivent des urgences différentes. Le niveau, les conditions de travail et les inégalités territoriales exigent des réponses qui ne produiront pas les mêmes effets.",
    prudent: "Prioriser les premières années et la formation",
    bold: "Réorganiser entièrement le temps scolaire",
    collective: "Négocier un pacte de dix ans pour l’école",
    topic: "école",
  },
  {
    id: "program_europe",
    title: "La ligne européenne se précise",
    category: "program",
    summary:
      "Une négociation européenne fictive remet souveraineté, budget commun et règles économiques au cœur du débat. Votre position doit devenir compréhensible en une phrase sans trahir sa complexité.",
    prudent: "Définir trois réformes à négocier avec les partenaires",
    bold: "Conditionner la participation française à une refonte",
    collective: "Proposer une convention européenne des citoyens",
    topic: "Europe",
  },
  {
    id: "program_institutions",
    title: "La République doit-elle changer",
    category: "program",
    summary:
      "La concentration du pouvoir présidentiel devient un thème de campagne. Référendum, proportionnelle, décentralisation et contrôle parlementaire offrent plusieurs réformes difficiles à mener ensemble.",
    prudent: "Commencer par la proportionnelle et le contrôle",
    bold: "Proposer une nouvelle Constitution par référendum",
    collective: "Élire une convention constitutionnelle pluraliste",
    topic: "institutions",
    setFlagsOnBold: { exceptional_institutions: true },
  },
  {
    id: "program_climate_adaptation",
    title: "Adapter le pays aux chocs climatiques",
    category: "program",
    summary:
      "Après plusieurs épisodes météorologiques fictifs, la prévention des risques rejoint la réduction des émissions. Votre programme doit répartir coûts, responsabilités et priorités territoriales.",
    prudent: "Financer d’abord les territoires les plus exposés",
    bold: "Lancer un plan national obligatoire d’adaptation",
    collective: "Contractualiser les objectifs région par région",
    topic: "écologie",
  },
];

export const generalEvents: GameEventDefinition[] = [
  ...campaignSeeds.map(makeScenario),
  ...mediaSeeds.map(makeScenario),
  ...debateSeeds.map(makeScenario),
  ...programSeeds.map(makeScenario),
];
