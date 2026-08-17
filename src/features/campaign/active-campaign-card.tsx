"use client";

import { ArrowRight, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PartyMark } from "@/components/game/party-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GameState } from "@/game/types";
import { loadActiveGame } from "@/lib/storage/game-database";

import { NewCampaignButton } from "./new-campaign-button";

export function ActiveCampaignCard() {
  const router = useRouter();
  const [state, setState] = useState<GameState>();

  useEffect(() => {
    let active = true;
    void loadActiveGame()
      .then((result) => {
        if (active) setState(result.state);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!state) return null;
  const party = state.parties[state.playerPartyId];
  if (!party) return null;

  return (
    <section
      className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8"
      aria-labelledby="resume-title"
    >
      <Card className="grid gap-5 border-[var(--blue-400)] p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
        <PartyMark visual={party.visual} name={party.displayName} size="large" />
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--blue-600)]">
            <Save aria-hidden="true" className="size-4" />{" "}
            {state.phase === "finished" ? "Bilan disponible" : "Campagne sauvegardée"}
          </p>
          <h2 id="resume-title" className="mt-2 text-xl font-black">
            {state.player.displayName} · {party.displayName}
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {state.phase === "finished" && state.finalResult
              ? `${state.finalResult.title} · ${state.finalResult.score}/100`
              : `${state.decisionIndex} décision${state.decisionIndex > 1 ? "s" : ""} prise${state.decisionIndex > 1 ? "s" : ""} · ${party.stats.polling.toFixed(1)} % dans le dernier état simulé`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-stretch">
          <Button onClick={() => router.push("/jouer")}>
            {state.phase === "finished" ? "Voir le bilan" : "Reprendre"}{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <NewCampaignButton variant="ghost" size="compact">
            <RotateCcw aria-hidden="true" className="size-3.5" /> Nouvelle partie
          </NewCampaignButton>
        </div>
      </Card>
    </section>
  );
}
