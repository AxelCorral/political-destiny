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
