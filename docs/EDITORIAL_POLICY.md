# Politique éditoriale de la simulation

Dernière revue : 5 août 2026.

## Principe

Vers l’Élysée se déroule dans la France réelle, mais simule une campagne qui n’a pas eu lieu. Le jeu distingue trois couches :

1. les faits institutionnels et géographiques stables ;
2. les positions publiques sourcées et datées lorsqu’elles sont nécessaires ;
3. les péripéties de campagne, personnages secondaires, dialogues et résultats, qui sont fictifs.

Le produit est une œuvre de simulation et non une prédiction, un sondage, une information journalistique ou un conseil de vote.

## Éléments utilisables comme réels

Peuvent être nommés directement dans un contexte factuel :

- la France, l’Union européenne et les pays existants ;
- les régions, villes et territoires réels ;
- l’Assemblée nationale, le Sénat, le Conseil constitutionnel, le Conseil d’État, la Cour des comptes, l’Élysée, Matignon et les ministères existants ;
- les règles publiques de l’élection présidentielle ;
- les partis et organisations politiques par leur dénomination publique ;
- les médias et formats médiatiques réels, sans imiter leur identité visuelle ;
- les organisations publiques, syndicales, professionnelles ou associatives dans leur fonction connue ;
- une personnalité publique pour sa fonction, son parti ou une position publique vérifiée et sourcée.

Une entité contemporaine susceptible de changer porte une date de vérification et, lorsqu’elle détermine le contenu, une source primaire ou institutionnelle.

## Éléments qui restent fictifs

Restent fictifs ou non identifiants :

- le candidat incarné par le joueur ;
- les candidats adverses et cadres secondaires lorsque le scénario invente leurs actes ;
- les dialogues, citations et réactions individuelles ;
- les crises internes, fuites, négociations privées et conflits de personnes ;
- les résultats, sondages, probabilités, soutiens et reports de voix simulés ;
- toute personne impliquée dans une intrigue sensible.

Un personnage fictif peut compléter la France réelle ; il ne doit pas remplacer une institution, un territoire, un pays ou un format médiatique réel qui suffirait au contexte.

## Situations sensibles

Il est interdit d’inventer à propos d’une personne réelle :

- un crime, un délit ou une enquête judiciaire ;
- une accusation sexuelle, financière ou personnelle ;
- une fraude, une corruption, un conflit d’intérêts ou un enrichissement ;
- une maladie, une addiction, un secret familial ou une information privée ;
- une agression, une menace ou un acte violent ;
- une citation, un message privé, une confidence ou une rumeur ;
- un soutien, une rupture ou une candidature non vérifiés présentés comme des faits.

Les scénarios correspondants utilisent un trésorier, conseiller, cadre ou candidat fictif clairement secondaire. Le registre d’entités et le validateur bloquent l’association d’une personnalité réelle à un événement marqué `sensitive` ou `prohibited`.

## Citations et médias

Aucune citation inventée n’est attribuée à un journaliste, un média ou une personnalité réelle. Une interview peut être située sur France 2, France Inter ou un autre média réel, mais les questions sont présentées comme celles du format simulé, sans signature réelle. Les titres et habillages officiels ne sont pas reproduits.

## Rumeurs

Une rumeur fictive ne peut viser qu’une personne fictive ou non nommée. Le texte doit la présenter comme une information non établie et permettre au joueur de demander une vérification, de ne pas la relayer ou de corriger sa diffusion. Le résultat ne transforme jamais la rumeur en fait par simple narration.

## Sources et actualisation

- Les sources primaires sont privilégiées : Gouvernement, ministère de l’Intérieur, Conseil constitutionnel, institutions et sites officiels des organisations.
- La date électorale configurée est vérifiée dans `realWorldSnapshot`.
- Les données de soutien, traits, électorats et probabilités restent des paramètres de gameplay ; elles ne sont jamais présentées comme des mesures publiques.
- Toute donnée contemporaine non vérifiée est marquée `NEEDS_EDITORIAL_REVIEW` ou omise.
- Une revue éditoriale est obligatoire avant chaque publication publique et après tout changement notable du contexte politique.

## Contrôle avant publication

Pour chaque événement, vérifier :

1. que chaque entité citée existe dans le registre ;
2. que son statut réel ou fictif est correct ;
3. que le niveau de sensibilité correspond au récit ;
4. qu’aucune citation ou accusation réelle n’a été fabriquée ;
5. que la conséquence décrit une simulation et non un fait annoncé ;
6. que les sources datées sont encore valides ;
7. que la France réelle reste reconnaissable sans transformer le jeu en chronique d’actualité fragile.
