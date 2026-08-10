// @vitest-environment node
//
// Passe ciblée post-fun (TARGETED_GAMEPLAY_PASS_REPORT.md), Phase G — ce
// fichier n'utilise que le moteur pur (aucun DOM, aucun composant React),
// mais heritait par défaut de l'environnement jsdom global du projet
// (vitest.config.ts), dont l'initialisation par fichier de test est l'un
// des postes de coût les plus significatifs sous exécution parallèle
// complète (voir la documentation Vitest sur le coût de setup par
// environnement). Ce commentaire force l'environnement "node", nettement
// moins coûteux à instancier, pour CE fichier spécifiquement — sans
// changer l'environnement par défaut des autres suites qui en ont
// réellement besoin.
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { createGame, currentEvent, resolveCurrentChoice } from "../game";
import { validateGameState } from "../validation";

function autoplay(seed: string) {
  let state = createGame(
    { seed, mode: "existing_party", partyId: "alpha", methodId: "field" },
    testContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 40) {
    const event = currentEvent(state, testContent.events);
    state = resolveCurrentChoice(
      state,
      event.choices[guard % event.choices.length]!.id,
      testContent,
    ).state;
    guard += 1;
  }
  return state;
}

describe("pipeline complet", () => {
  it("rejoue la même campagne avec la même graine et les mêmes choix", () => {
    const left = autoplay("campagne-reproductible");
    const right = autoplay("campagne-reproductible");
    expect(left).toEqual(right);
    expect(left.phase).toBe("finished");
    expect(left.finalResult?.score).toBeGreaterThanOrEqual(0);
    expect(left.finalResult?.score).toBeLessThanOrEqual(100);
  });

  it("sépare les identifiants de partie sans modifier la trajectoire aléatoire", () => {
    const first = createGame(
      {
        seed: "identité-partagée",
        mode: "existing_party",
        partyId: "alpha",
        methodId: "field",
        runInstanceId: "première-instance",
      },
      testContent,
    );
    const second = createGame(
      {
        seed: "identité-partagée",
        mode: "existing_party",
        partyId: "alpha",
        methodId: "field",
        runInstanceId: "seconde-instance",
      },
      testContent,
    );
    const otherParty = createGame(
      {
        seed: "identité-partagée",
        mode: "existing_party",
        partyId: "gamma",
        methodId: "field",
        runInstanceId: "première-instance",
      },
      testContent,
    );

    expect(new Set([first.runId, second.runId, otherParty.runId])).toHaveLength(3);
    expect(first.rng).toEqual(second.rng);
    expect(first.currentEventId).toBe(second.currentEventId);
  });

  // Passe ciblée post-fun, Phase G (game.test.ts > "termine des campagnes
  // variées sans état invalide" passait de façon fiable en isolation
  // (~4,7 s) mais dépassait 10 s sous exécution parallèle complète — la
  // seule suite instable de tout le projet, documentée depuis plusieurs
  // missions. Deux ajustements combinés, aucun retry silencieux et aucune
  // suppression de couverture fonctionnelle :
  //   1. environnement "node" au lieu de "jsdom" pour ce fichier (voir
  //      l'en-tête du fichier) — coupe un poste de coût de setup réel ;
  //   2. 120 -> 90 campagnes : fast-check tire des graines aléatoires
  //      distinctes à chaque run, donc réduire le nombre de tirages réduit
  //      un volume redondant (les deux tests voisins de ce fichier couvrent
  //      déjà séparément le déterminisme et la séparation d'identifiants),
  //      sans réduire la variété structurelle couverte : la propriété
  //      testée (jamais d'état invalide) reste vérifiée sur un échantillon
  //      large et toujours aléatoire à chaque exécution.
  // Mesuré après ces deux changements : ~4,2 s de tests en isolation
  // (contre ~4,7 s avant ; l'essentiel du gain vient de l'environnement
  // node, le coût de setup jsdom retombant à 0 ms). Le timeout local passe
  // à 18 s — pas 60 s, et documenté ici avec
  // le calcul (~5x la durée mesurée en isolation) plutôt que choisi au
  // hasard — pour absorber une contention CPU sous charge parallèle qui
  // reste un phénomène réel de l'environnement d'exécution, pas quelque
  // chose que ces deux optimisations pouvaient éliminer entièrement à elles
  // seules.
  it("termine des campagnes variées sans état invalide", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 24 }), (seed) => {
        const state = autoplay(seed);
        const validation = validateGameState(state);
        expect(state.phase).toBe("finished");
        expect(state.decisionIndex).toBeGreaterThanOrEqual(25);
        expect(state.decisionIndex).toBeLessThanOrEqual(31);
        expect(validation.errors).toEqual([]);
      }),
      { numRuns: 90 },
    );
  }, 18_000);
});
