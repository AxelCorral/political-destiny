import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/info-page";
import { gameContent, realWorldSnapshot } from "@/game/data";

export const metadata: Metadata = {
  title: "Méthodologie",
  description: "Principes du moteur probabiliste et des paramètres éditoriaux du jeu.",
};

export default function MethodologyPage() {
  return (
    <InfoPage
      eyebrow="Transparence du modèle"
      title="Méthodologie"
      introduction="Vers l’Élysée est un jeu narratif, pas un modèle prédictif. Cette page explique ce que la simulation calcule, ce qu’elle invente et pourquoi deux choix identiques peuvent parfois produire des conséquences différentes."
    >
      <section>
        <h2>Un moteur déterministe et probabiliste</h2>
        <p className="mt-3">
          Chaque partie possède une graine textuelle. Elle initialise un générateur pseudo-aléatoire
          local : avec la même graine et exactement les mêmes décisions, la campagne suit la même
          histoire. Un choix ne garantit toutefois pas une issue. Ses conséquences sont tirées parmi
          plusieurs résultats pondérés par les statistiques du parti, les traits du candidat fictif,
          la phase, le monde simulé et les décisions passées.
        </p>
        <p className="mt-3">
          Le jeu conserve le tirage et les probabilités dans son journal interne pour les tests,
          mais ne les montre pas pendant la partie. L’interface donne des indices qualitatifs afin
          d’éviter une stratégie purement mécanique.
        </p>
      </section>
      <section>
        <h2>Électorat, sondages et scrutins</h2>
        <p className="mt-3">
          Douze blocs électoraux synthétiques répartissent un soutien latent entre les partis.
          Distance idéologique, crédibilité, rejet, implantation, thème dominant, mobilisation et
          vote utile interviennent dans ce calcul. Ces catégories simplifient volontairement la
          société française et ne décrivent aucun individu.
        </p>
        <p className="mt-3">
          Les sondages affichés ajoutent du bruit, des indécis et un retard de perception. Ils
          utilisent des instituts entièrement fictifs et aucune donnée de sondage réelle. Les
          scrutins appliquent un bruit plus faible, la participation et les reports de voix, puis
          normalisent les suffrages exprimés à 100 %.
        </p>
      </section>
      <section>
        <h2>Paramètres éditoriaux de gameplay</h2>
        <p className="mt-3">
          Les soutiens de départ, potentiels, forces, faiblesses, traits, affinités et probabilités
          sont des <strong>paramètres éditoriaux de gameplay, datés et révisables</strong>. Ils ne
          sont ni des mesures scientifiques, ni des jugements moraux, ni des estimations
          électorales. La progression relative compte fortement dans le score pour que plusieurs
          trajectoires restent intéressantes.
        </p>
        <p className="mt-3">
          La V1 contient {gameContent.events.length} événements validés et{" "}
          {gameContent.achievements.length} succès. Des quotas souples, des périodes d’éligibilité,
          des délais de répétition et des événements de secours empêchent une campagne de se bloquer
          ou de répéter excessivement une catégorie.
        </p>
      </section>
      <section>
        <h2>Personnes, partis et sécurité éditoriale</h2>
        <p className="mt-3">
          Les noms des partis servent de contexte reconnaissable. Toutes les candidatures jouables,
          cadres, porte-parole, dialogues, crises sensibles et accusations sont fictifs. Aucune
          personnalité réelle n’est jouable dans le mode public. Le jeu n’invente jamais de citation
          ou d’accusation visant une personne identifiable.
        </p>
        <p className="mt-3">
          Le snapshot des dénominations a été vérifié le{" "}
          {new Date(`${realWorldSnapshot.snapshotDate}T12:00:00Z`).toLocaleDateString("fr-FR", {
            timeZone: "UTC",
          })}
          . La date électorale de la simulation est une configuration narrative et n’est pas
          présentée comme une annonce institutionnelle.
        </p>
      </section>
      <section>
        <h2>Sources de dénomination</h2>
        <p className="mt-3">
          Seuls les noms, alias et sites publics utiles à la configuration sont sourcés. Les
          mécaniques et résultats ne dérivent pas de ces sites.
        </p>
        <ul className="mt-4 columns-1 sm:columns-2">
          {realWorldSnapshot.sourceMetadata.map((source) => (
            <li key={source.url} className="mb-2 break-inside-avoid">
              <a href={source.url} rel="noreferrer" target="_blank">
                {source.title}
              </a>{" "}
              — consulté le {source.accessedAt}
            </li>
          ))}
        </ul>
      </section>
    </InfoPage>
  );
}
