import type { EventCategory, PrimaryStatKey, RegionId } from "@/game/types";

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  campaign: "Campagne",
  media: "Médias",
  debate: "Débat",
  program: "Programme",
  internal: "Vie interne",
  alliance: "Alliance",
  world: "Actualité",
  scandal: "Crise",
  party: "Parti",
  rare: "Moment rare",
  between_rounds: "Entre-deux-tours",
  government: "Premiers jours",
};

export const STAT_LABELS: Record<PrimaryStatKey, string> = {
  polling: "Intentions de vote",
  popularity: "Popularité",
  mobilization: "Mobilisation",
  finances: "Finances",
  credibility: "Crédibilité",
  cohesion: "Cohésion",
};

export const REGION_LABELS: Record<RegionId, string> = {
  ile_de_france: "Île-de-France",
  north: "Nord",
  east: "Est",
  west: "Ouest",
  south_west: "Sud-Ouest",
  south_east: "Sud-Est",
  central: "Centre",
  overseas: "Outre-mer",
};

export function formatCampaignDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} %`;
}

export function formatInteger(value: number): string {
  return Math.round(value).toLocaleString("fr-FR");
}

export function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T12:00:00Z`).getTime();
  const end = new Date(`${to}T12:00:00Z`).getTime();
  return Math.max(0, Math.ceil((end - start) / 86_400_000));
}

export interface QualificationGap {
  /** true when the player currently sits in a qualifying spot (top 2). */
  qualifying: boolean;
  /** Percentage-point gap: margin held over 3rd place if qualifying, deficit to 2nd place otherwise. Always >= 0. */
  points: number;
  /** Id of the party the gap is measured against (the closest threat, or the closest target). */
  againstPartyId: string | undefined;
}

/**
 * P3 (fun improvement mission — tension du dernier tiers, section 11 du
 * prompt) : le classement brut ne dit rien sur la distance réelle à la
 * qualification, ce qui surinterprète les micro-mouvements de sondage en
 * tout début de partie (AUDIT_FUN_REJOUABILITE.md §6). Cette fonction pure
 * calcule l'écart avec la frontière de qualification (2 places) plutôt que
 * de se contenter d'un rang brut — préférée à une refonte du moteur
 * électoral lui-même, conformément à l'approche recommandée par le prompt.
 */
export function computeQualificationGap(
  results: Record<string, number>,
  playerPartyId: string,
): QualificationGap {
  const ranking = Object.entries(results)
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const playerIndex = ranking.findIndex(([id]) => id === playerPartyId);
  if (playerIndex === -1) return { qualifying: false, points: 0, againstPartyId: undefined };
  const playerValue = ranking[playerIndex]![1];
  if (playerIndex < 2) {
    const chaser = ranking[2];
    return {
      qualifying: true,
      points: chaser ? Math.max(0, Number((playerValue - chaser[1]).toFixed(1))) : playerValue,
      againstPartyId: chaser?.[0],
    };
  }
  const secondPlace = ranking[1];
  return {
    qualifying: false,
    points: secondPlace ? Math.max(0, Number((secondPlace[1] - playerValue).toFixed(1))) : 0,
    againstPartyId: secondPlace?.[0],
  };
}
