import { CloudOff, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Hors connexion" };

export default function OfflinePage() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-4 py-12">
      <Card className="p-8 text-center sm:p-12">
        <CloudOff aria-hidden="true" className="mx-auto size-12 text-[var(--blue-600)]" />
        <h1 className="mt-6 font-display text-4xl font-black uppercase">
          Vous êtes hors connexion
        </h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          Les écrans déjà visités et votre sauvegarde locale peuvent rester disponibles. Revenez à
          l’accueil ou réessayez lorsque la connexion revient.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <RotateCcw aria-hidden="true" className="size-4" /> Retour à l’accueil
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/jouer">Ouvrir ma campagne</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
