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
      introduction="Le jeu fonctionne sans compte, sans publicité et sans profil serveur. Vos campagnes appartiennent à votre navigateur. Des statistiques anonymes, activées par défaut et désactivables à tout moment, existent pour améliorer l’équilibrage du jeu — le détail est ci-dessous."
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
        <h2>Statistiques anonymes (désactivables)</h2>
        <p className="mt-3">
          Le jeu envoie des événements anonymes à un serveur privé — décisions prises, étapes de
          campagne atteintes, résultat final — pour aider à équilibrer les partis et repérer les
          événements mal calibrés. Cette fonctionnalité est <strong>activée par défaut</strong>,
          sans identifier personne : aucune donnée de compte, de contact ou de contenu rédigé par
          vous n’est collectée, uniquement des événements de jeu techniques (voir le détail
          ci-dessous). Vous pouvez la désactiver à tout moment dans la page{" "}
          <Link href="/parametres">Paramètres</Link> ; la désactiver vide immédiatement la file
          d’envoi locale et arrête tout nouvel envoi. L’accès au jeu n’est jamais conditionné à ce
          choix.
        </p>
        <p className="mt-3">
          Ce qui est envoyé tant que vous ne désactivez pas cette option : un identifiant anonyme
          généré sur votre appareil (pas un compte, pas une empreinte de navigateur), les choix
          effectués dans le jeu et leurs identifiants techniques, la progression de la campagne
          (parti, méthode, phases atteintes, score final), et des informations techniques de
          version du jeu.
        </p>
        <p className="mt-3">
          Ce qui n’est <strong>jamais</strong> envoyé : votre nom, un e-mail, une adresse IP
          conservée, le texte des événements ou des décisions, une empreinte publicitaire, ou toute
          donnée permettant d’identifier une personne réelle. Un identifiant anonyme n’est pas
          l’identité d’une personne précise. Le détail complet (quelles données, quelle
          conservation, comment les supprimer) est documenté dans le dépôt du projet (
          <code>docs/analytics/PRIVACY.md</code>) ; cette page ne prétend à aucune certification ni
          conformité réglementaire particulière.
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
          historique de décisions. Aucune API extérieure n’est requise pour jouer, y compris si les
          statistiques anonymes décrites ci-dessus sont désactivées : elles ne sont qu’une couche
          additionnelle, jamais un prérequis.
        </p>
      </section>
    </InfoPage>
  );
}
