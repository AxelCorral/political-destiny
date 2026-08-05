import { Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-4 py-12">
      <Card className="p-8 text-center sm:p-12">
        <Compass aria-hidden="true" className="mx-auto size-12 text-[var(--blue-600)]" />
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[var(--blue-600)]">
          Erreur 404
        </p>
        <h1 className="mt-2 font-display text-4xl font-black uppercase">
          Cette circonscription n’existe pas
        </h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          La page a peut-être changé d’adresse ou quitté la campagne.
        </p>
        <Button asChild className="mt-7">
          <Link href="/">Revenir à l’accueil</Link>
        </Button>
      </Card>
    </div>
  );
}
