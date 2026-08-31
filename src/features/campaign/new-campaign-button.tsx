"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type Ref } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { GameState } from "@/game/types";
import { loadActiveGame } from "@/lib/storage/game-database";

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
  /**
   * Ajoute « Reprendre la campagne » au dialogue.
   *
   * Réservé aux CTA « Lancer une campagne », dont l'intention est ambiguë quand
   * une sauvegarde existe : le joueur veut jouer, sans forcément savoir qu'une
   * campagne l'attend. Le bouton « Nouvelle partie » de la carte de sauvegarde
   * ne l'active pas — il est affiché juste sous « Reprendre », donc son
   * intention est déjà tranchée et rouvrir le choix n'ajouterait que du bruit.
   */
  offerResume?: boolean;
}

/** Une ligne courte qui identifie la campagne sauvegardée, sur le modèle de `ActiveCampaignCard`. */
function describeSave(state: GameState): { title: string; detail: string } | undefined {
  const party = state.parties[state.playerPartyId];
  if (!party) return undefined;
  const plural = state.decisionIndex > 1 ? "s" : "";
  return {
    title: `${state.player.displayName} · ${party.displayName}`,
    detail:
      state.phase === "finished" && state.finalResult
        ? `${state.finalResult.title} · ${state.finalResult.score}/100`
        : `${state.decisionIndex} décision${plural} prise${plural}`,
  };
}

/**
 * Tous les points d'entrée « je veux commencer une nouvelle campagne » de
 * l'accueil : le CTA principal du hero et le bouton de la carte de sauvegarde.
 * Un seul composant pour que la confirmation destructive, la remise à zéro et
 * la navigation ne puissent pas diverger entre les deux.
 */
export function NewCampaignButton({
  children,
  asLink = false,
  offerResume = false,
  ...button
}: NewCampaignButtonProps) {
  const router = useRouter();
  const [active, setActive] = useState<GameState>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const triggerRef = useRef<HTMLElement>(null);
  const confirming = active !== undefined;

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
    // `loadActiveGame` plutôt que `hasActiveGame` : le dialogue doit nommer la
    // campagne concernée (§8), et une sauvegarde illisible ne renvoie aucun
    // state — auquel cas il n'y a rien à préserver et rien à confirmer.
    const saved = await loadActiveGame()
      .then((result) => result.state)
      .catch(() => undefined);
    if (saved) {
      setError(undefined);
      setActive(saved);
      return;
    }
    // Rien à détruire : aucune confirmation, et un stockage indisponible ne doit
    // pas empêcher de jouer.
    await openNewCampaign().catch(() => router.push("/jouer"));
  };

  /**
   * Reprise : aucune écriture, aucune remise à zéro. `GameApp` restaure la
   * sauvegarde au montage de /jouer, exactement comme le bouton « Reprendre »
   * de la carte — seed, progression et décisions sont ceux du disque.
   */
  const resume = () => {
    setActive(undefined);
    router.push("/jouer");
  };

  const confirm = async () => {
    setPending(true);
    try {
      await startNewCampaign();
      setActive(undefined);
      router.push("/jouer");
    } catch {
      setError(
        "La sauvegarde n’a pas pu être supprimée. Votre campagne reste intacte : réessayez ou libérez de l’espace de stockage.",
      );
    } finally {
      setPending(false);
    }
  };

  const summary = active ? describeSave(active) : undefined;

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
          if (!pending && !open) setActive(undefined);
        }}
        title={offerResume ? "Une campagne est déjà en cours" : "Démarrer une nouvelle campagne ?"}
        description={
          offerResume
            ? "Vous pouvez la reprendre où vous l’aviez laissée, ou en démarrer une nouvelle. Démarrer une nouvelle campagne remplace celle-ci et sa progression est définitivement perdue."
            : "Votre campagne en cours sera remplacée et sa progression définitivement perdue. Vos archives, badges et réglages ne sont pas touchés."
        }
        // Trois actions côte à côte demandent plus de largeur que deux : à
        // `max-w-lg`, « Reprendre la campagne » et « Démarrer une nouvelle
        // campagne » passent à la ligne et la rangée devient illisible.
        className={offerResume ? undefined : "max-w-lg"}
      >
        {summary ? (
          <div className="mb-5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3">
            {/* Le nom du parti est libre à la création (jusqu'à 50 caractères,
                éventuellement sans espace) : sans césure, un nom d'un seul
                tenant déborderait du dialogue sur mobile. */}
            <p className="font-black break-words">{summary.title}</p>
            <p className="mt-0.5 text-sm text-[var(--ink-muted)]">{summary.detail}</p>
          </div>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-[var(--radius-sm)] border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-[var(--warning)]"
          >
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={pending} onClick={() => setActive(undefined)}>
            Annuler
          </Button>
          {offerResume ? (
            <Button disabled={pending} onClick={resume}>
              Reprendre la campagne
            </Button>
          ) : null}
          <Button variant="danger" disabled={pending} onClick={() => void confirm()}>
            Démarrer une nouvelle campagne
          </Button>
        </div>
      </Dialog>
    </>
  );
}
