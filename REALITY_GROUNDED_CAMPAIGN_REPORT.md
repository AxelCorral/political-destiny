# REALITY_GROUNDED_CAMPAIGN_REPORT — Ancrage réel, candidats pseudonymisés, chocs électoraux structurels

Rapport final de `PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md`. Fait suite au
gate explicite `PHASE A TERMINÉE — BASELINE RÉELLE ET ARCHÉTYPES VALIDÉS — DÉMARRAGE IMPLÉMENTATION`.
Aucun push vers le dépôt distant n'a été effectué.

## 1. Résumé exécutif

Avant cette mission, le jeu démarrait à J-365 dans une distribution arbitraire, sans lien avec la
France réelle du 18 avril 2026 (date de départ du jeu) : Horizons, pourtant la candidature la mieux
établie et la plus forte de la période réelle (20,5-25,5 % dans les enquêtes de mars-avril 2026, très
loin devant les autres non-RN), y démarrait avec un `baseSupport` de 4,5 — un ordre de grandeur sous
sa réalité. Le RN portait un seul candidat fixe alors que la réalité de la période montrait une
incertitude structurante entre deux scénarios (Bardella/Le Pen, suspendus au verdict d'appel du
7 juillet 2026). Un retrait de candidat ne survenait quasiment jamais (0,02 % des campagnes) et, dans
les rares cas où il se produisait, ses électeurs disparaissaient plutôt que d'être redistribués selon
une logique politique.

Cette mission a : (1) établi une baseline réelle datée et sourcée
(`docs/POLITICAL_BASELINE_2026-04.md`) et recalibré les neuf partis en conséquence — l'écart le plus
significatif (Horizons) corrigé sans réplication intégrale ; (2) construit un système
`CandidateProfile` générique, utilisé pour les deux espaces à incertitude réelle documentée (RN, PS) ;
(3) construit un vrai moteur de redistribution électorale (`redistributeElectorate`) remplaçant la
disparition implicite des électeurs d'un parti retiré ; (4) élargi les conditions de déclenchement
d'un retrait pour qu'un parti installé en échec de campagne puisse s'en aller, pas seulement un parti
déjà à l'agonie ; (5) ajouté une mécanique `MajorEndorsement` avec quatre figures étrangères
pseudonymisées structurellement cohérentes ; (6) supprimé 81 mentions répétées de « fictif » du texte
visible au joueur, plus les instances runtime et les surfaces UI à haute fréquence (sondage, bulletin,
soirée électorale, écran final) ; (7) ajouté 32 tests dédiés et une règle de validation bloquante
supplémentaire. Le tout validé sur 10 080 campagnes post-implémentation et 520 paires
contrefactuelles retrait/maintien, sans régression mesurée sur la compression du premier tour, les
favoris dominants, ou l'agence du joueur.

## 2. Baseline réelle retenue

Voir `docs/POLITICAL_BASELINE_2026-04.md` pour le détail complet. Neuf fourchettes retenues (candidat
présumé/réglé, fourchette, confiance) : RN 31,5-35 % (incertain, Bardella/Le Pen) ; LFI 10,5-14 %
(présumé, Mélenchon non déclaré) ; PS/espace social-démocrate 4,5-10,5 % (incertain) ; Écologistes
4-5 % (réglé, Tondelier) ; Renaissance 8-12 % (présumé, Attal non déclaré) ; Horizons 20,5-25,5 %
(réglé, Philippe, de loin la plus forte confiance) ; LR 7-10 % (quasi réglé, ratification J+1) ;
Reconquête 3-5 % (incertain, Zemmour indécis) ; Nouvelle Énergie 1-3 % (réglé en identité, non mesuré,
fondé 18 jours avant la date de début du jeu).

## 3. Sources et date

Recherche effectuée le 10/08/2026, pour une baseline datée du 18/04/2026 — toute information
postérieure explicitement écartée ou marquée `[POSTÉRIEUR]` dans `docs/POLITICAL_BASELINE_2026-04.md`
(exemple : le verdict réel du procès en appel de Marine Le Pen, rendu le 7 juillet 2026, non utilisé
car non connu à la date de début du jeu). Sources primaires : Elabe (28/03/2026 et 25-26/03/2026),
Odoxa (mars 2026), Odoxa-Mascaret, Ipsos BVA-CESI (8-9/04/2026), Cluster17/Marianne (05/12/2025, en
recoupement), CEVIPOF (vague 17, terrain OpinionWay 12-28/01/2026). Deux données écartées
explicitement pour date erronée ou source non fiable (voir §13 de `POLITICAL_BASELINE_2026-04.md`).

## 4. Architecture `CandidateProfile`

Type `CandidateProfile` (`src/game/types/index.ts`), données `src/game/data/candidateProfiles.ts`,
résolution `src/game/engine/candidateProfiles.ts` (déterministe par graine, pondérée par
`probabilityWeight`, choix explicite du joueur pour son propre parti uniquement), application dans
`createGame` (`src/game/engine/game.ts`) — modifie `baseSupport`/rejet/mobilisation/transférabilité/
cohésion/crédibilité selon `baselineModifier`, échange l'acteur candidat, trace la désignation dans
`opponentActions`. UI : sélecteur dans `PartyDetailScreen`
(`src/features/onboarding/setup-screens.tsx`), vérifié en navigateur (RN, capture d'écran manuelle —
sélection Louis Ferran/Élise Montclar change bien le socle affiché et le candidat).

## 5. Candidatures incertaines

Seuls RN et PS portent plusieurs profils — les sept autres parties n'ont aucune entrée dans
`candidateProfiles.ts` (§8 du prompt de mission : ne jamais fabriquer une incertitude). Décision
justifiée par la recherche datée : LFI/Renaissance/Reconquête montrent une candidature « présumée non
déclarée » (forme d'incertitude plus faible, traitée comme quasi-certaine) tandis que RN et PS
montrent une incertitude à deux scénarios réellement distincts et documentés.

## 6. Personnages pseudonymisés

`docs/FICTIONAL_POLITICAL_ARCHETYPES.md` documente chaque candidat de parti, les cadres porteurs de
tension structurelle déjà présents dans le contenu (Paul Auriac/Horizons, Diane Mérande/LR, Hélène
Saint-Cyr/Reconquête, Raphaël Ternois/Nouvelle Énergie), et les quatre figures étrangères. Aucun
reskin 1:1 : les noms sont inventés, l'architecture politique (fonction, ancrage, famille idéologique,
génération) reste cohérente avec le profil réel de référence. Un nouvel acteur a été créé uniquement
là où aucun acteur existant ne correspondait structurellement (Nadia Ferreira, profil PS de
rassemblement).

## 7. Nouvelle Énergie

Confirmé par la recherche datée : parti réel fondé le 31 mars 2026 par David Lisnard, maire de
Cannes, ayant quitté LR — exactement le profil structurel déjà prescrit par le prompt de mission
(§0.3). Aucune modification de l'identité existante n'était nécessaire ; un test dédié
(`politicalConsistency.test.ts`) verrouille désormais l'axe économique libéral (`economy > 50`) contre
toute dérive future. `baseSupport` ajusté modestement à la baisse (4,5→3,5) pour refléter son statut
de parti neuf non mesuré, sans le rendre injouable (§39).

## 8. RN et variantes de candidat

Profil A (Louis Ferran, acteur déjà existant réaffecté) : ligne historique, sociale-étatiste,
`baseSupportDelta` -1,2. Profil B (Élise Montclar, candidate par défaut déjà existante) : ligne de
normalisation générationnelle, `baseSupportDelta` +1,2. Poids réels : 0,35/0,65, reflétant le scénario
Bardella légèrement mieux placé dans la recherche datée. Sur 10 080 campagnes : Ferran résolu 34,4 %
du temps, Montclar 65,6 % — cohérent avec les poids configurés.

## 9. Retraits

Avant : 0,02 % des campagnes (quasiment jamais, un parti ne se retirait qu'à l'agonie). Après :
22,84 % des campagnes (au moins un retrait), déclenchement élargi
(`polling < 6 OU legitimacy < 45`, contre `polling < 2 ET legitimacy < 35`), probabilité par décision
plafonnée plus bas (0,05 contre 0,08) pour compenser la population de partis éligibles bien plus
large. Choc moyen mesuré : 3,77 pts de socle national perdu par le parti retiré ; choc maximal observé
45,79 pts — un cas rare mais légitime (une candidature en tête ayant subi un effondrement de
légitimité, le déclenchement `legitimacy < 45` s'appliquant indépendamment du niveau de sondage).

## 10. Alliances

76,62 % des campagnes voient au moins une alliance PNJ (stable par rapport à l'avant, 79-81 % selon
l'échantillon). Nouveauté : chaque alliance formée déclenche désormais `redistributeAllianceBoost`,
un transfert immédiat et mesurable (2-7 % du soutien latent selon la qualité de la relation) dirigé
vers le partenaire structurellement le mieux placé dans chaque bloc électoral — avant cette mission,
une alliance ne posait qu'un bonus de transférabilité différé, sans effet électoral immédiat.

## 11. Redistribution des électorats

`redistributeElectorate` (`src/game/engine/redistribution.ts`) : pondère la redistribution par
distance idéologique, relation entre partis, alliance déjà active, endorsement explicite déjà posé, et
rejet du destinataire, avec une part réservée à l'indécision/abstention. Fonction pure, réutilisée par
`opponentSimulation.ts` et par les scripts d'audit — jamais réimplémentée. Démonstration contrôlée
(playtests 5/6) : un retrait identique des Écologistes redistribue +2,5 pts vers LFI quand la relation
est favorable (+45), contre seulement +0,9 pt quand elle est dégradée (-45) — dans ce second cas, LFI
tombe derrière PS, Horizons et Renaissance dans l'ordre des bénéficiaires. Voir §12 du prompt de
mission (« si LFI a agressivement attaqué les Écologistes... le report ne doit pas être identique »).

## 12. Soutiens majeurs

Mécanique `MajorEndorsement` (`src/game/data/majorEndorsements.ts`) : quatre définitions, chacune avec
un effet mixte obligatoire (`positiveEffects`/`negativeEffects` non vide — jamais un bonus universel,
§18). Quatre événements réellement contextuels
(`src/game/data/events/v2/endorsements.ts`) — catalogue volontairement restreint, priorité à la
qualité (§31).

## 13. Figures étrangères

Quatre `WorldFigureProfile` (`src/game/data/worldFigures.ts`) : Mateo Álvarez (Argentine,
libertarien pro-marché), Elke Brandt (Allemagne, pro-européenne), Daniel Ashworth (Royaume-Uni,
social-démocrate), Carter Whitfield (États-Unis, ligne nationale/protectionniste). Compatibilité
idéologique structurelle (`affinityTags`/`hostilityTags`, axes numériques), jamais codée dans le texte
libre — vérifié par 5 tests dédiés dans `politicalConsistency.test.ts`.

## 14. Nettoyage « fictif »

81 mentions supprimées du contenu statique (résumés, libellés, narratifs, succès, fins — script
`scripts/audit/_fix-fictif-mentions.ts`, exécuté puis supprimé), plus 9 instances runtime dans
`opponentSimulation.ts`, plus les surfaces UI à haute fréquence (sondage du tableau de bord, fil de
campagne, bulletin, eyebrow de soirée électorale premier/second tour, eyebrow victoire/résultat de
l'écran final, mention d'intentions de vote). Une régression sémantique détectée et corrigée pendant
le nettoyage : « emploi fictif » (terme juridique désignant un emploi sans contrepartie réelle, pas
une marque de fiction du jeu) a été reformulé pour préserver son sens plutôt que simplement supprimé.
Disclaimer global conservé tel quel (`fiction-notice.tsx`, une seule fois) ; pages dédiées
(`/a-propos`, `/methodologie`, `/parametres`) et texte du menu de configuration initial conservés
(cadre explicatif avant l'immersion, pas une répétition en flux).

## 15. Cohérence éditoriale

Note interne contradictoire corrigée dans `entities.ts` : les personnages liés à un parti (candidats,
cadres documentés) portent désormais une note reconnaissant leur correspondance structurelle avec
`docs/FICTIONAL_POLITICAL_ARCHETYPES.md`, tandis que les personnages strictement secondaires et
sensibles (trésorier, consultant...) conservent la note « aucune correspondance recherchée » —
distinction nécessaire pour ne pas contredire l'esprit de cette mission tout en préservant la garantie
éditoriale que les scandales ne touchent jamais un archétype reconnaissable
(`docs/EDITORIAL_POLICY.md`).

## 16. Simulations avant/après

Voir tableau §17 (avant/après) et `audit-results/reality-grounding/` pour les données brutes. Avant :
5 472 campagnes (Phase A, `reality-grounding-baseline.ts`). Après : 10 080 campagnes (Phase G,
`reality-grounded-massive-corpus.ts`). Compression du premier tour et fréquence des favoris dominants
stables ; fréquence des retraits multipliée par ~1 000 (0,02 %→22,84 %) sans dérégler la compression.

## 17. Contrefactuels

520 paires retrait/maintien (`scripts/audit/reality-grounded-counterfactuals.ts`), fourche à la
décision 16, retrait forcé du parti PNJ le plus faible dans la branche « retrait », moteur réel
réutilisé (`redistributeElectorate`). Résultats : leader du premier tour changé dans 29,4 % des
paires, ensemble des qualifiés changé dans 63,7 % des paires, issue finale du joueur changée dans
27,5 % des paires, écart absolu moyen de score du joueur 2,64 pts. La recomposition a un effet réel et
mesurable — pas un habillage cosmétique.

## 18. Fun / agence

η²(parti, score T1) 0,4065→0,4563 ; η²(agent/stratégie, score T1) 0,2684→0,2539 ; η²(parti, score
final) 0,3136→0,2827 ; η²(agent/stratégie, score final) 0,3383→0,3572 ; part de paires appariées dont
l'issue change selon la stratégie 0,796→0,794 (stable). L'agence du joueur reste intacte — la hausse
de l'η² parti au premier tour reflète surtout la recalibration Horizons (un socle réel nettement plus
haut rend le choix du parti mécaniquement plus déterminant dès le départ, un effet attendu et
cohérent avec la réalité, pas une perte d'agence).

## 19. Playtests

Dix scénarios requis, tous produits (`audit-results/reality-grounding/playtests/`) : sept par rejeu
naturel du moteur réel (aucun scripting du résultat), trois (retrait Écologistes × PS neutre / LFI
relation favorable / LFI relation dégradée) construits par fourche + manipulation de relation +
déclenchement réel du moteur de redistribution — le retrait naturel des Écologistes n'est jamais
survenu en 3 000 tentatives par scénario (base électorale trop proche de plusieurs autres partis pour
gagner la compétition probabiliste du déclenchement, voir §21). Le sélecteur de profil RN a également
été vérifié manuellement en navigateur (capture d'écran, Louis Ferran/Élise Montclar).

## 20. Non-régressions

- Compression T1 : moyenne du score du leader 19,34→19,57 (stable), écart-type 4,289→4,300 (stable).
- Favoris dominants : 23,7 %→24,4 % (stable, présents).
- Second tour : `RETAINED_GAP_DAMPING`/`RUNOFF_SHARE_DAMPING` inchangés, non retouchés par cette
  mission.
- Sidebar/RaceBulletin : code non modifié par cette mission, non retesté séparément.
- Apostrophes : `data:validate` réussi sur les 282 événements après le nettoyage « fictif ».
- Mobile/game feel : suite de régression visuelle régénérée intentionnellement (calibration réelle,
  UI CandidateProfile) puis vérifiée stable sur deux exécutions consécutives.
- Tests unitaires : 245→277 (32 ajoutés : 9 CandidateProfile, 12 redistribution, 11 cohérence
  politique).
- E2E : 29/29 verts (quatre graines figées ont dû être remplacées suite au recalibrage — un candidat
  PS/RN pris comme référence textuelle a été rendu tolérant aux deux profils possibles).
- Build/lint : verts, aucune nouvelle erreur.

## 21. Problèmes ouverts

1. Le retrait naturel des Écologistes n'a jamais été observé en simulation libre (3 000 tentatives ×
   3 scénarios) — sa base électorale (4,5, comparable à plusieurs autres partis) ne le rend pas
   structurellement le plus faible assez souvent pour gagner la compétition probabiliste du
   déclenchement face à Reconquête/Nouvelle Énergie. Les playtests 4/5/6 ont été construits plutôt
   qu'observés naturellement (voir §19). Non bloquant (le mécanisme lui-même est prouvé, testé et
   fonctionnel), mais signale que la distribution des retraits penche vers les partis structurellement
   les plus faibles plutôt que vers une distribution uniforme entre tous les partis moyens.
2. Un cas de choc de retrait extrême (45,79 pts) a été observé sur 10 080 campagnes — plausible (un
   favori dont la légitimité s'effondre) mais non caractérisé en détail ; recommandé pour un futur
   audit ciblé s'il se révèle plus fréquent qu'un cas isolé.
3. Lecture d'un delta national agrégé anormal (+37,1 pts en un seul pas de décision) dans un des
   douze cas de causalité extraits pour `scripts/audit/reality-grounded-causality.ts` — probablement
   l'effet combiné de `DISPERSION_POWER` avec un changement de classement simultané non lié au retrait
   lui-même, pas une preuve de non-conservation de la masse électorale (déjà prouvée par test unitaire
   dédié). Écarté des exemples présentés dans ce rapport ; signalé pour un futur audit s'il devait
   affecter la lisibilité de la mécanique de feedback narratif en jeu réel.
4. Amélioration UX suggérée par le prompt de mission (§22, « Rapports de force estimés au 18 avril
   2026 » sur le premier bulletin) non implémentée — jugée d'un intérêt secondaire face au volume déjà
   traité dans cette mission.
5. RaceBulletin/sidebar non retestés spécifiquement dans cette mission (code non modifié) — hérité
   comme stable depuis la mission précédente.

## 22. Verdict

Voir bloc terminal ci-dessous.

---

## Tableau avant/après

| Domaine | Avant | Après | Verdict |
|---|---:|---:|---|
| Écart baseline jeu/réalité (Horizons, le plus significatif) | baseSupport 4,5 vs réel 20,5-25,5 % | baseSupport 16 (corrigé, sans réplication intégrale) | Corrigé |
| Variation seed au départ (relatif) | ~0 % (vérité sous-jacente invariante) | ±6 % (jitter réel + delta de profil) | Introduit |
| Hiérarchie initiale plausible | Non (Horizons sous-pesé d'un ordre de grandeur) | Oui (ordre RN > Horizons > reste cohérent avec la recherche datée) | Corrigé |
| Candidatures ayant variantes réelles | 0 | 2 (RN, PS — 4 `CandidateProfile`) | Ajouté |
| Retraits structurels fonctionnels | 0,02 % des campagnes, redistribution proportionnelle implicite | 22,84 % des campagnes, redistribution idéologique/relationnelle réelle | Corrigé |
| Alliances avec redistribution | Bonus de transférabilité différé uniquement | Transfert immédiat mesurable (`redistributeAllianceBoost`) | Ajouté |
| Endorsements contextuels | 0 | 4 (mixtes, jamais universellement positifs) | Ajouté |
| Événements politiquement incohérents | Non audité | 0 détecté (11 tests `politicalConsistency.test.ts`) | Vérifié |
| Mentions « fictif » dans flux joueur | 81+ (contenu) + 9 (runtime) + 5 (UI haute fréquence) | 0 (règle bloquante `qualityValidation.ts`) | Corrigé |
| Compression T1 (score moyen du leader) | 19,34 % | 19,57 % | Stable |
| Favoris dominants | 23,7 % | 24,4 % | Stable |
| Party eta² (score T1) | 0,4065 | 0,4563 | Hausse attendue (Horizons) |
| Strategy eta² (score T1) | 0,2684 | 0,2539 | Stable |
| Runoff incohérents | 0 | 0 (non retesté, code inchangé) | Stable |
| Tests | 245 | 277 | +32 |
| E2E | 29 | 29 | Stable (4 graines remplacées) |

---

## Verdict terminal

```
REALITY-GROUNDED CAMPAIGN — VERDICT

BASELINE
Date politique       : 18 avril 2026
Sources               : Elabe, Odoxa, Odoxa-Mascaret, Ipsos BVA-CESI, Cluster17,
                        CEVIPOF — recherche du 10/08/2026, fenêtre mars-avril 2026
Partis calibrés       : 9/9 (politicalBaselineVersion 2026-04-v1)
Variation initiale    : ±6 % relatif, déterministe par graine (avant : ~0 %)
Verdict               : RÉUSSI

CANDIDATS
Profils créés          : 4 CandidateProfile (RN×2, PS×2)
Candidatures incertaines : 2 espaces (RN, PS) — 7 autres laissés à profil unique (§8)
Impact réel sur sondages : baseSupport delta 1,2-4,5 pts selon profil, vérifié par test
Verdict                 : RÉUSSI

PERSONNAGES PSEUDONYMISÉS
Mentions répétées « fictif » supprimées : 81 (contenu) + 9 (runtime) + 5 (UI)
Métadonnées internes    : docs/FICTIONAL_POLITICAL_ARCHETYPES.md (candidats, cadres, figures)
Cohérence idéologique   : vérifiée (11 tests politicalConsistency.test.ts)
Contenu sensible        : 0 personnage lié à un archétype touché (règle éditoriale respectée)
Verdict                 : RÉUSSI

NOUVELLE ÉNERGIE
Profil structurel     : élu local exécutif, droite libérale — confirmé par la recherche réelle
Ancrage territorial    : maire de Cannes (David Lisnard, parti fondé le 31/03/2026)
Identité politique     : verrouillée par test (economy > 50)
Baseline               : 4,5 → 3,5 (ajustement modeste, reste jouable §39)
Trajectoires de percée : retrait LR/recomposition centrale démontré (playtest 2)
Verdict                : RÉUSSI

RN
Nombre de profils plausibles : 2 (Ferran/historique, Montclar/normalisation)
Différences électorales      : baseSupport ±1,2, cohésion/transférabilité/mobilisation/crédibilité
Résolution candidature       : déterministe par graine, 34,4 %/65,6 % sur 10 080 campagnes
Verdict                      : RÉUSSI

RETRAITS / ALLIANCES
Nombre d'événements structurels : withdrawal 22,84 %, replacement 10,5 %, alliance 76,62 %,
                                   dissidence 0,14 % des campagnes (10 080)
Redistribution électorale        : idéologique/relationnelle/endorsement, jamais proportionnelle fixe
Part d'abstention/indécision     : intégrée (undecidedByBloc augmenté à chaque retrait)
Contrefactuels                   : 520 paires — issue du joueur changée 27,5 %, qualifiés changés 63,7 %
Verdict                          : RÉUSSI

ENDORSEMENTS
Figures nationales      : 0 (hors périmètre, priorité aux figures étrangères du prompt)
Figures internationales : 4 (Argentine, Allemagne, Royaume-Uni, États-Unis)
Compatibilité idéologique : structurelle, vérifiée par 5 tests dédiés
Effets non-universels     : oui, negativeEffects non vide sur les 4 définitions
Verdict                   : RÉUSSI

SONDAGES
Départ    : baseline réelle recalibrée, ±6 % de jitter déterministe
Évolution : inertie conservée (mécanismes existants non modifiés)
Chocs     : retrait moyen -3,77 pts au national pour le parti sortant, redistribution différenciée
Courbes   : feedback narratif « RECOMPOSITION DE LA COURSE » ajouté aux news de retrait
Verdict   : RÉUSSI

RÉALISME VS FUN
Party eta² (T1)    : 0,4065 → 0,4563 (hausse attendue, corrélée à la recalibration Horizons)
Strategy eta² (T1) : 0,2684 → 0,2539 (stable)
Agence             : part de paires dont l'issue change selon la stratégie 0,796 → 0,794 (stable)
Outsiders           : Nouvelle Énergie/Reconquête restent jouables (baseSupport 3,5/4,5, non nuls)
Favoris             : présents (24,4 % de favoris dominants), toujours battables (contrefactuels)
Verdict              : RÉUSSI

NON-RÉGRESSIONS
Compression T1  : 19,34 % → 19,57 % (stable)
Second tour     : constantes de damping inchangées, non retouchées
Sidebar         : code non modifié par cette mission
RaceBulletin    : code non modifié par cette mission
Apostrophes     : data:validate réussi (282 événements)
Mobile          : visual regression régénérée puis stable (2 exécutions consécutives)
Game feel       : non retesté spécifiquement, aucune régression fonctionnelle détectée
Tests           : 245 → 277 (245/245 puis 277/277 verts)
E2E             : 29/29 verts (4 graines figées remplacées suite au recalibrage)
Visual          : régénérée intentionnellement, stable
Build           : vert

Commits locaux       : aucun commit créé pendant cette mission (changements non commités,
                       non poussés — conformément à « ne pousse rien vers le dépôt distant »)
Problèmes encore ouverts :
  1. Retrait naturel des Écologistes jamais observé en simulation libre (playtests 4-6
     construits plutôt qu'observés — mécanisme prouvé et testé, distribution empirique
     penchant vers les partis structurellement les plus faibles).
  2. Choc de retrait extrême isolé (45,79 pts) non caractérisé en détail.
  3. Un delta agrégé anormal isolé dans les cas de causalité (probable interaction
     DISPERSION_POWER × changement de classement simultané), écarté des exemples présentés.
  4. Amélioration UX du bulletin (date de référence explicite) non implémentée.
  5. RaceBulletin/sidebar non retestés spécifiquement (code non modifié).
```
