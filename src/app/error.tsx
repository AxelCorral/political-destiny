"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-4 py-12">
      <Card className="p-8 text-center sm:p-12">
        <AlertTriangle aria-hidden="true" className="mx-auto size-12 text-[var(--red-700)]" />
        <h1 className="mt-6 font-display text-4xl font-black uppercase">
          La campagne a rencontré un incident
        </h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          Votre dernière sauvegarde locale reste disponible. Vous pouvez tenter de recharger cet
          écran ou revenir à l’accueil.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw aria-hidden="true" className="size-4" /> Réessayer
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Retour à l’accueil</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
