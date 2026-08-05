import type {
  EventCategory,
  EventChoice,
  EventRarity,
  GameEffect,
  GameEventDefinition,
  GamePhase,
  Condition,
} from "@/game/types";

export interface ScenarioSeed {
  id: string;
  title: string;
  summary: string;
  category: EventCategory;
  prudent: string;
  bold: string;
  collective?: string;
  phaseWeights?: Partial<Record<GamePhase, number>>;
  rarity?: EventRarity;
  baseWeight?: number;
  minDecisionIndex?: number;
  maxDecisionIndex?: number;
  eligibleParties?: string[];
  excludedParties?: string[];
  cooldown?: number;
  oncePerRun?: boolean;
  sensitiveActorIds?: string[];
  sensitiveTags?: Array<
    "crime" | "corruption" | "fraud" | "health" | "addiction" | "family" | "violence"
  >;
  topic?: string;
  delayed?: boolean;
  enqueueOnBold?: string[];
  setFlagsOnBold?: Record<string, boolean | number | string>;
  eligibility?: Condition[];
  successEffects?: GameEffect[];
  setbackEffects?: GameEffect[];
}

const DEFAULT_PHASES: Partial<Record<GamePhase, number>> = {
  pre_campaign: 1,
  campaign: 1.2,
  official_campaign: 1.35,
};

function atLeastWords(text: string, minimum: number): string {
  let result = text.trim();
  const supplement =
    "Cette décision met à l’épreuve votre méthode, votre cohérence et la capacité de l’équipe fictive à rester unie.";
  while (result.split(/\s+/u).length < minimum) result = `${result} ${supplement}`;
  return result;
}

function categoryEffects(category: EventCategory): {
  success: GameEffect[];
  setback: GameEffect[];
} {
  switch (category) {
    case "campaign":
      return {
        success: [
          { kind: "party_stat", stat: "mobilization", delta: 3, label: "Mobilisation +3" },
          { kind: "party_stat", stat: "popularity", delta: 2, label: "Popularité +2" },
        ],
        setback: [
          { kind: "party_stat", stat: "finances", delta: -3, label: "Trésorerie −3" },
          { kind: "party_stat", stat: "momentum", delta: -2, label: "Dynamique −2" },
        ],
      };
    case "media":
      return {
        success: [
          { kind: "party_stat", stat: "mediaPresence", delta: 4, label: "Présence médiatique +4" },
          { kind: "party_stat", stat: "popularity", delta: 2, label: "Popularité +2" },
        ],
        setback: [
          { kind: "party_stat", stat: "rejection", delta: 3, label: "Rejet +3" },
          { kind: "party_stat", stat: "credibility", delta: -2, label: "Crédibilité −2" },
        ],
      };
    case "debate":
      return {
        success: [
          { kind: "party_stat", stat: "credibility", delta: 4, label: "Crédibilité +4" },
          { kind: "party_stat", stat: "momentum", delta: 4, label: "Dynamique +4" },
        ],
        setback: [
          { kind: "party_stat", stat: "popularity", delta: -3, label: "Popularité −3" },
          { kind: "hidden_stat", stat: "fatigue", delta: 3, visibility: "hidden" },
        ],
      };
    case "program":
      return {
        success: [
          { kind: "party_stat", stat: "credibility", delta: 3, label: "Crédibilité +3" },
          { kind: "hidden_stat", stat: "consistency", delta: 3, visibility: "hidden" },
        ],
        setback: [
          { kind: "party_stat", stat: "cohesion", delta: -2, label: "Cohésion −2" },
          { kind: "hidden_stat", stat: "consistency", delta: -4, visibility: "hidden" },
        ],
      };
    case "internal":
    case "party":
      return {
        success: [
          { kind: "party_stat", stat: "cohesion", delta: 4, label: "Cohésion +4" },
          { kind: "party_stat", stat: "members", delta: 2_000, label: "Adhérents +2 000" },
        ],
        setback: [
          { kind: "party_stat", stat: "cohesion", delta: -5, label: "Cohésion −5" },
          { kind: "hidden_stat", stat: "rivalAmbition", delta: 5, visibility: "hidden" },
        ],
      };
    case "alliance":
    case "between_rounds":
      return {
        success: [
          { kind: "hidden_stat", stat: "transferability", delta: 5, visibility: "hidden" },
          { kind: "party_stat", stat: "credibility", delta: 2, label: "Crédibilité +2" },
        ],
        setback: [
          { kind: "party_stat", stat: "cohesion", delta: -4, label: "Cohésion −4" },
          { kind: "party_stat", stat: "rejection", delta: 2, label: "Rejet +2" },
        ],
      };
    case "world":
      return {
        success: [
          { kind: "party_stat", stat: "credibility", delta: 3, label: "Crédibilité +3" },
          { kind: "party_stat", stat: "popularity", delta: 1, label: "Popularité +1" },
        ],
        setback: [
          { kind: "party_stat", stat: "credibility", delta: -3, label: "Crédibilité −3" },
          { kind: "hidden_stat", stat: "fatigue", delta: 4, visibility: "hidden" },
        ],
      };
    case "scandal":
      return {
        success: [
          { kind: "party_stat", stat: "credibility", delta: 3, label: "Intégrité perçue +3" },
          { kind: "party_stat", stat: "cohesion", delta: 1, label: "Cohésion +1" },
        ],
        setback: [
          { kind: "party_stat", stat: "credibility", delta: -5, label: "Crédibilité −5" },
          { kind: "party_stat", stat: "rejection", delta: 4, label: "Rejet +4" },
        ],
      };
    case "rare":
      return {
        success: [
          { kind: "party_stat", stat: "momentum", delta: 6, label: "Dynamique +6" },
          { kind: "party_stat", stat: "mediaPresence", delta: 5, label: "Présence médiatique +5" },
        ],
        setback: [
          { kind: "party_stat", stat: "rejection", delta: 4, label: "Rejet +4" },
          { kind: "party_stat", stat: "cohesion", delta: -3, label: "Cohésion −3" },
        ],
      };
    case "government":
      return {
        success: [
          { kind: "party_stat", stat: "credibility", delta: 4, label: "Autorité de départ +4" },
          { kind: "party_stat", stat: "cohesion", delta: 3, label: "Cohésion +3" },
        ],
        setback: [
          { kind: "party_stat", stat: "cohesion", delta: -4, label: "Cohésion −4" },
          { kind: "party_stat", stat: "popularity", delta: -2, label: "Popularité −2" },
        ],
      };
  }
}

function narrative(seed: ScenarioSeed, favorable: boolean, bold: boolean): string {
  if (favorable && bold) {
    return `Votre pari sur « ${seed.title.toLocaleLowerCase("fr")} » surprend jusque dans votre équipe. Le récit s’impose dans l’actualité et ouvre un espace que vos adversaires fictifs n’avaient pas anticipé.`;
  }
  if (favorable) {
    return `Votre réponse à cette séquence est jugée solide et proportionnée. Elle ne renverse pas seule la campagne, mais améliore concrètement votre position auprès des publics les plus attentifs.`;
  }
  if (bold) {
    return `Le geste devait reprendre l’initiative, mais il brouille votre intention. Les explications suivantes occupent l’espace et offrent à plusieurs adversaires fictifs un angle d’attaque inattendu.`;
  }
  return `La prudence limite les dégâts sans clore la séquence. Une partie de l’opinion y voit de l’hésitation et votre équipe doit consacrer du temps à rétablir un message clair.`;
}

function choicesFor(seed: ScenarioSeed): EventChoice[] {
  const defaults = categoryEffects(seed.category);
  const success = seed.successEffects ?? defaults.success;
  const setback = seed.setbackEffects ?? defaults.setback;
  const statement = seed.topic
    ? (label: string) => ({ topic: seed.topic!, text: label })
    : () => undefined;

  const choices: EventChoice[] = [
    {
      id: "prudent_response",
      label: seed.prudent,
      visibleTag: "PRUDENT",
      outcomeGroups: [
        {
          id: "measured_success",
          baseWeight: 3.4,
          modifiers: [
            { source: "trait", key: "discipline", coefficient: 0.7 },
            { source: "party_stat", key: "credibility", coefficient: 0.45 },
          ],
          title: "Une réponse qui rassure",
          publicNarrative: narrative(seed, true, false),
          effects: success,
        },
        {
          id: "cautious_setback",
          baseWeight: 1.6,
          modifiers: [{ source: "party_stat", key: "momentum", coefficient: -0.35 }],
          title: "La prudence ressemble à une hésitation",
          publicNarrative: narrative(seed, false, false),
          effects: setback,
        },
      ],
      ...(statement(seed.prudent) ? { statement: statement(seed.prudent) } : {}),
    },
    {
      id: "risk_breakthrough",
      label: seed.bold,
      visibleTag: "RISQUÉ",
      outcomeGroups: [
        {
          id: "viral_success",
          baseWeight: 2.25,
          modifiers: [
            { source: "trait", key: "charisma", coefficient: 0.75 },
            { source: "party_stat", key: "mediaPresence", coefficient: 0.35 },
          ],
          title: "Le pari crée une ouverture",
          publicNarrative: narrative(seed, true, true),
          effects: [
            ...success,
            { kind: "party_stat", stat: "momentum", delta: 2, label: "Dynamique +2" },
          ],
          ...(seed.delayed
            ? {
                delayedEffects: [
                  {
                    afterDecisions: 2,
                    effects: [
                      {
                        kind: "party_stat" as const,
                        stat: "credibility" as const,
                        delta: 1,
                        label: "Le pari reste crédible",
                      },
                    ],
                    narrative:
                      "Deux séquences plus tard, cette décision continue d’être citée comme un moment de clarté.",
                  },
                ],
              }
            : {}),
          ...(seed.enqueueOnBold ? { enqueueEventIds: seed.enqueueOnBold } : {}),
          ...(seed.setFlagsOnBold ? { setFlags: seed.setFlagsOnBold } : {}),
        },
        {
          id: "risk_setback",
          baseWeight: 2.1,
          modifiers: [
            { source: "trait", key: "discipline", coefficient: -0.55 },
            { source: "party_stat", key: "rejection", coefficient: 0.45 },
          ],
          title: "Le pari se retourne",
          publicNarrative: narrative(seed, false, true),
          effects: [
            ...setback,
            { kind: "hidden_stat", stat: "fatigue", delta: 2, visibility: "hidden" },
          ],
        },
      ],
      ...(statement(seed.bold) ? { statement: statement(seed.bold) } : {}),
    },
  ];

  if (seed.collective) {
    choices.push({
      id: "collective_path",
      label: seed.collective,
      visibleTag: "RASSEMBLEUR",
      outcomeGroups: [
        {
          id: "collective_success",
          baseWeight: 3,
          modifiers: [
            { source: "trait", key: "coalitionSkill", coefficient: 0.8 },
            { source: "party_stat", key: "cohesion", coefficient: 0.35 },
          ],
          title: "Le collectif tient",
          publicNarrative: `La méthode collective ralentit l’annonce, mais elle élargit son soutien. Plusieurs voix fictives du mouvement défendent désormais la même ligne sans donner l’impression de réciter un compromis vide.`,
          effects: [
            ...success.slice(0, 1),
            { kind: "party_stat", stat: "cohesion", delta: 3, label: "Cohésion +3" },
          ],
        },
        {
          id: "collective_blur",
          baseWeight: 1.4,
          modifiers: [{ source: "trait", key: "authority", coefficient: -0.35 }],
          title: "Le compromis devient illisible",
          publicNarrative:
            "Les consultations multiplient les nuances jusqu’à masquer votre décision. La campagne évite la rupture, mais perd une occasion de fixer clairement le débat.",
          effects: [
            ...setback.slice(0, 1),
            { kind: "party_stat", stat: "momentum", delta: -1, label: "Dynamique −1" },
          ],
        },
      ],
      ...(statement(seed.collective) ? { statement: statement(seed.collective) } : {}),
    });
  }
  return choices;
}

export function makeScenario(seed: ScenarioSeed): GameEventDefinition {
  const phaseWeights =
    seed.phaseWeights ??
    (seed.category === "between_rounds"
      ? { between_rounds: 1 }
      : seed.category === "government"
        ? { government_epilogue: 1 }
        : DEFAULT_PHASES);
  return {
    id: seed.id,
    title: seed.title,
    category: seed.category,
    summary: atLeastWords(seed.summary, 25),
    phaseWeights,
    rarity: seed.rarity ?? "common",
    baseWeight: seed.baseWeight ?? 4,
    ...(seed.minDecisionIndex !== undefined ? { minDecisionIndex: seed.minDecisionIndex } : {}),
    ...(seed.maxDecisionIndex !== undefined ? { maxDecisionIndex: seed.maxDecisionIndex } : {}),
    ...(seed.eligibleParties ? { eligibleParties: seed.eligibleParties } : {}),
    ...(seed.excludedParties ? { excludedParties: seed.excludedParties } : {}),
    eligibility: seed.eligibility ?? [],
    cooldown: seed.cooldown ?? 4,
    oncePerRun: seed.oncePerRun ?? true,
    ...(seed.category === "world" ? { worldImpact: true } : {}),
    ...(seed.sensitiveActorIds?.length
      ? {
          sensitiveContent: {
            tags: seed.sensitiveTags ?? ["fraud"],
            actorIds: seed.sensitiveActorIds,
            treatment: "fictional_only" as const,
          },
        }
      : {}),
    choices: choicesFor(seed),
  };
}
