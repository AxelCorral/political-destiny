/**
 * Audit électoral — BLOC A section 13-14 (PROMPT_CLAUDE_CODE_AUDIT_CREDIBILITE_ELECTORALE_COHERENCE.md).
 *
 * Pour chaque événement éligible en second tour (eligibility contient
 * {kind:"qualified", value:true}) et lié à un parti joueur précis
 * (eligibleParties), recense tout parti tiers référencé explicitement par un
 * effet (alliance, party_relation) et vérifie si l'event exclut déjà le cas
 * où ce tiers est en réalité l'adversaire qualifié. Aucune condition
 * d'éligibilité de ce type n'existe actuellement dans le moteur (cf.
 * src/game/types Condition), donc tout hit est un bug de cohérence
 * contextuelle potentiel (ex. proposer une alliance avec Horizons alors
 * qu'Horizons est le finaliste adverse).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import type { Condition, GameEffect, GameEventDefinition } from "../../src/game/types/index";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/electoral-coherence");

const PARTY_IDS = new Set(gameContent.parties.map((p) => p.id));

function isQualifiedEligible(conditions: Condition[] | undefined): boolean {
  return (conditions ?? []).some((c) => c.kind === "qualified" && c.value === true);
}

function hasOpponentExclusionGuard(conditions: Condition[] | undefined): boolean {
  // No such condition kind exists yet (checked against src/game/types
  // Condition union) — kept as a named check so this flips automatically if
  // BLOC B adds one.
  return (conditions ?? []).some(
    (c) => (c as { kind: string }).kind === "party_not_opponent",
  );
}

function referencedThirdParties(event: GameEventDefinition): Set<string> {
  const referenced = new Set<string>();
  const scanEffects = (effects: GameEffect[] | undefined) => {
    for (const effect of effects ?? []) {
      if (effect.kind === "alliance" && PARTY_IDS.has(effect.withPartyId)) {
        referenced.add(effect.withPartyId);
      }
      if (effect.kind === "party_relation") {
        if (PARTY_IDS.has(effect.partyId) && effect.partyId !== "player")
          referenced.add(effect.partyId);
        if (PARTY_IDS.has(effect.withPartyId) && effect.withPartyId !== "player")
          referenced.add(effect.withPartyId);
      }
    }
  };
  for (const choice of event.choices) {
    for (const group of choice.outcomeGroups ?? []) {
      scanEffects(group.effects);
    }
  }
  return referenced;
}

interface Row {
  eventId: string;
  eventTitle: string;
  eligibleParties: string;
  phase: string;
  referencedThirdParties: string;
  hasOpponentExclusionGuard: boolean;
  coherent: boolean;
  reason: string;
}

const rows: Row[] = [];

for (const event of gameContent.events) {
  if (!isQualifiedEligible(event.eligibility)) continue;
  const eligibleParties = event.eligibleParties ?? [];
  const referenced = referencedThirdParties(event);
  // Remove the player's own future opponent's *own* party from consideration
  // is not possible statically (it depends on the run), which is exactly the
  // point: any reference to a party outside {this event's own eligible
  // party} is a latent second-round opponent unless excluded.
  const foreignReferences = [...referenced].filter((id) => !eligibleParties.includes(id));
  if (foreignReferences.length === 0) continue;

  const guarded = hasOpponentExclusionGuard(event.eligibility);
  rows.push({
    eventId: event.id,
    eventTitle: event.title,
    eligibleParties: eligibleParties.join("|") || "(any)",
    phase: event.category,
    referencedThirdParties: foreignReferences.join("|"),
    hasOpponentExclusionGuard: guarded,
    coherent: guarded,
    reason: guarded
      ? "eligibility exclut déjà le cas adversaire"
      : `référence ${foreignReferences.join(", ")} sans exclure le cas où ce parti est l'adversaire qualifié`,
  });
}

await mkdir(OUT_DIR, { recursive: true });
const header = Object.keys(rows[0] ?? {
  eventId: "",
  eventTitle: "",
  eligibleParties: "",
  phase: "",
  referencedThirdParties: "",
  hasOpponentExclusionGuard: "",
  coherent: "",
  reason: "",
});
const csv = [
  header.join(","),
  ...rows.map((row) =>
    header
      .map((key) => {
        const value = String((row as unknown as Record<string, unknown>)[key] ?? "");
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(","),
  ),
].join("\n");
await writeFile(resolve(OUT_DIR, "runoff-context-matrix.csv"), `${csv}\n`, "utf8");

const incoherentCount = rows.filter((r) => !r.coherent).length;
console.log(
  JSON.stringify(
    {
      totalRunoffPartyEvents: gameContent.events.filter(
        (e) => isQualifiedEligible(e.eligibility) && (e.eligibleParties ?? []).length > 0,
      ).length,
      eventsReferencingThirdParty: rows.length,
      incoherentEvents: incoherentCount,
      byEvent: rows.map((r) => ({
        eventId: r.eventId,
        eligibleParties: r.eligibleParties,
        referencedThirdParties: r.referencedThirdParties,
        coherent: r.coherent,
      })),
    },
    null,
    2,
  ),
);
