"use client";

import { clearActiveGame } from "@/lib/storage/game-database";

import { useGameStore } from "./gameStore";

/**
 * Source de vérité unique du démarrage volontaire d'une nouvelle campagne.
 *
 * Une partie active vit à deux endroits, et les deux doivent être libérés
 * avant de naviguer vers /jouer :
 *
 * 1. la sauvegarde IndexedDB, que `GameApp` restaure systématiquement au
 *    montage (`loadActiveGame` → `restoreGame`) ;
 * 2. le store zustand, qui est un singleton de module : il survit à toute
 *    navigation applicative, si bien qu'une sauvegarde effacée sans reset du
 *    store réapparaît à l'écran, puis est réécrite en base par l'autosave de
 *    `GameApp` — la campagne que le joueur venait d'abandonner revenait ainsi
 *    silencieusement.
 *
 * L'intention « nouvelle partie » est donc exprimée **avant** le changement de
 * route, dans le même contexte JavaScript : elle ne dépend d'aucun paramètre
 * d'URL, d'aucun timeout et n'entre en concurrence avec aucune hydratation.
 *
 * Seul le run actif est touché : archives, profil, badges, réglages et
 * consentement analytics vivent dans d'autres object stores et sont conservés.
 */
export async function startNewCampaign(): Promise<void> {
  try {
    await clearActiveGame();
  } finally {
    // Même si la base refuse la suppression, le store repart propre : l'appelant
    // apprend l'échec par l'exception et n'a pas à naviguer sur un état hybride.
    useGameStore.getState().resetGame();
  }
}
