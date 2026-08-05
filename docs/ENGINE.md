# Moteur de simulation

Le moteur sous `src/game/engine` est une bibliothèque TypeScript pure. Il ne dépend ni de React, ni
du DOM, ni du stockage navigateur. Une commande reçoit un état sérialisable et retourne un nouvel
état avec un résultat ; l’interface n’est qu’un consommateur.

## Déterminisme

La graine textuelle initialise un générateur pseudo-aléatoire à état explicite. Chaque tirage
incrémente un compteur sauvegardé. Même version, même graine et mêmes choix produisent le même récit.
Les identifiants de run et dates simulées sont eux aussi dérivés de la graine.

## Pipeline d’une décision

1. Vérifier l’éligibilité de l’événement et du choix.
2. Transformer chaque poids en logit et appliquer les modificateurs contextuels.
3. Normaliser avec softmax puis tirer une issue.
4. Appliquer les effets bornés et inscrire les effets différés.
5. Exécuter un tour abstrait pour chaque adversaire.
6. Recalculer soutien latent et sondage si nécessaire.
7. Avancer la date, les cooldowns et la phase.
8. Sélectionner le prochain événement et journaliser le tirage interne.

## Invariants

- statistiques visibles dans `[0, 100]` et idéologie dans `[-100, 100]` ;
- aucune valeur non finie ;
- résultats électoraux corrigés à exactement 100 % ;
- finalistes distincts et actifs ;
- effets différés appliqués une seule fois ;
- chaîne bornée et partie toujours terminable ;
- sauvegarde versionnée avec migrations explicites.
