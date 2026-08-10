import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";

/**
 * Nettoyage des apostrophes — cf. correctif RaceBulletinScreen /
 * nettoyage apostrophes (2026-08-10). Une passe d'autorat antérieure avait
 * généré cinq fichiers d'événements (endgame.ts, internal.ts,
 * partiesLeft.ts, alliances.ts, world.ts) avec l'apostrophe d'élision
 * entièrement supprimée sur certains mots ("d'action" → "daction",
 * "l'équipe" → "léquipe", "qu'il" → "quil", etc.), au lieu d'être
 * uniformisée en apostrophe typographique française ’. Cette liste couvre
 * chaque forme fautive réellement rencontrée et corrigée, pour empêcher
 * qu'elle ne soit réintroduite (copier-coller d'un brouillon, régénération
 * partielle, etc.).
 *
 * "dune" / "dunes" (dune de sable) est volontairement exclu : c'est un mot
 * français valide, homographe de la faute "dune" pour "d'une", donc pas
 * détectable sans faux positif par une simple liste de mots.
 */
const GLUED_APOSTROPHE_TOKENS = [
  "quil",
  "quils",
  "quun",
  "quune",
  "naura",
  "nest",
  "dun",
  "dabord",
  "daccord",
  "dachat",
  "daction",
  "dadhésion",
  "damendement",
  "dannoncer",
  "dappliquer",
  "dariane",
  "dautres",
  "davance",
  "den",
  "dengagements",
  "dentre",
  "dexpliquer",
  "dhéritier",
  "dici",
  "dimpôt",
  "dincertitude",
  "dinscription",
  "dinstitutions",
  "dintérêts",
  "délecteurs",
  "dêtre",
  "labsence",
  "labstention",
  "laction",
  "ladresse",
  "ladversaire",
  "lagenda",
  "laide",
  "lalliance",
  "lanalyse",
  "lannexe",
  "lannonce",
  "lapprécie",
  "larbitrage",
  "largument",
  "lattente",
  "lautomne",
  "lautre",
  "lavance",
  "leurope",
  "limage",
  "limpression",
  "linscription",
  "lintégralité",
  "lintérim",
  "lopération",
  "lun",
  "lunion",
  "lunivers",
  "lurgence",
  "léconomie",
  "lélysée",
  "létat",
  "léchange",
  "léchec",
  "lécologie",
  "lélection",
  "lélimination",
  "léquipe",
  "létendue",
  "lévaluation",
  "lentre",
  "laprès",
  "sappliquera",
  "sappuie",
  "saméliore",
  "jusquau",
  "jusquà",
] as const;

// Unicode-aware `\b` treats accented letters as non-word characters, which
// produces spurious mid-word boundaries (e.g. inside "désaccord"). An
// explicit accented-letter class avoids that.
const FRENCH_LETTER_CLASS = "A-Za-zÀ-ÖØ-öø-ÿ";
const TOKEN_PATTERN = new RegExp(
  `(?<![${FRENCH_LETTER_CLASS}])(${GLUED_APOSTROPHE_TOKENS.join("|")})(?![${FRENCH_LETTER_CLASS}])`,
  "giu",
);

interface Violation {
  path: string;
  token: string;
  snippet: string;
}

function scanForGluedApostrophes(value: unknown, path: string, violations: Violation[]): void {
  if (typeof value === "string") {
    TOKEN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TOKEN_PATTERN.exec(value)) !== null) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(value.length, match.index + match[0].length + 20);
      violations.push({
        path,
        token: match[0],
        snippet: `…${value.slice(start, end)}…`,
      });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForGluedApostrophes(item, `${path}[${index}]`, violations));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      scanForGluedApostrophes(nested, path ? `${path}.${key}` : key, violations);
    }
  }
}

describe("nettoyage des apostrophes — contenu de production", () => {
  it("ne contient aucun mot d'élision glué connu (qu'il, l'équipe, d'action, …)", () => {
    const violations: Violation[] = [];
    scanForGluedApostrophes(gameContent, "gameContent", violations);

    if (violations.length > 0) {
      const report = violations
        .map((violation) => `  - ${violation.path}: "${violation.token}" dans ${violation.snippet}`)
        .join("\n");
      throw new Error(`Apostrophes manquantes détectées :\n${report}`);
    }

    expect(violations).toEqual([]);
  });
});
