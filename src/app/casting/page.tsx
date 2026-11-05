import type { Metadata } from "next";

import { CastingLoader } from "@/features/three/casting-loader";

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
    </article>
  );
}
