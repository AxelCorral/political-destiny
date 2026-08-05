# PROMPT MAÎTRE POUR CLAUDE CODE — JEU DE CAMPAGNE POLITIQUE FRANÇAISE

> **Nom de travail du projet : `Vers l’Élysée`**  
> Le nom, le sous-titre, les couleurs et tous les textes de marque doivent être centralisés dans un fichier de configuration afin de pouvoir être renommés facilement.

---

## 0. Ton rôle et ton mode d’exécution

Tu es Claude Code, architecte logiciel senior, lead game designer, développeur full-stack TypeScript, UX/UI designer mobile-first, test engineer et responsable qualité.

Tu travailles directement dans le dépôt courant avec une forte autonomie. Tu dois transformer ce cahier des charges en une application web complète, jouable, testée et documentée.

### Règles de travail

1. Commence par inspecter le dépôt : arborescence, `git status`, fichiers existants, versions de Node et du gestionnaire de paquets.
2. Si le dépôt est vide, initialise proprement le projet.
3. Ne pose pas de question sauf blocage réellement impossible à résoudre. Prends des décisions raisonnables, documente-les et avance.
4. Tu peux installer les dépendances nécessaires, modifier l’architecture, créer les fichiers, lancer les tests, corriger les erreurs et faire des commits.
5. Ne touche jamais à des fichiers situés hors du dépôt.
6. N’expose jamais de secrets, jetons, clés ou données locales.
7. Ne nécessite aucun service payant, aucune API d’IA, aucun compte utilisateur et aucun backend pour la V1.
8. Fais des commits atomiques à la fin de chaque grande phase. Si un remote Git est déjà configuré et fonctionnel, pousse les commits ; sinon, laisse-les localement sans bloquer le travail.
9. À chaque étape, privilégie un produit réellement jouable plutôt qu’une architecture théorique inachevée.
10. Ne laisse pas de faux boutons, de pages vides ou de fonctions principales simulées.

### Résultat attendu

À la fin, le dépôt doit contenir une V1 complète, déployable et agréable à jouer, avec :

- une campagne présidentielle française fictive mais réaliste ;
- environ 30 décisions par partie ;
- des événements probabilistes et des conséquences différées ;
- des partis existants et la création d’un parti ;
- une simulation autonome des adversaires ;
- un premier et un second tour ;
- un résumé final détaillé ;
- un historique local des parties ;
- des succès/badges ;
- un mode tout aléatoire ;
- une image de résultat partageable ;
- un fonctionnement mobile, desktop et hors connexion ;
- une couverture de tests sérieuse ;
- une documentation claire.

---

# 1. Vision produit

Créer un jeu narratif et stratégique de campagne présidentielle française, inspiré uniquement dans son **rythme d’utilisation** et son **organisation visuelle générique** par les jeux de carrière à choix rapides :

- écran de sélection simple ;
- cartes verticales lisibles ;
- progression étape par étape ;
- événements courts ;
- 2 à 5 choix ;
- écran de conséquence ;
- statistiques de carrière ;
- badges ;
- panthéon/historique des parties.

Ne copie aucun texte, visuel, code, logo, nom, animation, icône distinctive, combinaison de couleurs ou mise en page exacte d’un jeu existant. Il faut produire une identité originale.

## Promesse centrale

> « Une année. Une campagne. Trente décisions pour atteindre l’Élysée. »

Le joueur choisit un parti politique français existant ou crée son propre mouvement. Il traverse une année de campagne, prend des décisions politiques, médiatiques, stratégiques et humaines, subit des événements imprévus et tente de se qualifier puis de remporter le second tour.

La simulation doit donner l’impression que :

- chaque partie raconte une histoire différente ;
- le hasard compte sans rendre les décisions inutiles ;
- un bon choix n’a pas toujours un bon résultat ;
- un choix risqué peut sauver ou détruire une campagne ;
- les adversaires ont leur propre trajectoire ;
- les anciens choix reviennent parfois hanter le joueur ;
- aucun parti ne garantit la victoire ;
- un petit parti peut réaliser une campagne historique même sans être élu.

## Durée et rythme

- Durée cible : **10 à 15 minutes**.
- Environ **30 décisions** dans une partie complète.
- Progression **événement par événement**.
- Le temps avance automatiquement entre les événements.
- Aucun écran de gestion lourd ou micro-management quotidien.
- Chaque événement doit être compris en quelques secondes.

---

# 2. Périmètre de la V1

## La V1 doit s’arrêter après l’élection

Le jeu principal se termine :

- après l’élimination au premier tour ;
- après une éventuelle décision de ralliement, de retrait ou de préparation de l’avenir ;
- ou après le second tour si le joueur est qualifié.

En cas de victoire, ajouter un court épilogue interactif de **formation du gouvernement** comportant 1 à 3 décisions, puis le résumé final.

Ne crée pas un simulateur complet de mandat présidentiel dans la V1. En revanche, conçois les types, l’état du jeu et les sauvegardes de manière à permettre plus tard un module séparé « Le mandat ».

## Modes de jeu

1. **Parti existant**
2. **Créer un parti**
3. **Tout aléatoire**
4. Prévoir dans l’architecture, mais ne pas obligatoirement exposer en V1 : **Défi quotidien** avec graine fixe.

---

# 3. Positionnement légal, éditorial et éthique obligatoire

Cette section est impérative.

## 3.1 Avertissement visible

Afficher au premier lancement, dans les paramètres et dans la page « À propos » :

> **Simulation politique fictive.** Les événements, dialogues, probabilités, classements et résultats de ce jeu sont fictifs. Ils ne constituent ni une prédiction électorale, ni une information officielle, ni un soutien à un parti ou à une personnalité. Les paramètres de gameplay ne sont pas des mesures objectives de valeur politique.

Ajouter une version courte sur les cartes de partage.

## 3.2 Partis réels

Les noms textuels de partis peuvent être configurés dans les données du jeu, mais :

- ne pas intégrer leurs logos officiels dans la V1 ;
- utiliser des monogrammes, formes abstraites et emblèmes originaux ;
- ne pas reproduire leurs chartes graphiques à l’identique ;
- ajouter une mention claire indiquant qu’il ne s’agit pas d’un produit officiel ni affilié ;
- centraliser tous les noms et alias dans des fichiers de données faciles à modifier.

## 3.3 Personnalités réelles

Architecture à deux niveaux :

### Mode public sûr, activé par défaut

- Le joueur incarne un **candidat fictif** ou un cadre fictif lié à un parti réel.
- Les personnalités politiques réelles peuvent être mentionnées comme éléments de contexte ou acteurs non jouables uniquement lorsque les informations utilisées sont publiques, factuelles, sourcées et non diffamatoires.
- Les dialogues attribués à une personne réelle ne doivent jamais être inventés comme s’ils étaient authentiques.

### Option expérimentale désactivée

Prévoir un feature flag `ENABLE_REAL_PLAYABLE_PERSONS=false`, sans l’activer dans la version publique. Cette option ne devra pouvoir être activée qu’après revue éditoriale et juridique.

## 3.4 Scandales, rumeurs et affaires

Règles absolues :

- Toute accusation inventée de crime, délit, agression sexuelle, corruption, fraude, maladie, addiction, affaire familiale ou enrichissement visant un acteur identifiable doit concerner **exclusivement un personnage fictif**.
- Ne jamais transformer une rumeur réelle non vérifiée en événement de jeu.
- Ne jamais attribuer à une personnalité réelle un secret fictif « inspiré » d’une rumeur.
- Un fait réel sensible ne peut être mentionné que s’il est vérifié, sourcé, présenté avec une formulation factuelle et nécessaire au contexte.
- Les événements graves doivent rester brefs, non voyeuristes et sans description graphique.

Créer dans les types de données :

```ts
type ActorIdentityKind = "fictional" | "real_public_figure";
```

Le validateur de contenu doit refuser certains tags de scandale lorsque `identityKind === "real_public_figure"`.

## 3.5 Neutralité

- Aucun parti ne doit être présenté comme moralement supérieur par conception.
- Tous doivent disposer de forces, faiblesses, électorats, risques et trajectoires gagnantes.
- Les valeurs de départ sont des paramètres de gameplay et doivent être décrites comme tels.
- Éviter les formulations insultantes ou militantes dans les textes système.
- Les événements satiriques rares doivent viser les mécanismes politiques et médiatiques, pas des groupes protégés ni des personnes vulnérables.

## 3.6 Données et vie privée

- Aucun compte.
- Aucun profil serveur.
- Aucune collecte de données personnelles en V1.
- Sauvegardes uniquement dans le navigateur.
- Aucun analytics ni publicité dans la V1.
- Ajouter une page « Confidentialité » expliquant que les sauvegardes restent sur l’appareil.
- Prévoir un emplacement technique désactivé pour une éventuelle publicité future, sans SDK publicitaire ni traceur.

---

# 4. Stack technique recommandée

Utilise les versions stables et compatibles disponibles au moment de l’exécution.

## Obligatoire

- Next.js avec App Router
- TypeScript strict
- React
- Tailwind CSS
- composants accessibles inspirés de shadcn/ui lorsque cela apporte une vraie valeur
- Zod pour valider les données de contenu
- moteur de simulation pur, indépendant de React
- Zustand ou une solution légère équivalente pour l’état d’interface
- IndexedDB via une librairie légère et maintenue pour les sauvegardes, historiques et succès
- Vitest
- React Testing Library
- Playwright
- ESLint
- formatage automatique cohérent
- PWA installable et utilisable hors connexion

## Interdits en V1

- Supabase
- PostgreSQL
- authentification
- serveur persistant
- API d’IA exécutée en production
- dépendance obligatoire à une API extérieure
- récupération de sondages en direct

## Déploiement

Le projet doit pouvoir être déployé facilement sur Vercel ou un hébergement statique compatible. Privilégier une application pouvant fonctionner sans backend.

Créer :

- `.nvmrc` ou équivalent ;
- `.env.example` même si aucun secret n’est requis ;
- scripts npm complets ;
- README d’installation et déploiement ;
- manifest PWA ;
- icônes originales simples ;
- page hors connexion.

---

# 5. Architecture du dépôt

Organise le code approximativement ainsi, en adaptant si nécessaire :

```text
src/
  app/
    page.tsx
    jouer/
    campagne/
    archives/
    badges/
    methodologie/
    confidentialite/
    a-propos/
  components/
    ui/
    game/
    charts/
    layout/
  config/
    branding.ts
    game.ts
    featureFlags.ts
  game/
    engine/
      rng.ts
      eventSelector.ts
      outcomeResolver.ts
      effectProcessor.ts
      opponentSimulation.ts
      electorate.ts
      polls.ts
      election.ts
      scoring.ts
      achievements.ts
      endings.ts
      validation.ts
    schemas/
    types/
    data/
      parties/
      actors/
      electorate/
      events/
      achievements/
      endings/
      campaignMethods/
      realWorldSnapshot/
    selectors/
    fixtures/
  features/
    onboarding/
    partySelection/
    customParty/
    campaign/
    electionNight/
    archives/
    shareCard/
  lib/
    persistence/
    sharing/
    dates/
    formatting/
    accessibility/
  styles/
  tests/
public/
  icons/
  party-symbols/
  map/
docs/
  GAME_DESIGN.md
  ENGINE.md
  CONTENT_GUIDE.md
  REAL_WORLD_DATA.md
  LEGAL_EDITORIAL_CHECKLIST.md
  TESTING.md
```

Le cœur de simulation ne doit importer ni React, ni le DOM, ni des composants UI.

---

# 6. Modèle de jeu

## 6.1 État principal

Créer des types complets et sérialisables.

```ts
interface GameState {
  version: number;
  runId: string;
  seed: string;
  mode: "existing_party" | "custom_party" | "random";
  phase:
    | "setup"
    | "pre_campaign"
    | "campaign"
    | "official_campaign"
    | "first_round"
    | "between_rounds"
    | "second_round"
    | "government_epilogue"
    | "finished";
  currentDate: string;
  electionDate: string;
  decisionIndex: number;
  maxTargetDecisions: number;
  player: PlayerCandidate;
  playerPartyId: string;
  parties: Record<string, PartyState>;
  actors: Record<string, ActorState>;
  electorate: ElectorateState;
  world: WorldState;
  pollHistory: PollSnapshot[];
  decisionHistory: DecisionRecord[];
  publicNews: NewsItem[];
  scheduledEffects: ScheduledEffect[];
  eventCooldowns: Record<string, number>;
  flags: Record<string, boolean | number | string>;
  statementLedger: StatementRecord[];
  achievementsUnlocked: string[];
  endingId?: string;
  finalResult?: FinalResult;
}
```

## 6.2 Statistiques du parti et du candidat

Toutes les statistiques sont internes en `0..100`, sauf les montants et volumes.

### Statistiques visibles en permanence ou sur le tableau de bord

Limiter à six indicateurs principaux :

1. **Intentions de vote** — pourcentage de sondage actuel, imparfait.
2. **Popularité** — appréciation générale du candidat.
3. **Mobilisation** — capacité des militants et sympathisants à agir/voter.
4. **Trésorerie** — niveau simplifié, pas une comptabilité détaillée.
5. **Crédibilité** — aptitude perçue à gouverner.
6. **Cohésion** — stabilité interne du mouvement.

### Indicateurs visibles ponctuellement

- adhérents ;
- présence médiatique ;
- notoriété ;
- rejet ;
- dynamique ;
- implantation ;
- soutiens d’élus.

### Variables cachées

- socle électoral réel ;
- électorat potentiel ;
- réserves de voix ;
- transfert de second tour ;
- intégrité perçue détaillée ;
- compétence économique/sécuritaire/sociale ;
- fatigue de campagne ;
- risque de scandale ;
- loyauté des cadres ;
- ambition des rivaux ;
- confiance des segments ;
- abstention latente ;
- indécision ;
- sensibilité au vote utile ;
- niveau réel de soutien régional.

Les valeurs cachées peuvent être révélées indirectement par des textes, des tendances, des événements ou des bilans périodiques, jamais dans un tableau technique brut.

## 6.3 Traits du candidat fictif

Chaque candidat jouable dispose de traits internes :

- charisme ;
- maîtrise médiatique ;
- compétence perçue ;
- tactique ;
- intégrité ;
- endurance ;
- autorité ;
- empathie ;
- discipline ;
- capacité de rassemblement.

Ne pas demander au joueur de régler tous ces traits lorsqu’il choisit un parti existant. Ils sont dérivés de l’archétype du candidat fictif associé au parti et de la méthode de campagne choisie.

## 6.4 Axes idéologiques

Utiliser six axes continus de `-100` à `100` :

1. économie : étatisme ↔ libéralisme ;
2. société : progressisme ↔ conservatisme ;
3. Europe : souverainisme ↔ fédéralisme ;
4. écologie : productivisme ↔ transformation écologique/décroissance ;
5. autorité : libertés publiques ↔ ordre ;
6. immigration : ouverture ↔ restriction.

Les intitulés d’interface doivent rester descriptifs et non insultants.

Les décisions modifient progressivement :

- le positionnement réel du parti ;
- la perception de ce positionnement ;
- la cohérence avec ses déclarations passées ;
- l’enthousiasme de certains segments ;
- le rejet d’autres segments ;
- la cohésion interne.

Un virage brutal doit pouvoir entraîner gain électoral, accusation d’opportunisme, perte d’adhérents, fronde ou scission.

---

# 7. Partis jouables

Inclure au lancement les entrées configurables suivantes :

- La France insoumise — alias LFI ;
- Parti socialiste — PS ;
- Les Écologistes — alias historique EELV ;
- Renaissance ;
- Horizons ;
- Les Républicains — LR ;
- Rassemblement national — RN ;
- Reconquête ;
- Nouvelle Énergie ;
- Parti personnalisé.

Prévoir UDR comme groupe ou courant associé dans les données, pouvant selon des chaînes d’événements :

- rester allié au RN ;
- prendre son autonomie ;
- rejoindre une coalition ;
- soutenir un candidat différent.

## Données par parti

```ts
interface PartyDefinition {
  id: string;
  displayName: string;
  shortName: string;
  aliases: string[];
  isRealOrganization: boolean;
  visual: {
    primaryColor: string;
    secondaryColor: string;
    monogram: string;
    symbol: string;
  };
  ideology: IdeologyVector;
  baseline: {
    baseSupport: number;
    potentialSupport: number;
    mobilization: number;
    finances: number;
    mediaPresence: number;
    governingCredibility: number;
    cohesion: number;
    rejection: number;
    localStrength: number;
    electedSupport: number;
  };
  strengths: string[];
  weaknesses: string[];
  electorateAffinity: Record<ElectorateBlocId, number>;
  regionalAffinity: Record<RegionId, number>;
  nominationModeWeights: {
    automatic: number;
    primary: number;
    internalVote: number;
    leadershipCrisis: number;
  };
  strategicArchetypes: string[];
  uniqueEventTags: string[];
  sourceMetadata?: SourceMetadata[];
}
```

Les valeurs de départ ne doivent pas être présentées comme une vérité scientifique. Ajouter dans la méthodologie : « paramètres éditoriaux de gameplay, datés et révisables ».

## Équilibrage

- Chaque parti a une difficulté implicite différente.
- Aucun sélecteur « facile/moyen/difficile ».
- La victoire ne doit pas être prédéterminée à 90 % par le parti choisi.
- Un favori mal joué doit pouvoir échouer.
- Un petit parti parfaitement joué doit pouvoir créer une surprise, tout en conservant une probabilité réaliste.
- La progression par rapport au point de départ compte fortement dans le score final.

---

# 8. Création d’un parti

Le parcours doit être rapide : 60 à 90 secondes maximum.

## Étapes

1. Nom du parti
2. Sigle
3. Couleur principale
4. Choix d’un symbole original parmi une bibliothèque interne
5. Six à huit questions politiques à choix multiples
6. Deux questions d’organisation interne
7. Choix de trois mesures phares maximum
8. Résumé automatique du mouvement

## QCM idéologique

Créer des questions courtes sur :

- retraites ;
- fiscalité et dépenses publiques ;
- immigration ;
- sécurité et libertés ;
- Europe ;
- écologie/énergie ;
- services publics ;
- institutions.

Chaque réponse modifie les axes idéologiques et certains attributs.

## Organisation interne

Deux décisions rapides :

- mouvement vertical autour du chef ↔ parti démocratique et décentralisé ;
- priorité aux élus ↔ priorité aux militants ↔ priorité aux experts/techniciens.

Ces réponses influencent cohésion, rapidité de décision, risque de fronde, implantation et crédibilité.

## Électorat cible

Ne pas demander directement « quel électorat veux-tu viser ? ».

Le moteur doit le déduire automatiquement à partir :

- des axes idéologiques ;
- des mesures phares ;
- de l’organisation interne ;
- de la méthode de campagne ;
- du profil du candidat.

Afficher ensuite une synthèse comme :

> « Votre mouvement attire d’abord les actifs urbains diplômés, mais peine encore dans les zones rurales et chez les plus de 60 ans. »

Le joueur peut accepter ou choisir une variante stratégique parmi trois propositions, sans manipuler des tableaux complexes.

---

# 9. Méthodes de campagne initiales

Après le choix du parti, proposer cinq cartes originales :

1. **Le terrain d’abord**
   - mobilisation +
   - implantation +
   - médias -

2. **Présidentiable**
   - crédibilité +
   - rassemblement +
   - spontanéité -

3. **La rupture**
   - visibilité +
   - dynamique +
   - rejet +
   - risque médiatique +

4. **La campagne numérique**
   - jeunes +
   - viralité +
   - volatilité +
   - électorat âgé -

5. **L’union avant tout**
   - alliances +
   - cohésion potentielle +
   - concessions programmatiques +

Ajouter un bouton « Tout aléatoire ».

---

# 10. Moteur d’événements

## 10.1 Format

Un événement contient :

```ts
interface GameEventDefinition {
  id: string;
  title: string;
  category: EventCategory;
  summary: string;
  phaseWeights: Partial<Record<GamePhase, number>>;
  rarity: "common" | "uncommon" | "rare" | "legendary" | "secret";
  baseWeight: number;
  minDecisionIndex?: number;
  maxDecisionIndex?: number;
  eligibleParties?: string[];
  excludedParties?: string[];
  requiredTags?: string[];
  forbiddenFlags?: string[];
  eligibility: Condition[];
  cooldown: number;
  oncePerRun: boolean;
  worldImpact?: boolean;
  sensitiveContent?: SensitiveContentMeta;
  choices: EventChoice[];
  sourceMetadata?: SourceMetadata[];
}
```

```ts
interface EventChoice {
  id: string;
  label: string;
  visibleTag?: ChoiceTag;
  outcomeGroups: WeightedOutcome[];
  immediatePublicHint?: string;
}
```

```ts
interface WeightedOutcome {
  id: string;
  baseWeight: number;
  modifiers: ProbabilityModifier[];
  publicNarrative: string;
  effects: GameEffect[];
  delayedEffects?: DelayedEffectDefinition[];
  setFlags?: Record<string, boolean | number | string>;
  enqueueEventIds?: string[];
  endingTrigger?: string;
}
```

## 10.2 Nombre de choix

- Événement ordinaire : 2 choix le plus souvent.
- Événement important : 3 choix.
- Moment décisif, débat, crise ou choix de second tour : 4 ou 5 choix.
- Éviter les événements à 5 choix sans raison.

## 10.3 Tags visibles

Ne jamais afficher les probabilités exactes.

Afficher au maximum un petit qualificatif sur certains choix :

- PRUDENT
- RISQUÉ
- CLIVANT
- RASSEMBLEUR
- OFFENSIF
- LOYAL
- OPPORTUNISTE
- TECHNIQUE
- POPULAIRE
- PRÉSIDENTIEL
- TRANSPARENT
- SECRET

Le tag donne une intuition, jamais une garantie.

## 10.4 Résolution probabiliste

Utiliser un PRNG déterministe basé sur la graine de partie.

Pour chaque résultat d’un choix :

1. partir d’un poids de base ;
2. appliquer des modificateurs liés aux statistiques, traits, phase, parti, adversaire, événements passés et monde ;
3. convertir les scores en probabilités normalisées via softmax ;
4. tirer le résultat avec le PRNG ;
5. appliquer les effets immédiatement ;
6. planifier les effets retardés ;
7. journaliser le tirage interne sans afficher les probabilités au joueur.

Exemple de logique :

```ts
adjustedLogit =
  Math.log(baseWeight) +
  sum(statCoefficient * normalizedStat) +
  sum(contextModifier) +
  sum(historyModifier);
```

Puis softmax sur tous les résultats possibles.

## 10.5 Propriétés indispensables

- Même graine + mêmes décisions = mêmes résultats.
- Une autre graine peut produire une histoire différente.
- Les résultats identiques peuvent être accessibles depuis plusieurs choix avec des probabilités différentes.
- Les stats du joueur influencent réellement les probabilités.
- Les conséquences peuvent être immédiates, différées, cachées ou déclencher une chaîne.
- Chaque événement doit expliquer le résultat par une narration courte.
- L’écran de conséquence ne montre que les effets observables.

## 10.6 Sélection d’événement

Le sélecteur doit tenir compte de :

- phase ;
- date ;
- événements déjà vus ;
- cooldown ;
- parti ;
- position idéologique ;
- candidat encore en course ;
- équilibre entre catégories ;
- événements chaînés prioritaires ;
- événements nécessaires au rythme narratif ;
- événements rares ;
- état des adversaires ;
- temps restant avant l’élection.

Éviter :

- deux scandales majeurs consécutifs ;
- trois événements médiatiques similaires de suite ;
- une partie sans aucun débat ;
- une campagne sans au moins un événement programmatique ;
- une partie où aucun adversaire n’évolue.

Créer un système de « quotas souples » par catégorie, sans rendre les parties identiques.

---

# 11. Calendrier de campagne

Ne pas figer une date réelle de 2027 dans la logique centrale.

Utiliser :

- une date d’élection configurable ;
- un départ à `T - 365 jours` ;
- une progression événementielle ;
- une distribution semi-aléatoire des jours écoulés ;
- un système de phases.

## Phases

1. `pre_campaign` : T-365 à T-240
2. `campaign` : T-240 à T-120
3. `official_campaign` : T-120 à T-1
4. `first_round`
5. `between_rounds`
6. `second_round`
7. `government_epilogue`

## Répartition indicative

- 22 à 25 décisions avant le premier tour ;
- résultat du premier tour ;
- si éliminé : 1 à 2 décisions de fin de campagne ;
- si qualifié : 4 à 6 décisions entre les deux tours ;
- second tour ;
- si élu : 1 à 3 choix d’épilogue ;
- total visé : 27 à 33 décisions.

Le moteur doit accélérer le temps sans que la somme des intervalles dépasse l’élection.

---

# 12. Bibliothèque d’événements à produire

Créer **au minimum 110 événements** de bonne qualité dans la V1, validés par Zod.

Répartition minimale :

- 25 événements généraux de campagne ;
- 15 événements médias/interviews ;
- 12 événements débats et programme ;
- 15 événements internes aux partis ;
- 10 événements alliances/ralliements/retraits ;
- 12 événements de contexte national ou international ;
- 10 événements de scandales concernant uniquement des personnages fictifs ;
- 10 événements spécifiques à des partis ou familles politiques ;
- 8 événements très rares ou secrets ;
- 8 événements de fin de campagne/entre-deux-tours.

Un même événement peut appartenir à plusieurs catégories, mais il faut une vraie diversité.

## Thèmes attendus

- déclaration polémique ;
- interview matinale ;
- débat télévisé ;
- meeting ;
- manifestation ;
- grève ;
- crise économique ;
- crise sécuritaire ou attentat traité sobrement ;
- catastrophe naturelle ;
- crise internationale ;
- révélation journalistique ;
- affaire judiciaire fictive ;
- défection d’un cadre fictif ;
- ralliement inattendu ;
- primaire ;
- congrès ;
- fuite du programme ;
- erreur de communication ;
- vidéo virale ;
- soutien d’une célébrité fictive ;
- conflit avec un syndicat ;
- financement controversé fictif ;
- sondage catastrophique ;
- dynamique soudaine ;
- candidat adverse empêché ;
- retrait ;
- fusion ;
- scission ;
- parrainages manquants pour un petit parti ;
- lancement officiel ;
- publication du programme ;
- vote utile ;
- consigne de second tour ;
- contestation exceptionnelle du résultat.

## Traitement des événements graves

- Ton réaliste et sobre.
- Aucun détail graphique.
- Une conséquence claire et courte.
- Ne pas transformer la souffrance en mini-jeu humoristique.
- Ne pas rester bloqué sur le même événement pendant plusieurs tours, sauf chaîne institutionnelle indispensable.

## Événements absurdes rares

Ajouter quelques événements satiriques très rares, cohérents avec le monde politique, par exemple :

- slogan produit par une imprimante défaillante qui devient viral ;
- hologramme de meeting qui prend une autonomie médiatique inattendue ;
- perroquet d’un militant répétant une phrase de campagne au mauvais moment ;
- panne générale pendant un débat qui favorise le candidat ayant continué sans prompteur.

Ils doivent représenter moins de 3 % de la bibliothèque et rester compatibles avec le ton général.

---

# 13. Débats et construction du programme

Le programme n’est pas un long éditeur de mesures.

## Programme initial

Chaque parti existant possède trois à cinq orientations principales simplifiées dans ses données.

Le parti créé choisit trois mesures phares maximum.

## Programme émergent

Au cours de la campagne, des événements demandent au joueur de prendre position sur :

- retraites ;
- fiscalité ;
- salaires ;
- énergie ;
- immigration ;
- sécurité ;
- Europe ;
- santé ;
- école ;
- institutions.

Chaque réponse :

- ajoute une entrée au `statementLedger` ;
- modifie les axes idéologiques ;
- influence les blocs électoraux ;
- peut créer une contradiction ultérieure ;
- peut être citée dans un débat ou une polémique.

## Débat télévisé

Créer un composant de débat en 3 manches rapides :

1. économie/social ;
2. sécurité/institutions ;
3. conclusion libre.

Chaque manche propose 2 à 4 réponses. Le résultat dépend de :

- maîtrise médiatique ;
- compétence liée au thème ;
- cohérence avec les déclarations ;
- fatigue ;
- agressivité de l’adversaire ;
- stratégie choisie ;
- hasard.

Le joueur voit un bilan court à la fin, pas une matrice de calcul.

---

# 14. Simulation des adversaires

Chaque parti non joué doit avoir un candidat fictif et plusieurs cadres fictifs, ainsi que quelques personnalités réelles de contexte uniquement si les données sont sûres.

## Candidat adverse

```ts
interface ActorState {
  id: string;
  identityKind: ActorIdentityKind;
  displayName: string;
  partyId: string;
  role: ActorRole;
  ideology: IdeologyVector;
  traits: ActorTraits;
  legitimacy: number;
  ambition: number;
  loyalty: number;
  mediaSkill: number;
  governingCredibility: number;
  scandalRisk: number;
  active: boolean;
  candidateStatus:
    | "none"
    | "potential"
    | "declared"
    | "official"
    | "withdrawn"
    | "disqualified"
    | "eliminated";
  strategy: OpponentStrategy;
  memory: ActorMemory;
}
```

## Tour autonome

Après chaque décision du joueur :

1. chaque adversaire actif choisit une action abstraite selon sa stratégie ;
2. le monde applique certains chocs ;
3. les soutiens sont recalculés ;
4. une ou deux nouvelles importantes peuvent être publiées ;
5. les effets différés sont exécutés.

Les actions adverses ne doivent pas toutes devenir des écrans. La majorité est simulée hors champ.

## Stratégies possibles

- consolider le socle ;
- se présidentialiser ;
- attaquer le favori ;
- chasser sur les terres d’un voisin idéologique ;
- provoquer une dynamique médiatique ;
- préparer une alliance ;
- limiter les risques ;
- jouer le vote utile ;
- préparer le second tour.

## Évolution et remplacement

Un candidat peut :

- perdre sa légitimité ;
- être remplacé ;
- se retirer ;
- être déclaré inéligible dans un événement fictif ou dans un contexte juridiquement vérifié ;
- créer une dissidence ;
- perdre le soutien du parti ;
- être battu lors d’une primaire ;
- provoquer une scission.

En cas de vacance, calculer les prétendants à partir de :

- légitimité ;
- ambition ;
- loyauté ;
- compatibilité idéologique ;
- popularité ;
- temps restant ;
- chances estimées d’atteindre le second tour ;
- taille de l’électorat ;
- état financier du parti.

Le parti peut aussi se retirer ou soutenir un allié.

## Informations visibles

Le joueur ne voit pas les statistiques internes des adversaires.

Tous les 4 à 6 événements, afficher un bulletin « État de la course » :

- classement de sondage ;
- tendances ;
- deux ou trois nouvelles ;
- dynamiques qualitatives ;
- éventuelles alliances ou crises.

---

# 15. Électorat et sondages

## 15.1 Blocs électoraux simplifiés

Ne pas créer une gigantesque base démographique croisée.

Créer 12 blocs synthétiques, par exemple :

1. jeunes urbains diplômés ;
2. jeunes précaires/périurbains ;
3. classes populaires rurales ;
4. classes populaires urbaines ;
5. actifs des classes moyennes ;
6. cadres et professions supérieures ;
7. indépendants et entrepreneurs ;
8. fonction publique et services publics ;
9. retraités modérés ;
10. retraités conservateurs ;
11. électeurs écologistes/progressistes ;
12. abstentionnistes mobilisables.

Chaque bloc possède :

- poids électoral ;
- axes idéologiques ;
- priorités thématiques ;
- volatilité ;
- propension à voter ;
- rejet de certains profils ;
- sensibilité au vote utile ;
- affinité régionale.

Les intitulés sont internes ; l’interface peut les regrouper en catégories plus simples.

## 15.2 Véritable soutien latent

Le moteur conserve un soutien latent par bloc et par parti.

Le soutien dépend de :

- distance idéologique ;
- crédibilité ;
- popularité ;
- rejet ;
- thème dominant du moment ;
- cohérence ;
- implantation ;
- mobilisation ;
- fatigue ;
- événements récents ;
- stratégie de vote utile.

## 15.3 Sondages

Les sondages affichés ne sont pas la vérité interne.

Ils intègrent :

- erreur d’échantillonnage ;
- indécis ;
- biais aléatoire de maison sans utiliser de vrais noms d’instituts ;
- volatilité ;
- retard sur certains événements ;
- arrondi ;
- marge d’incertitude non affichée en permanence.

Le bruit doit rester crédible : généralement faible, parfois trompeur, jamais totalement arbitraire.

## 15.4 Carte régionale

Le résultat officiel est calculé nationalement.

Afficher une carte simplifiée des grandes régions françaises dans :

- les bulletins de campagne ;
- le premier tour ;
- le second tour ;
- le résumé final.

La carte illustre des forces relatives régionales, sans simulation commune par commune.

---

# 16. Calcul électoral

## Premier tour

1. Calculer le soutien latent final par parti.
2. Appliquer mobilisation et participation par bloc.
3. Appliquer le vote utile en fin de campagne.
4. Appliquer un bruit électoral plus faible que le bruit de sondage.
5. Normaliser à 100 % des suffrages exprimés.
6. Qualifier les deux premiers, sauf événement institutionnel secret explicitement permis.
7. Enregistrer résultats nationaux et régionaux simplifiés.

## Entre-deux-tours

Pour chaque parti éliminé, calculer :

- proximité idéologique ;
- rejet des finalistes ;
- consigne de vote ;
- crédibilité ;
- alliances ;
- mobilisation ;
- abstention ;
- historique d’attaques ou de ralliements.

Les consignes de vote ne doivent pas être appliquées mécaniquement à 100 %.

## Second tour

Calculer les reports par blocs électoraux, l’abstention et les dynamiques finales.

Prévoir des résultats serrés, mais limiter les égalités exactes. Une égalité, un recomptage ou une contestation doit être un événement extrêmement rare avec une chaîne spécifique.

## Règles d’intégrité

- Les scores doivent toujours être finis et bornés.
- La somme des résultats doit être égale à 100 après arrondi corrigé.
- Deux finalistes distincts.
- Aucun candidat retiré ou inéligible ne peut recevoir de voix.
- Une partie doit toujours pouvoir atteindre un état final valide.

---

# 17. Alliances et changements de camp

Le joueur ne dispose pas d’un menu libre permanent pour changer de camp.

Ces possibilités apparaissent uniquement dans des événements conditionnels :

- rejoindre un autre parti ;
- fusionner ;
- former une coalition ;
- se présenter en dissident ;
- soutenir un autre candidat ;
- négocier un poste ;
- abandonner la présidentielle ;
- préparer l’élection suivante.

Les conséquences dépendent de :

- proximité idéologique ;
- cohérence avec les déclarations passées ;
- loyauté ;
- intérêt électoral ;
- ambition ;
- opinion des militants ;
- réaction des électeurs ;
- crédibilité du partenaire.

Le `statementLedger` doit permettre à un adversaire ou à la presse de ressortir une ancienne phrase après un revirement.

---

# 18. Fins de partie

## Fins principales

- élu président ;
- battu au second tour ;
- éliminé de peu ;
- campagne honorable ;
- effondrement ;
- faiseur de roi ;
- parti renforcé ;
- parti divisé ;
- candidature retirée ;
- dissidence victorieuse ou désastreuse ;
- carrière relancée ;
- retraite politique.

## Fins secrètes très rares

Inclure quelques chaînes d’uchronie politique, avec préconditions fortes et probabilité globale extrêmement faible :

- crise institutionnelle majeure ;
- dérive autoritaire ;
- restauration monarchique satirique ;
- fragmentation extrême du système partisan ;
- troubles civils conduisant à une fin anticipée ;
- gouvernement d’union nationale exceptionnel.

Ces fins doivent :

- rester narratives ;
- ne pas fournir d’instructions opérationnelles de violence ;
- ne pas glorifier la violence politique ;
- exiger plusieurs décisions et états concordants ;
- être clairement présentées comme uchroniques et fictives.

---

# 19. Score final sur 100

Le score ne doit pas dépendre uniquement de la victoire.

Proposition de pondération :

- performance électorale : 30 points ;
- progression par rapport au niveau initial : 20 points ;
- victoire/qualification : 15 points ;
- croissance du parti et mobilisation : 10 points ;
- cohérence stratégique et programmatique : 10 points ;
- crédibilité et héritage politique : 10 points ;
- succès spéciaux : 5 points.

Ajuster pour éviter qu’un petit parti ne soit condamné à un mauvais score malgré une campagne historique.

Le score final doit être expliqué par 4 à 6 lignes simples, sans révéler toutes les formules internes.

---

# 20. Résumé final

Créer un écran riche mais lisible avec :

- résultat de l’élection ;
- rang au premier tour ;
- score au second tour si applicable ;
- score global sur 100 ;
- évolution des intentions de vote ;
- popularité initiale/finale ;
- adhérents gagnés/perdus ;
- trésorerie finale ;
- cohésion finale ;
- position idéologique finale ;
- régions fortes ;
- trois à cinq événements marquants ;
- principal rival ;
- meilleur choix ;
- décision la plus coûteuse ;
- titre de carrière ;
- fin narrative ;
- badges débloqués ;
- graine de partie ;
- bouton partager ;
- bouton rejouer ;
- bouton ajouter au panthéon.

Créer des titres comme :

- « Président de la République » ;
- « Faiseur de roi » ;
- « Révélation de la campagne » ;
- « Stratège sans couronne » ;
- « Candidat du système » ;
- « Tribune des foules » ;
- « Parti ressuscité » ;
- « Campagne naufragée » ;
- « Dissident historique ».

---

# 21. Historique, badges et panthéon

## Historique local

Conserver sur l’appareil :

- les parties terminées ;
- une partie active ;
- les statistiques globales ;
- les badges ;
- les meilleurs scores ;
- les partis joués ;
- les fins découvertes ;
- les graines.

Permettre :

- reprise automatique ;
- suppression d’une partie ;
- suppression de toutes les données ;
- export/import JSON local ;
- affichage de la version du schéma ;
- migration de sauvegarde entre versions.

## Badges

Créer au moins **40 badges** en V1, répartis en catégories :

1. Premières campagnes
2. Victoires et qualifications
3. Parti et fidélité
4. Communication et débats
5. Idéologie et programme
6. Alliances et rivalités
7. Records de campagne
8. Fins secrètes

Exemples :

- Premier bulletin
- Au second tour
- Locataire de l’Élysée
- Remontada
- Sans compromis
- Caméléon politique
- Union sacrée
- Briseur de coalition
- Roi du débat
- Viral malgré lui
- Campagne parfaite
- Faiseur de roi
- Parti neuf, rêve ancien
- Tout aléatoire
- Victoire sous 1 % d’écart
- Qualification depuis moins de 8 % au départ
- Aucun scandale
- Trois scandales surmontés
- Tous les grands thèmes tranchés
- Fin secrète découverte

## Panthéon

Créer une page « Archives des campagnes » avec cartes de carrière :

- nom du candidat ;
- parti ;
- symbole ;
- score ;
- résultat ;
- date ;
- nombre de badges ;
- meilleur fait d’armes ;
- bouton ouvrir le détail ;
- bouton partager.

---

# 22. Carte de partage

Générer côté client une image partageable sans backend.

Formats :

- portrait social `1080 × 1350` ;
- option paysage `1200 × 630`.

Contenu :

- nom du jeu ;
- candidat ;
- parti ;
- symbole ;
- résultat ;
- score sur 100 ;
- progression ;
- événement marquant ;
- trois statistiques ;
- graine ou code court ;
- mention « simulation fictive ».

Utiliser Web Share API quand disponible et proposer sinon un téléchargement PNG.

Ne jamais intégrer automatiquement de photo ou logo officiel.

---

# 23. Direction artistique et UX

## Identité

Créer une esthétique originale mélangeant :

- institution française contemporaine ;
- soirée électorale ;
- interface de campagne moderne ;
- sobriété éditoriale ;
- petites touches premium.

## Palette

Ne pas reprendre le vert des références.

Proposition :

- bleu nuit profond ;
- bleu républicain ;
- blanc cassé ;
- rouge sourd pour les alertes ;
- doré discret pour succès et moments historiques ;
- gris ardoise pour le texte secondaire.

Toutes les couleurs doivent être des tokens CSS.

## Typographie

- titre condensé et fort ;
- texte très lisible ;
- polices chargées de façon optimisée ;
- aucun corps illisible sur mobile.

## Organisation mobile

Largeur de référence : 360 à 430 px.

Sur desktop :

- contenu centré ;
- largeur maximale confortable ;
- tableau de bord latéral possible sans casser la simplicité ;
- pas de simple émulation de téléphone vide au milieu de l’écran.

## Écran événement

Structure :

1. catégorie et date ;
2. titre ;
3. texte de 2 à 5 lignes ;
4. 2 à 5 boutons de choix ;
5. barre de progression discrète ;
6. accès au tableau de bord ;
7. bouton quitter/sauvegarder.

## Écran résultat

- rappel compact de l’événement et du choix ;
- grand titre du résultat ;
- texte narratif ;
- puces d’effets visibles ;
- bouton continuer ;
- animation légère.

## Animations

Utiliser des transitions courtes :

- changement de carte ;
- variation de statistique ;
- révélation d’un sondage ;
- soirée électorale ;
- déblocage de badge.

Respecter `prefers-reduced-motion`.

Aucune explosion visuelle excessive.

## Accessibilité

- navigation clavier complète ;
- focus visible ;
- contrastes AA ;
- labels accessibles ;
- boutons de taille tactile ;
- annonces ARIA pour conséquences ;
- ne pas dépendre uniquement de la couleur ;
- mode réduction des mouvements.

---

# 24. Écrans à réaliser

1. Accueil
2. Nouvelle partie / reprendre
3. Avertissement fiction et méthodologie
4. Choix du mode
5. Choix du parti
6. Détail d’un parti
7. Création du parti
8. Choix de la méthode de campagne
9. Introduction de campagne
10. Événement
11. Résultat d’événement
12. Tableau de bord simplifié
13. État de la course
14. Débat
15. Soirée du premier tour
16. Entre-deux-tours
17. Soirée du second tour
18. Épilogue gouvernemental
19. Résumé final
20. Carte partageable
21. Archives des campagnes
22. Détail d’une ancienne campagne
23. Badges
24. Méthodologie
25. Confidentialité
26. À propos
27. Paramètres
28. Page hors connexion
29. Page 404 cohérente

---

# 25. Données réelles et mise à jour

Créer un dossier de snapshot versionné.

```ts
interface RealWorldSnapshot {
  snapshotDate: string;
  electionDateStatus: "configured" | "official" | "unknown";
  parties: RealPartySnapshot[];
  publicFigures: RealPublicFigureSnapshot[];
  sourceMetadata: SourceMetadata[];
  editorialNotes: string[];
}
```

## Règles

- Toute donnée factuelle réelle doit avoir une date et une source.
- Ne pas inventer une donnée manquante.
- Si la navigation web n’est pas possible, utiliser des placeholders neutres marqués `NEEDS_EDITORIAL_REVIEW` plutôt que de présenter une supposition comme un fait.
- Les sondages et chances de victoire internes du jeu ne doivent pas être présentés comme des données officielles.
- Créer `docs/REAL_WORLD_DATA.md` avec la procédure de mise à jour.
- Créer un script `npm run data:validate`.
- Ajouter un champ `lastEditorialReviewAt`.

## Sources à privilégier

- sites institutionnels français ;
- Conseil constitutionnel ;
- ministère de l’Intérieur ;
- Légifrance ;
- CNCCFP ;
- sites officiels des partis ;
- résultats électoraux officiels ;
- données publiques clairement licenciées.

Éviter de reproduire des contenus protégés ou des portraits sans licence.

---

# 26. Persistance et mode hors connexion

## Sauvegarde

- autosave après chaque choix ;
- reprise après fermeture ;
- une campagne active ;
- historique des campagnes terminées ;
- migrations versionnées ;
- mécanisme de récupération si une sauvegarde est corrompue.

## PWA

- installable ;
- manifest complet ;
- cache de l’application ;
- fonctionnement hors ligne après première visite ;
- aucun appel réseau requis pour jouer ;
- indicateur discret hors connexion ;
- mise à jour de version sans effacer les sauvegardes.

---

# 27. Qualité du contenu

Créer `docs/CONTENT_GUIDE.md` imposant :

- titre de 3 à 10 mots ;
- résumé de 25 à 80 mots ;
- choix de 4 à 100 caractères ;
- résultat de 20 à 90 mots ;
- ton français naturel ;
- pas de faute grossière ;
- pas de répétition systématique ;
- pas de formule générique du type « cela fait parler » sur chaque événement ;
- conséquences cohérentes avec le texte ;
- pas de caricature unilatérale d’un parti ;
- au moins deux issues plausibles pour les choix importants ;
- les statistiques ne doivent pas toujours évoluer dans le même sens ;
- chaque événement doit avoir une raison d’exister dans le gameplay.

Ajouter un validateur vérifiant :

- IDs uniques ;
- choix suffisants ;
- poids positifs ;
- résultats présents ;
- effets valides ;
- flags référencés ;
- événements chaînés existants ;
- restrictions relatives aux acteurs réels ;
- longueurs de texte ;
- absence de champs orphelins.

---

# 28. Tests obligatoires

## Tests unitaires du moteur

- PRNG déterministe ;
- mêmes décisions et même graine = même partie ;
- probabilités normalisées ;
- effets bornés ;
- effets différés exécutés au bon moment ;
- cooldowns ;
- conditions d’éligibilité ;
- chaînes d’événements ;
- retrait d’un candidat ;
- remplacement de candidat ;
- alliance ;
- scission ;
- sondage bruité mais cohérent ;
- somme des votes à 100 ;
- deux finalistes ;
- second tour valide ;
- score final borné de 0 à 100 ;
- badges ;
- fins secrètes ;
- migration de sauvegarde.

## Tests par propriétés

Utiliser une approche property-based si une librairie maintenue est disponible.

Sur au moins plusieurs centaines de simulations automatiques :

- aucune exception ;
- aucune valeur `NaN` ;
- aucun score hors limites ;
- aucune élection sans résultat ;
- aucune somme de voix incohérente ;
- aucune référence à un événement absent ;
- aucune boucle de chaîne infinie ;
- aucune partie bloquée ;
- une variété suffisante des gagnants ;
- les favoris gagnent plus souvent sans être invincibles ;
- les petits partis peuvent progresser fortement ;
- les choix influencent significativement les distributions.

## Tests composants

- sélection de parti ;
- création de parti ;
- événement ;
- résultat ;
- dashboard ;
- sondage ;
- badges ;
- historique ;
- partage ;
- réinitialisation des données.

## Tests E2E Playwright

Créer au minimum :

1. partie complète avec parti existant ;
2. partie complète avec parti personnalisé ;
3. mode tout aléatoire ;
4. sauvegarde/reprise ;
5. qualification au second tour via fixture contrôlée ;
6. élimination au premier tour ;
7. victoire ;
8. défaite au second tour ;
9. déblocage d’un badge ;
10. génération de carte de partage ;
11. fonctionnement mobile ;
12. fonctionnement hors connexion si testable.

## Budgets qualité

- zéro erreur TypeScript ;
- zéro erreur ESLint ;
- tests verts ;
- build production vert ;
- pas d’erreur console sur le parcours principal ;
- pas de dépendance critique connue ;
- performances mobiles raisonnables ;
- images optimisées ;
- bundle surveillé.

---

# 29. Scripts npm attendus

Créer au minimum :

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "start": "...",
    "lint": "...",
    "typecheck": "...",
    "test": "...",
    "test:watch": "...",
    "test:e2e": "...",
    "test:simulation": "...",
    "data:validate": "...",
    "format": "...",
    "format:check": "...",
    "check": "..."
  }
}
```

`npm run check` doit lancer au minimum format check, lint, typecheck, validation de données, tests unitaires et build.

---

# 30. Métriques d’équilibrage locales

Créer un script de simulation qui lance 1 000 à 10 000 campagnes sans interface et produit :

- taux de qualification par parti ;
- taux de victoire ;
- score moyen ;
- progression moyenne ;
- distribution des fins ;
- fréquence des événements rares ;
- événements jamais déclenchés ;
- choix dominants ;
- effets trop puissants ;
- taux de partie bloquée ;
- durée moyenne en décisions.

Sortie en console et fichier JSON ignoré par Git ou stocké dans `reports/` selon la pertinence.

Ajouter des seuils d’alerte, mais ne pas chercher une égalité artificielle parfaite entre partis.

---

# 31. Contenu initial minimum par parti

Pour chacun des neuf partis réels :

- une fiche de départ ;
- un candidat fictif principal ;
- deux à quatre cadres fictifs ;
- une méthode de désignation pondérée ;
- trois forces ;
- trois faiblesses ;
- trois orientations programmatiques ;
- quatre événements spécifiques minimum ;
- une chaîne de crise interne potentielle ;
- une possibilité d’alliance ou de rupture ;
- des affinités électorales ;
- des affinités régionales ;
- un titre de carrière spécifique ;
- au moins deux badges liés.

Ne pas transformer ces fiches en longs essais politiques. Elles doivent rester jouables et simples.

---

# 32. Exemples d’événements à implémenter

Ces exemples servent de modèle de qualité, sans devoir reprendre mot pour mot.

## Exemple 1 — Interview économique

**Titre :** La matinale qui peut tout changer  
**Contexte :** Une journaliste vous demande de chiffrer votre mesure phare. Le montant exact n’est pas dans vos notes et l’émission est en direct.

Choix :

- Donner un ordre de grandeur prudent
- **[TECHNIQUE]** Tenter le chiffrage détaillé
- **[OFFENSIF]** Attaquer le bilan du gouvernement

Résultats possibles :

- chiffrage convaincant ;
- approximation repérée ;
- séquence virale ;
- impression d’évitement ;
- polémique différée lorsqu’un ancien chiffre ressort.

## Exemple 2 — Cadre mis en cause

Uniquement avec un cadre fictif.

**Titre :** Une affaire éclate au siège  
**Contexte :** Un média publie une enquête mettant en cause un responsable fictif de votre mouvement. L’équipe vous demande une réaction immédiate.

Choix :

- Le suspendre immédiatement
- Attendre des éléments vérifiés
- **[LOYAL]** Le défendre publiquement
- **[TRANSPARENT]** Commander un audit indépendant

Conséquences :

- intégrité ;
- cohésion ;
- rejet ;
- confiance des militants ;
- possible confirmation ou infirmation différée ;
- départ du cadre ;
- accusation de lâchage ou de complaisance.

## Exemple 3 — Retraites

**Titre :** Votre ligne sur les retraites  
**Contexte :** À trois mois du scrutin, vos réponses sont jugées floues. Vous devez clarifier votre projet.

Choix possibles selon cohérence idéologique :

- conserver les règles actuelles ;
- abaisser l’âge légal ;
- relever progressivement l’âge ;
- développer fortement la capitalisation ;
- ouvrir une conférence sociale avant toute réforme.

Effets :

- position programmatique ;
- blocs électoraux ;
- crédibilité économique ;
- cohésion ;
- contradictions futures.

## Exemple 4 — Candidat adverse empêché

**Titre :** Le favori est hors course  
**Contexte :** Une décision judiciaire ou institutionnelle fictive empêche le candidat d’un parti adverse de poursuivre sa campagne. Le parti doit choisir en urgence.

Le moteur adverse décide entre :

- remplaçant légitime ;
- primaire éclair ;
- ralliement ;
- retrait ;
- dissidence.

Les probabilités dépendent de la légitimité, de l’ambition, de la loyauté, du temps restant et du potentiel électoral.

## Exemple 5 — Ancienne déclaration

**Titre :** Vos mots vous rattrapent  
**Contexte :** Une vidéo de début de campagne contredit votre nouvelle alliance.

Choix :

- assumer l’évolution ;
- nier la contradiction ;
- rompre l’alliance ;
- **[OPPORTUNISTE]** changer de sujet par une annonce forte.

Le texte exact doit venir du `statementLedger` de la partie.

---

# 33. Ordre de réalisation autonome

## Phase 1 — Audit et fondations

- inspecter le repo ;
- initialiser Next.js/TypeScript ;
- configurer qualité ;
- installer dépendances ;
- créer architecture ;
- écrire les docs de conception initiales ;
- commit.

## Phase 2 — Moteur pur

- types ;
- PRNG ;
- état ;
- effets ;
- événements ;
- sélecteur ;
- adversaires ;
- électorat ;
- sondages ;
- élections ;
- score ;
- badges ;
- tests unitaires ;
- commit.

## Phase 3 — Données et contenu

- partis ;
- candidats fictifs ;
- électorat ;
- méthodes de campagne ;
- 110+ événements ;
- badges ;
- fins ;
- validation ;
- simulations d’équilibrage ;
- commit.

## Phase 4 — Parcours principal

- accueil ;
- sélection ;
- création de parti ;
- campagne ;
- événements ;
- conséquences ;
- dashboard ;
- premier tour ;
- second tour ;
- résumé final ;
- commit.

## Phase 5 — Métajeu

- sauvegardes ;
- reprise ;
- archives ;
- badges ;
- panthéon ;
- partage ;
- import/export ;
- commit.

## Phase 6 — PWA, responsive et accessibilité

- offline ;
- manifest ;
- service worker ;
- mobile ;
- desktop ;
- reduced motion ;
- audit accessibilité ;
- commit.

## Phase 7 — QA finale

- Playwright ;
- simulations massives ;
- correction équilibrage ;
- audit dépendances ;
- build ;
- documentation ;
- captures d’écran locales si possible ;
- commit final.

---

# 34. Définition de terminé

Le projet n’est considéré terminé que si :

1. une nouvelle personne peut cloner le dépôt et lancer le jeu avec le README ;
2. le jeu fonctionne sans compte ;
3. une partie complète est jouable du choix du parti au bilan ;
4. le joueur peut créer son parti ;
5. le mode tout aléatoire fonctionne ;
6. une partie dure environ 10 à 15 minutes ;
7. le moteur propose environ 30 décisions ;
8. les choix ont des issues probabilistes influencées par les statistiques ;
9. les adversaires évoluent réellement ;
10. premier et second tours sont simulés ;
11. les sauvegardes locales survivent au rechargement ;
12. les badges et archives fonctionnent ;
13. la carte de partage est générée ;
14. l’application est responsive ;
15. l’application est jouable hors connexion après première visite ;
16. `npm run check` passe ;
17. les principaux tests E2E passent ;
18. aucune donnée réelle sensible n’est inventée sur une personne identifiable ;
19. aucun logo officiel n’est intégré sans licence ;
20. le disclaimer est visible ;
21. le code est documenté et maintenable ;
22. aucune fonction critique n’est laissée en TODO.

---

# 35. Rapport final attendu de Claude Code

À la fin de ton travail, fournis un compte rendu concis avec :

- architecture créée ;
- principales décisions techniques ;
- fonctionnalités terminées ;
- commandes pour lancer ;
- commandes de test ;
- résultats des tests ;
- emplacement des données de jeu ;
- procédure pour ajouter un événement ;
- procédure pour ajuster un parti ;
- procédure de déploiement ;
- limites restantes ;
- points nécessitant une validation éditoriale ou juridique avant publication publique.

Ne te contente pas de décrire ce qu’il faudrait faire : réalise-le dans le dépôt.
