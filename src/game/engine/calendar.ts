import type { GamePhase, RngState } from "@/game/types";

import { randomInt } from "./rng";

const DAY_MS = 86_400_000;

export function dateAtDaysBefore(electionDate: string, daysBefore: number): string {
  const timestamp = new Date(`${electionDate}T12:00:00Z`).getTime() - daysBefore * DAY_MS;
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function daysBetween(start: string, end: string): number {
  return Math.max(
    0,
    Math.round(
      (new Date(`${end}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) / DAY_MS,
    ),
  );
}

export function phaseFromDaysRemaining(daysRemaining: number): GamePhase {
  if (daysRemaining > 240) return "pre_campaign";
  if (daysRemaining > 120) return "campaign";
  if (daysRemaining > 0) return "official_campaign";
  return "first_round";
}

export function advanceCampaignDate(
  currentDate: string,
  electionDate: string,
  decisionsRemaining: number,
  rng: RngState,
): { date: string; phase: GamePhase; rng: RngState } {
  const remainingDays = daysBetween(currentDate, electionDate);
  // Le passage au scrutin est piloté par le nombre cible de décisions dans le
  // moteur principal. Garder ici la campagne officielle évite un état sans carte
  // si le calendrier semi-aléatoire atteint T-1 un tour plus tôt.
  if (remainingDays <= 1) return { date: currentDate, phase: "official_campaign", rng };

  const idealStep = Math.max(1, Math.floor(remainingDays / Math.max(1, decisionsRemaining)));
  const [variation, nextRng] = randomInt(rng, -3, 3);
  const step = Math.max(1, Math.min(remainingDays - 1, idealStep + variation));
  const timestamp = new Date(`${currentDate}T12:00:00Z`).getTime() + step * DAY_MS;
  const date = new Date(timestamp).toISOString().slice(0, 10);
  return { date, phase: phaseFromDaysRemaining(daysBetween(date, electionDate)), rng: nextRng };
}

export function formatCampaignDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
