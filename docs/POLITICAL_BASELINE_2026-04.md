# Baseline politique réelle — 18 avril 2026

Document de calibration éditoriale pour « Vers l'Élysée ». Établit l'état du paysage politique
français **tel qu'il était compris au 18 avril 2026** (date de début de la campagne fictive), pour
que le point de départ du jeu ressemble à la réalité de cette date précise — pas à une prédiction, pas
à un instantané figé plus tard dans l'année. Toute information postérieure à ~avril 2026 est explicitement
écartée de la baseline elle-même ; quand elle est citée, elle est marquée **[POSTÉRIEUR]** et sert
uniquement à documenter une tendance, jamais un fait connu en avril 2026.

Recherche effectuée le 10/08/2026, via recherche web ciblée (dates de terrain vérifiées par source),
en complément d'une vérification indépendante croisée sur le point le plus significatif (Horizons).
Aucune donnée n'est tirée d'un agrégateur opaque, d'un tweet isolé ou de Wikipédia comme source
numérique principale — Wikipédia n'est citée ici que pour un fait daté et vérifiable (date de fondation
de Nouvelle Énergie), jamais pour un chiffre de sondage.

## 0. Cadrage temporel décisif : la situation Le Pen

Marine Le Pen a été condamnée en première instance le 31 mars 2025 (détournement de fonds
d'assistants parlementaires européens) à une inéligibilité de 5 ans **avec exécution provisoire** —
appliquée immédiatement malgré l'appel. Son procès en appel s'est tenu du 13 janvier au 12 février
2026. **Le verdict était fixé au 7 juillet 2026** — c'est-à-dire non rendu et non connu au 18 avril
2026. C'est la source structurelle de l'incertitude RN modélisée dans ce document : au 18 avril 2026,
l'état honnête est « procès terminé en février, verdict attendu avant l'été, issue réellement
inconnue ». [POSTÉRIEUR, non utilisé pour la baseline : le verdict du 7 juillet 2026 a finalement
réduit son inéligibilité à 45 mois, la rendant éligible en 2027 — information non disponible en avril
2026, donc absente de la calibration.]

## 1. Rassemblement national (RN)

**Candidature : incertaine, à deux scénarios réels.** Jordan Bardella est le nom le plus discuté par
défaut compte tenu du verdict en attente ; Marine Le Pen n'a jamais renoncé à se présenter et continue
d'être testée comme hypothèse alternative dans les sondages du premier trimestre 2026.

- [Elabe, publié le 28 mars 2026, scénario Bardella face à Retailleau/Zemmour/Philippe] : Bardella
  **35 %**.
- [Elabe, publié le 28 mars 2026, scénario Le Pen face à Retailleau/Zemmour/Philippe] : Le Pen
  **31,5 %**.
- [Cluster17/Marianne, publié le 5 décembre 2025, « potentiel de vote élevé ou certain » — hors
  fenêtre stricte mais donnée la plus proche disponible] : Bardella et Le Pen quasiment à égalité,
  **33 % chacun**.
- **Fourchette retenue pour la baseline : 31,5–35 %** (scénario Bardella légèrement supérieur au
  scénario Le Pen, écart faible et à l'intérieur de l'incertitude de sondage).
- Limite signalée : aucun sondage à date ferme identifié pour janvier-février 2026 opposant
  explicitement les deux scénarios côte à côte ; le 28 mars 2026 (Elabe) est la donnée la plus
  ancienne solidement datée trouvée.

## 2. La France insoumise (LFI)

**Candidature : présumée (Jean-Luc Mélenchon), non déclarée formellement au 18 avril 2026.** Sa
déclaration officielle n'intervient que le 3 mai 2026 [POSTÉRIEUR].

- [Elabe, publié le 28 mars 2026] : Mélenchon **10,5 %** (en baisse de 2 points vs octobre 2025).
- [Cluster17/Marianne, 5 décembre 2025] : Mélenchon **14 %** de potentiel de vote.
- **Fourchette retenue : 10,5–14 %.**

## 3. Parti socialiste / espace social-démocrate (PS)

**Candidature : réellement incertaine.** Le premier secrétaire Olivier Faure n'excluait pas de se
présenter mais restait politiquement affaibli ; le parti n'avait pas tranché entre une primaire large
(Écologistes, Debout !, L'Après, Génération·s, prévue à l'automne 2026) et une primaire fermée
socialiste. Ce choix n'est acté que par un vote interne en juillet 2026 [POSTÉRIEUR : primaire fermée
retenue à 55,5 %]. Raphaël Glucksmann (Place Publique, proche du PS sans en être membre) était
constamment la valeur la plus haute testée pour cet espace politique.

- [Elabe, publié le 28 mars 2026, hypothèses testées séparément] : Glucksmann **10,5 %** ; François
  Hollande **8,5 %** ; Olivier Faure **4,5 %**.
- **Fourchette retenue pour l'espace PS/social-démocrate : 4,5–10,5 %**, selon que le candidat final
  est une figure de continuité du parti (bas de fourchette) ou une figure d'ouverture/rassemblement
  (haut de fourchette) — incertitude directement modélisable par un `CandidateProfile` à deux profils.

## 4. Les Écologistes

**Candidature : réglée en interne.** Marine Tondelier désignée par les adhérents en décembre 2025
(61 % de soutien) comme candidate de repli si la primaire élargie de la gauche n'aboutit pas.

- [Elabe, publié le 28 mars 2026] : Tondelier **4–5 %**, décrit comme stable.
- **Fourchette retenue : 4–5 %.**

## 5. Renaissance

**Candidature : présumée (Gabriel Attal, secrétaire général), non déclarée au 18 avril 2026** (annonce
le 22 mai 2026 [POSTÉRIEUR]). Plusieurs analyses de la période le décrivent en concurrence de
légitimité avec Édouard Philippe pour incarner le « bloc central ».

- [Elabe, publié le 28 mars 2026, scénario sans Philippe] : Attal **11,5 %**.
- **Fourchette retenue : 8–12 %** (la borse basse reflète les scénarios où Philippe/Horizons
  capte l'essentiel de l'espace centriste — cf. section suivante).

## 6. Horizons

**Candidature : réglée, de longue date.** Édouard Philippe, maire du Havre, candidat déclaré depuis le
3 septembre 2024 — la situation la plus stable des neuf espaces étudiés. Réélu maire du Havre aux
municipales de mars 2026, ce qui aurait dynamisé sa position dans les enquêtes du printemps.

- [Elabe, publié le 25-26 mars 2026, La Tribune Dimanche] : Philippe **20,5–25,5 %** selon scénario
  (présence/absence du candidat RN, présence/absence d'Attal) — **de loin la personnalité la plus
  forte hors RN testée sur la période**, loin devant Retailleau (7-10 %) et Attal (11,5 %).
- [Odoxa, baromètre de mars 2026] : 36 % d'opinions favorables, bond de 8 points par rapport à
  février.
- [Ipsos BVA-CESI, La Tribune Dimanche, terrain 8-9 avril 2026] : 26 % des Français satisfaits à
  l'idée qu'il accède à l'Élysée (+6 points vs mars).
- Second tour hypothétique [Odoxa-Mascaret, mars 2026] : Philippe battrait Bardella 52 %-48 % ;
  [Elabe pour BFMTV/La Tribune Dimanche] : 51,5 %-48,5 %. Cité uniquement pour confirmer la cohérence
  d'ensemble de la position de Philippe — le second tour du jeu doit émerger du moteur, pas reproduire
  ce chiffre.
- Point de vigilance éditorial : une enquête préliminaire sur l'affaire dite de la « Cité numérique du
  Havre » existait publiquement depuis 2023-2024 (plainte de lanceur d'alerte, perquisitions), mais
  l'**instruction judiciaire formelle n'a été ouverte que le 19 mai 2026** [POSTÉRIEUR]. Au 18 avril
  2026, il s'agit d'une controverse publique latente, pas d'une affaire judiciaire active — traitement
  éditorial : contexte de fragilité en arrière-plan, jamais une « affaire » déjà engagée à la date de
  début du jeu.
- **Fourchette retenue : 20,5–25,5 %** — écart considérable avec le paramétrage actuel du jeu
  (`baseSupport` Horizons = 4,5), à corriger en priorité (§9 « Écart le plus significatif »).

## 7. Les Républicains (LR)

**Candidature : quasi réglée, techniquement en attente d'un jour.** Bruno Retailleau déclaré
personnellement le 12 février 2026. La ratification interne par un vote des adhérents LR intervient le
**19 avril 2026 — soit le lendemain de la date de début du jeu.** Au 18 avril 2026, Retailleau est donc
le candidat autoproclamé et pressenti, mais formellement non ratifié.

- [Elabe/BFMTV, fin janvier 2026, sympathisants de droite] : Retailleau jugé meilleur candidat par
  45 %, Xavier Bertrand 33 %, Laurent Wauquiez 21 % — tension interne déjà visible.
- [Elabe, publié le 28 mars 2026] : Retailleau **7–10 %**.
- **Fourchette retenue : 7–10 %.**
- Point écarté : un sondage Odoxa/Mascaret Retailleau-vs-Wauquiez initialement repéré s'est révélé daté
  d'avril **2025**, pas 2026 — exclu de cette baseline, signalé pour éviter une réutilisation erronée.

## 8. Reconquête

**Candidature : réellement incertaine.** Éric Zemmour, président du parti depuis décembre 2021,
n'avait pas tranché ; la presse de la période le décrit dans une posture d'attente, la décision
repoussée vers l'été 2026. Fracture réelle à l'extrême droite : Marion Maréchal (eurodéputée, tête de
liste Reconquête aux européennes de 2024, dirige désormais sa propre liste Identité-Libertés) a
publiquement soutenu Marine Le Pen plutôt que Zemmour pour 2027.

- [Elabe, publié le 28 mars 2026] : Zemmour **3–5 %** (léger recul) ; Sarah Knafo testée séparément,
  également **3–5 %**.
- **Fourchette retenue : 3–5 %.**

## 9. Nouvelle Énergie

**Vérifié : parti réel**, fondé par **David Lisnard, maire de Cannes**, qui a quitté Les Républicains
et fondé Nouvelle Énergie le **31 mars 2026** — un peu plus de deux semaines avant la date de début du
jeu, ce qui en fait une actualité très fraîche dans l'univers du jeu. Positionnement confirmé : droite
libérale-conservatrice, doctrine « ordolibérale », explicitement distincte de LR et du bloc central
Renaissance/Horizons. Revendiquait environ 15 000 adhérents au printemps 2026.

- Le seul chiffre trouvé (1-2 %) provient d'un agrégateur (ÉlyséeScope) citant « des sondages du
  printemps 2026 » sans institut ni date précis — **non retenu comme fiable**. Traitement retenu :
  parti neuf et non mesuré séparément par les grands instituts au 18 avril 2026, cohérent avec un
  lancement vieux de deux semaines et demie.
- **Fourchette retenue : 1–3 %** (fourchette large reflétant l'absence de mesure fiable, pas une
  fourchette de confiance serrée).

## 10. Contexte macro-politique, mars-avril 2026

- **Gouvernement** : Sébastien Lecornu, Premier ministre depuis octobre 2025 (gouvernement Lecornu II,
  remanié le 26 février 2026 avant les municipales de mars 2026). Le 10 avril 2026, Lecornu présente
  un « plan d'électrification » (aide de l'État portée de 5,5 à 10 Md€/an), présenté comme une réponse
  à l'anxiété sur la sécurité énergétique.
- **Choc économique/énergétique** : une offensive militaire américano-israélienne contre l'Iran
  (largement datée du 28 février 2026) perturbe le détroit d'Ormuz ; le Brent bondit de plus de 16 %
  (au-dessus de 85 $/baril, plus haut niveau depuis juillet 2024), le gaz européen (TTF) jusqu'à +67 %
  en 48h. L'inflation française atteint **1,7 % en mars 2026**, tirée par les coûts énergétiques.
  Contexte crédible de fond pour une campagne démarrant en avril 2026.
- **Défiance politique** : [CEVIPOF, Baromètre de la confiance politique, vague 17 — terrain OpinionWay
  du 12 au 28 janvier 2026, publié le 9 février 2026, n=3 166] : niveaux historiquement bas — 22 % de
  confiance envers la présidence, 20 % envers l'Assemblée nationale, 18 % envers Macron
  personnellement (contre 23 % en 2025), 15 % envers les partis, 76 % jugent les responsables
  politiques « plutôt corrompus qu'honnêtes ». Les maires restent l'exception (60 % de confiance).
- **Macron** : constitutionnellement empêché de se représenter. N'est pas candidat — non pertinent pour
  la modélisation des 9 partis jouables, mais pertinent pour le climat de fin de mandat/instabilité
  gouvernementale du scénario.
- **Ampleur du champ** : au printemps 2026, la presse dénombrait environ 30 candidatures potentielles
  (chiffre inédit sous la Ve République), dont 11 déjà formellement déclarées à la mi-février 2026.

## 11. Récapitulatif — fourchettes retenues pour la baseline du 18 avril 2026

| Parti | Candidature au 18/04/2026 | Fourchette retenue | Confiance |
|---|---|---|---|
| RN | Incertaine (Bardella / Le Pen, verdict d'appel pendant) | 31,5–35 % | Moyenne-haute (2 scénarios croisés, 1 poll) |
| LFI | Présumée (Mélenchon, non déclaré) | 10,5–14 % | Moyenne (peu de sondages datés) |
| PS / espace social-démocrate | Incertaine (Faure vs figure de rassemblement type Glucksmann) | 4,5–10,5 % | Moyenne |
| Écologistes | Réglée (Tondelier) | 4–5 % | Haute |
| Renaissance | Présumée (Attal, non déclaré) | 8–12 % | Moyenne |
| Horizons | Réglée (Philippe) | 20,5–25,5 % | Haute (3 sources convergentes) |
| LR | Quasi réglée (Retailleau, ratification J+1) | 7–10 % | Haute |
| Reconquête | Incertaine (Zemmour indécis) | 3–5 % | Moyenne |
| Nouvelle Énergie | Réglée en identité, non mesurée (Lisnard, parti fondé J-18) | 1–3 % | Basse (absence de sondage fiable) |

## 12. Sources

- Elabe pour La Tribune Dimanche, sondage publié le 28 mars 2026 (et vague du 25-26 mars pour
  Horizons) — scénarios multiples de candidature.
- Odoxa, baromètre de popularité, mars 2026.
- Odoxa-Mascaret, hypothèses de second tour, mars 2026.
- Ipsos BVA-CESI pour La Tribune Dimanche, terrain 8-9 avril 2026.
- Cluster17/Marianne, 5 décembre 2025 (potentiel de vote — hors fenêtre stricte, utilisée en
  recoupement uniquement).
- CEVIPOF, Baromètre de la confiance politique vague 17, terrain OpinionWay 12-28 janvier 2026, publié
  le 9 février 2026.
- Sites officiels : republicains.fr (ratification Retailleau), unenouvelleenergie.fr (fondation
  Lisnard).
- Presse généraliste pour le contexte macro (gouvernement, choc énergétique) : publicsenat.fr,
  france24.com, touteleurope.eu.

## 13. Limites explicitement signalées

- Aucune source à date ferme trouvée pour janvier-février 2026 opposant explicitement scénario
  Bardella et scénario Le Pen côte à côte (le 28 mars 2026 est la plus ancienne trouvée).
- La fourchette Nouvelle Énergie repose sur l'absence de mesure fiable plutôt que sur une mesure
  positive — traité comme tel, pas comme une fourchette de confiance haute.
- Un sondage Retailleau-vs-Wauquiez identifié initialement s'est révélé daté d'avril 2025 et a été
  écarté.
- La date exacte d'une déclaration de Macron sur son avenir politique (fin avril 2026, Nicosie) n'a pas
  pu être positionnée avec certitude avant ou après le 18 avril — traitée comme contemporaine
  approximative, pas comme un fait daté fiable.
