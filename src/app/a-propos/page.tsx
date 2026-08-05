import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/layout/info-page";
import { BRANDING } from "@/config/branding";

export const metadata: Metadata = {
  title: "À propos",
  description: "À propos de Vers l’Élysée et de son cadre fictif.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow={`Version ${BRANDING.version}`}
      title="À propos"
      introduction="Vers l’Élysée est une simulation narrative indépendante de campagne présidentielle française, conçue pour une partie courte, lisible et rejouable sur mobile comme sur ordinateur."
    >
      <section className="rounded-2xl bg-[var(--navy-950)] p-6 text-white">
        <h2 className="text-white">Simulation politique fictive</h2>
        <p className="mt-3 !text-slate-200">
          Les événements, dialogues, probabilités, classements et résultats de ce jeu sont fictifs.
          Ils ne constituent ni une prédiction électorale, ni une information officielle, ni un
          soutien à un parti ou à une personnalité. Les paramètres de gameplay ne sont pas des
          mesures objectives de valeur politique.
        </p>
      </section>
      <section>
        <h2>Ce que vous incarnez</h2>
        <p className="mt-3">
          Vous jouez toujours une candidate ou un candidat fictif. Les partis existants apportent un
          contexte politique reconnaissable, tandis que leur profil chiffré, leurs histoires
          internes et leurs résultats sont inventés pour la simulation. Vous pouvez aussi créer un
          mouvement entièrement original.
        </p>
      </section>
      <section>
        <h2>Indépendance</h2>
        <p className="mt-3">
          Le projet n’est officiel, affilié, soutenu ou financé par aucun parti, candidat,
          institution ou institut de sondage. Il ne contient ni publicité, ni achat intégré, ni
          connexion à une API d’intelligence artificielle.
        </p>
      </section>
      <section>
        <h2>Transparence et contrôle</h2>
        <p className="mt-3">
          Consultez la <Link href="/methodologie">méthodologie</Link> pour comprendre les principes
          du moteur et la <Link href="/confidentialite">page confidentialité</Link> pour savoir ce
          qui reste sur votre appareil. Les <Link href="/parametres">paramètres</Link> donnent accès
          à l’export et à la suppression.
        </p>
      </section>
    </InfoPage>
  );
}
