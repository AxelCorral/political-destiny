# MESSAGE D’ORCHESTRATION — EXÉCUTER LES DEUX MISSIONS SÉQUENTIELLEMENT

Tu dois exécuter DEUX missions distinctes dans ce dépôt, dans un ordre strict.

## MISSION 1 — GAME DESIGN / GAMEPLAY / FUN

Lis intégralement :

`PROMPT_CLAUDE_CODE_PASSE_CIBLEE_GAMEPLAY_POST_FUN.md`

Exécute cette mission de bout en bout.

IMPORTANT :
- ne commence PAS la Mission 2 tant que la Mission 1 n’est pas complètement terminée ;
- « terminée » signifie : toutes les phases exécutées, code réellement modifié, simulations/contrefactuels/playtests réalisés, tests stabilisés, rapport `TARGETED_GAMEPLAY_PASS_REPORT.md` créé, verdict final écrit, git status inspecté et commits locaux de la mission terminés ;
- si un test ou une validation échoue, diagnostique et corrige avant de passer à la suite ;
- ne laisse pas volontairement une phase inachevée pour commencer la Mission 2 ;
- ne mélange pas les modifications visuelles dans la Mission 1.

Une fois la Mission 1 réellement terminée, relis son rapport final et considère le HEAD obtenu comme la nouvelle source de vérité.

## GATE ENTRE LES DEUX MISSIONS

Avant de commencer la Mission 2, vérifie explicitement :

1. `TARGETED_GAMEPLAY_PASS_REPORT.md` existe.
2. Le verdict final de Mission 1 est présent.
3. Les tests de fond demandés par Mission 1 ont été exécutés.
4. Les modifications de Mission 1 sont commitées localement.
5. Tu as lu les problèmes encore ouverts.
6. Tu n’as aucun travail de Mission 1 volontairement laissé en attente.
7. Le HEAD courant correspond bien à la fin de Mission 1.

Écris alors dans le terminal :

`MISSION 1 TERMINÉE — DÉMARRAGE MISSION 2`

Seulement après ce gate, passe à la Mission 2.

## MISSION 2 — FORME / UI / DIRECTION ARTISTIQUE / GAME FEEL

Lis intégralement :

`PROMPT_CLAUDE_CODE_REFONTE_FORME_GAME_FEEL_POST_AUDIT.md`

Puis lis :
- `AUDIT_FORME_GAME_FEEL.md`
- le nouveau `TARGETED_GAMEPLAY_PASS_REPORT.md`

Exécute ensuite la Mission 2 de bout en bout sur le HEAD produit par la Mission 1.

IMPORTANT :
- ne reviens pas modifier l’équilibrage ou les règles gameplay pendant la Mission 2 ;
- adapte les captures, fixtures et états de test à la version fonctionnelle désormais finale ;
- réalise réellement les changements UI/UX, responsive, game feel, animations, visual regression et playtests demandés ;
- termine par `FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md` et son verdict final ;
- ne pousse rien vers le dépôt distant.

## ORDRE ABSOLU

`MISSION 1 complète`
→ `gate de validation`
→ `MISSION 2 complète`

Pas :
`Mission 1 partielle`
→ `un peu de Mission 2`
→ `retour Mission 1`.

Les deux chantiers doivent rester séparés afin de pouvoir attribuer clairement les effets de chaque passe.

Travaille de manière autonome jusqu’à ce que les DEUX missions soient complètement terminées.
