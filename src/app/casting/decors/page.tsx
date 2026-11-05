import type { Metadata } from "next";

import { DecorsLoader } from "@/features/three/casting-loader";

export const metadata: Metadata = {
  title: "Décors",
  description: "Les décors 3D de la campagne : débat, soirée électorale, Élysée.",
};

export default function DecorsPage() {
  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-4xl font-black uppercase">Les décors</h1>
      <p className="mt-2 text-[var(--ink-muted)]">Débat télévisé, soirée électorale et Élysée.</p>
      <div className="mt-6">
        <DecorsLoader />
      </div>
    </article>
  );
}
