import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/layout/info-page";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Gestion strictement locale des données de jeu.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Vie privée"
      title="Confidentialité"
      introduction="La V1 fonctionne sans compte, sans publicité, sans outil d’analytics et sans profil serveur. Vos campagnes appartiennent à votre navigateur."
    >
      <section>
        <h2>Données enregistrées</h2>
        <p className="mt-3">
          Le jeu utilise IndexedDB pour conserver une partie active, les campagnes terminées, les
          badges, les fins découvertes, les graines et quelques préférences d’affichage. Ces
          informations décrivent uniquement votre activité dans le jeu. Aucun nom réel, courriel,
          identifiant publicitaire ou donnée de paiement n’est demandé.
        </p>
      </section>
      <section>
        <h2>Où restent-elles ?</h2>
        <p className="mt-3">
          Les données demeurent sur l’appareil et dans le profil de navigateur qui a lancé le jeu.
          Elles ne sont envoyées ni à l’éditeur, ni à un parti, ni à un service d’IA. Effacer les
          données du site dans le navigateur peut également supprimer ces sauvegardes.
        </p>
      </section>
      <section>
        <h2>Export, import et suppression</h2>
        <p className="mt-3">
          La page <Link href="/parametres">Paramètres</Link> permet de télécharger un fichier JSON
          local, de réimporter un export compatible, de supprimer toutes les données ou de réduire
          les animations. Une archive peut aussi être supprimée individuellement depuis le panthéon.
        </p>
      </section>
      <section>
        <h2>Partage d’une carte</h2>
        <p className="mt-3">
          La carte de résultat est rendue côté client. Si votre appareil propose l’API de partage,
          le jeu lui remet uniquement le fichier PNG que vous avez demandé. Sinon, le PNG est
          téléchargé. Aucun visuel n’est téléversé par l’application.
        </p>
      </section>
      <section>
        <h2>Réseau et fonctionnement hors ligne</h2>
        <p className="mt-3">
          Après une première visite, un service worker peut mettre en cache les ressources publiques
          nécessaires au fonctionnement hors connexion. Ce cache technique ne contient pas votre
          historique de décisions. Aucune API extérieure n’est requise pour jouer.
        </p>
      </section>
    </InfoPage>
  );
}
