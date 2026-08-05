# Données réelles

La V1 ne récupère aucune donnée en direct. Le dossier `src/game/data/realWorldSnapshot` contient un
snapshot versionné, daté et lisible par l’équipe éditoriale. Les probabilités, statistiques de départ
et sondages du jeu sont toujours présentés comme des paramètres fictifs.

## Procédure de mise à jour

1. Définir la date du snapshot et `lastEditorialReviewAt`.
2. Vérifier les noms/alias sur les sites officiels des organisations.
3. Pour une information institutionnelle, privilégier Conseil constitutionnel, ministère de
   l’Intérieur, Légifrance ou CNCCFP.
4. Enregistrer URL, titre, organisme, date de publication et date de consultation.
5. Ne jamais compléter une donnée absente par supposition ; utiliser `NEEDS_EDITORIAL_REVIEW`.
6. Lancer `npm run data:validate`, puis faire relire tout changement sensible.

Aucun portrait, logo officiel ou texte protégé n’est incorporé au jeu.
