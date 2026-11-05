import type { Metadata } from "next";

import { AiTrialLoader, CastingLoader } from "@/features/three/casting-loader";

export const metadata: Metadata = {
  title: "Casting",
  description: "Les figurines caricaturales des candidats de la simulation.",
};

export default function CastingPage() {
  return (
    <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-4xl font-black uppercase">Le casting</h1>
      <p className="mt-2 max-w-3xl text-[var(--ink-muted)]">
        Figurines caricaturales et volontairement non réalistes. Glisser pour tourner la scène.
      </p>
      <div className="mt-6">
        <CastingLoader />
      </div>
      <section className="mt-12">
        <h2 className="text-2xl font-black">Essai : modèles générés par IA</h2>
        <p className="mt-2 max-w-3xl text-[var(--ink-muted)]">
          À gauche de chaque paire, la figurine codée et animée ; à droite, un modèle 3D généré par
          IA à partir de son rendu. Comparaison de rendu uniquement : les modèles IA ne sont pas
          animés.
        </p>
        <div className="mt-6">
          <AiTrialLoader />
        </div>
      </section>
    </article>
  );
}
