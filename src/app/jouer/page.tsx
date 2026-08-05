import type { Metadata } from "next";

import { GameApp } from "@/features/campaign/game-app";

export const metadata: Metadata = {
  title: "Jouer",
  description: "Lancer ou reprendre une campagne présidentielle fictive.",
};

export default function PlayPage() {
  return <GameApp />;
}
