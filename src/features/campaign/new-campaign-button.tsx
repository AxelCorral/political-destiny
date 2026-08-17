"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type Ref } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { hasActiveGame } from "@/lib/storage/game-database";

import { startNewCampaign } from "./new-campaign";

interface NewCampaignButtonProps extends Pick<ButtonProps, "variant" | "size" | "className"> {
  children: ReactNode;
  /**
   * Rend le CTA comme un vrai lien vers /jouer plutôt que comme un bouton.
   * Le clic gauche reste intercepté (l'intention « nouvelle partie » doit être
   * posée avant la navigation), mais l'ouverture dans un nouvel onglet garde le
   * comportement natif : un onglet neuf part d'un store vide et /jouer y reprend
   * la sauvegarde, ce qui reste la sémantique historique d'un accès direct.
   */
  asLink?: boolean;
}

/**
 * Tous les points d'entrée « je veux commencer une nouvelle campagne » de
 * l'accueil : le CTA principal du hero et le bouton de la carte de sauvegarde.
 * Un seul composant pour que la confirmation destructive, la remise à zéro et
 * la navigation ne puissent pas diverger entre les deux.
 */
export function NewCampaignButton({ children, asLink = false, ...button }: NewCampaignButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const triggerRef = useRef<HTMLElement>(null);

  // Retour du focus vers le déclencheur à la fermeture (§15). La restauration
  // automatique de Radix suppose que le déclencheur avait le focus à
  // l'ouverture, ce qui n'est pas le cas d'un clic tactile : on le replace
  // explicitement pour que le clavier reprenne au bon endroit dans les deux cas.
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (wasConfirming.current && !confirming) triggerRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  const openNewCampaign = async () => {
    await startNewCampaign();
    router.push("/jouer");
  };

  const request = async (event: MouseEvent<HTMLElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (await hasActiveGame().catch(() => false)) {
      setError(undefined);
      setConfirming(true);
      return;
    }
    // Rien à détruire : aucune confirmation, et un stockage indisponible ne doit
    // pas empêcher de jouer.
    await openNewCampaign().catch(() => router.push("/jouer"));
  };

  const confirm = async () => {
    setPending(true);
    try {
      await startNewCampaign();
      setConfirming(false);
      router.push("/jouer");
    } catch {
      setError(
        "La sauvegarde n’a pas pu être supprimée. Votre campagne reste intacte : réessayez ou libérez de l’espace de stockage.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {asLink ? (
        <Button asChild {...button}>
          <Link
            ref={triggerRef as Ref<HTMLAnchorElement>}
            href="/jouer"
            onClick={(event) => void request(event)}
          >
            {children}
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          ref={triggerRef as Ref<HTMLButtonElement>}
          {...button}
          onClick={(event) => void request(event)}
        >
          {children}
        </Button>
      )}
      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!pending) setConfirming(open);
        }}
        title="Démarrer une nouvelle campagne ?"
        description="Votre campagne en cours sera remplacée et sa progression définitivement perdue. Vos archives, badges et réglages ne sont pas touchés."
        className="max-w-lg"
      >
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-[var(--radius-sm)] border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-[var(--warning)]"
          >
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>
            Annuler
          </Button>
          <Button variant="danger" disabled={pending} onClick={() => void confirm()}>
            Démarrer une nouvelle campagne
          </Button>
        </div>
      </Dialog>
    </>
  );
}
