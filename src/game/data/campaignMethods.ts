import type { CampaignMethod } from "@/game/types";

export const campaignMethods: CampaignMethod[] = [
  {
    id: "field_first",
    title: "Le terrain d’abord",
    description: "Quadriller le pays, recruter et transformer chaque étape en réseau durable.",
    symbol: "⌖",
    effects: [
      { kind: "party_stat", stat: "mobilization", delta: 7, label: "Mobilisation +7" },
      { kind: "party_stat", stat: "localStrength", delta: 6, label: "Implantation +6" },
      { kind: "party_stat", stat: "mediaPresence", delta: -3, label: "Présence médiatique −3" },
      { kind: "party_stat", stat: "finances", delta: -2, label: "Trésorerie −2" },
    ],
    traitEffects: { empathy: 4, endurance: 3 },
  },
  {
    id: "presidential",
    title: "Présidentiable",
    description: "Incarner la fonction, rassurer au-delà du socle et réduire les improvisations.",
    symbol: "◉",
    effects: [
      { kind: "party_stat", stat: "credibility", delta: 8, label: "Crédibilité +8" },
      { kind: "hidden_stat", stat: "transferability", delta: 6, visibility: "hidden" },
      { kind: "party_stat", stat: "momentum", delta: -2, label: "Spontanéité −2" },
    ],
    traitEffects: { authority: 4, discipline: 4, charisma: -2 },
  },
  {
    id: "rupture",
    title: "La rupture",
    description: "Occuper l’espace par des propositions tranchées et accepter la polarisation.",
    symbol: "⚡",
    effects: [
      { kind: "party_stat", stat: "mediaPresence", delta: 9, label: "Visibilité +9" },
      { kind: "party_stat", stat: "momentum", delta: 7, label: "Dynamique +7" },
      { kind: "party_stat", stat: "rejection", delta: 6, label: "Rejet +6" },
      { kind: "hidden_stat", stat: "scandalRisk", delta: 8, visibility: "hidden" },
    ],
    traitEffects: { charisma: 4, discipline: -3 },
  },
  {
    id: "digital",
    title: "La campagne numérique",
    description:
      "Tester vite, créer des formats partageables et viser les publics les plus volatils.",
    symbol: "⌁",
    effects: [
      { kind: "party_stat", stat: "mediaPresence", delta: 6, label: "Viralité +6" },
      { kind: "party_stat", stat: "awareness", delta: 5, label: "Notoriété +5" },
      { kind: "bloc_trust", blocId: "young_urban_graduates", delta: 7, label: "Jeunes diplômés +" },
      { kind: "bloc_trust", blocId: "young_precarious", delta: 5, label: "Jeunes précaires +" },
      { kind: "bloc_trust", blocId: "moderate_retirees", delta: -4, label: "Retraités modérés −" },
    ],
    traitEffects: { mediaSkill: 5, endurance: -2 },
  },
  {
    id: "union",
    title: "L’union avant tout",
    description: "Construire d’abord les compromis capables de rendre une majorité crédible.",
    symbol: "∞",
    effects: [
      { kind: "hidden_stat", stat: "transferability", delta: 9, visibility: "hidden" },
      { kind: "party_stat", stat: "cohesion", delta: 5, label: "Cohésion potentielle +5" },
      { kind: "hidden_stat", stat: "consistency", delta: -4, visibility: "hidden" },
      { kind: "party_stat", stat: "credibility", delta: 3, label: "Crédibilité +3" },
    ],
    traitEffects: { coalitionSkill: 7, tactics: 3 },
  },
];
