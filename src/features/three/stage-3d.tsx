"use client";

import dynamic from "next/dynamic";
import { Component, type ComponentProps, type ReactNode, useSyncExternalStore } from "react";

/**
 * Points d'entrée 3D chargés à la demande (client uniquement). Chaque scène est
 * enveloppée dans un cadre de hauteur fixe pour éviter tout saut de mise en page,
 * et disparaît si le joueur a désactivé « Scènes 3D » dans les paramètres.
 */

const load = () => import("./game-stages");

const CampaignStageLazy = dynamic(() => load().then((m) => m.CampaignStageFromState), {
  ssr: false,
});
const DebateStageLazy = dynamic(() => load().then((m) => m.DebateStageFromState), { ssr: false });
const PodiumStageLazy = dynamic(() => load().then((m) => m.PodiumStageFromResult), { ssr: false });
const ElyseeStageLazy = dynamic(() => load().then((m) => m.ElyseeStageFromState), { ssr: false });
const HomeStageLazy = dynamic(() => load().then((m) => m.HomeStage), { ssr: false });

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-scenes3d"],
  });
  return () => observer.disconnect();
}

function useEnabled() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.scenes3d !== "false",
    () => false,
  );
}

/**
 * Une scène 3D ne doit jamais faire tomber la partie : toute erreur (WebGL indisponible,
 * contexte perdu, modèle illisible) masque simplement la scène.
 */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.warn("Scène 3D désactivée après une erreur :", error);
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Frame({ className, children }: { className: string; children: ReactNode }) {
  const enabled = useEnabled();
  if (!enabled) return null;
  return (
    <SceneBoundary>
      <div className={className}>{children}</div>
    </SceneBoundary>
  );
}

export function CampaignStage3D(props: ComponentProps<typeof CampaignStageLazy>) {
  return (
    <Frame className="mb-5 h-56 overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[#f3ebdd] sm:h-72">
      <CampaignStageLazy {...props} />
    </Frame>
  );
}

export function DebateStage3D(props: ComponentProps<typeof DebateStageLazy>) {
  return (
    <Frame className="mb-5 h-56 overflow-hidden rounded-[1.25rem] bg-[#0e1630] sm:h-72">
      <DebateStageLazy {...props} />
    </Frame>
  );
}

export function PodiumStage3D(props: ComponentProps<typeof PodiumStageLazy>) {
  return (
    <Frame className="mx-auto mt-8 h-64 max-w-4xl overflow-hidden rounded-[1.25rem] bg-[#0b1730] sm:h-80">
      <PodiumStageLazy {...props} />
    </Frame>
  );
}

export function ElyseeStage3D(props: ComponentProps<typeof ElyseeStageLazy>) {
  return (
    <Frame className="mb-6 h-64 overflow-hidden rounded-[1.25rem] sm:h-80">
      <ElyseeStageLazy {...props} />
    </Frame>
  );
}

export function HomeStage3D() {
  return (
    <Frame className="h-72 w-full sm:h-96 lg:h-[30rem]">
      <HomeStageLazy />
    </Frame>
  );
}
