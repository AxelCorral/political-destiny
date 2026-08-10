/**
 * Audit électoral — BLOC A section 18 (PROMPT_CLAUDE_CODE_AUDIT_CREDIBILITE_ELECTORALE_COHERENCE.md).
 *
 * Scan global de toutes les chaînes visibles au joueur dans `gameContent`
 * (événements, partis, acteurs, méthodes, fins, entités, succès) à la
 * recherche de défauts typographiques français : apostrophes glissées
 * connues, apostrophe droite `'` mêlée à la typographique `'`, espaces
 * autour des apostrophes/guillemets, doubles espaces, guillemets anglais
 * résiduels. Complète (ne remplace pas)
 * `src/game/data/__tests__/textApostrophes.test.ts`, qui est la porte de
 * non-régression exécutée par `npm run test` ; ce script produit un rapport
 * CSV lisible pour l'audit, avec une allowlist explicite pour les
 * identifiants techniques et les cas où l'apostrophe droite est correcte
 * (aucun dans ce corpus au moment de l'audit, mais gardée pour éviter un
 * remplacement aveugle).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/electoral-coherence");

// Formes fautives confirmées lors du nettoyage précédent (commit
// "fix(ui): stop RaceBulletinScreen..." de cette même branche) : apostrophe
// d'élision totalement supprimée. Liste volontairement identique à celle de
// src/game/data/__tests__/textApostrophes.test.ts pour que les deux passes
// convergent ; « dune »/« dunes » reste exclu (homographe légitime).
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
  // Formes explicitement citées par le prompt d'audit (§18), au-delà de la
  // liste ci-dessus issue du nettoyage réel :
  "aujourdhui",
  "letat",
] as const;

const FRENCH_LETTER_CLASS = "A-Za-zÀ-ÖØ-öø-ÿ";
const GLUED_PATTERN = new RegExp(
  `(?<![${FRENCH_LETTER_CLASS}])(${GLUED_APOSTROPHE_TOKENS.join("|")})(?![${FRENCH_LETTER_CLASS}])`,
  "giu",
);

// Idéalement l'apostrophe typographique ’ partout ; l'apostrophe droite '
// n'est correcte que dans un identifiant technique (jamais un texte
// affiché), donc toute occurrence dans un texte affiché est un candidat.
const STRAIGHT_APOSTROPHE_PATTERN = /[A-Za-zÀ-ÖØ-öø-ÿ]'[A-Za-zÀ-ÖØ-öø-ÿ]/g;
const SPACE_AROUND_APOSTROPHE_PATTERN = /[A-Za-zÀ-ÖØ-öø-ÿ]\s['’]|['’]\s[A-Za-zÀ-ÖØ-öø-ÿ]/g;
const DOUBLE_SPACE_PATTERN = /[^\S\n]{2,}/g;
const ENGLISH_QUOTES_PATTERN = /["]/g;
// Prefixe isolé (précédé d'un début de chaîne/espace/ponctuation, jamais
// d'une lettre — sinon "après un" est faussement lu comme "s" + " un") suivi
// d'un mot qui commence par une voyelle et qui n'est PAS un mot français
// autonome légitime commençant ainsi (ex. "un", "une", "État" sont
// eux-mêmes des mots complets, donc "d un" n'est identifiable comme faute
// que par des cas concrets répertoriés du prompt : "l entre", "d accord").
const LITERAL_SPACED_ELISION_PATTERN =
  /(?<![A-Za-zÀ-ÖØ-öø-ÿ])(l|d|c|qu)\s+(entre-deux-tours|accord|abord|aujourdhui)(?![A-Za-zÀ-ÖØ-öø-ÿ])/giu;

interface Issue {
  path: string;
  field: string;
  rule: string;
  match: string;
  snippet: string;
}

// Identifiants/champs techniques jamais montrés au joueur — jamais scannés.
const ALLOWLISTED_FIELDS = new Set([
  "id",
  "eventId",
  "choiceId",
  "outcomeId",
  "partyId",
  "withPartyId",
  "actorId",
  "entityId",
  "key",
  "topic",
  "policyTopic",
  "url",
  "stat",
  "trait",
  "axis",
  "blocId",
  "regionId",
  "category",
  "kind",
  "role",
  "status",
  "strategy",
  "visibleTag",
  "rarity",
  "importance",
  "editorialSensitivity",
]);

const issues: Issue[] = [];

function checkString(path: string, field: string, value: string): void {
  if (ALLOWLISTED_FIELDS.has(field)) return;
  // Skip pure identifiers/URLs (no spaces, snake_case or URL-shaped) — these
  // are the "identifiants techniques" the prompt explicitly says not to touch.
  if (/^[a-z0-9_./:-]+$/i.test(value) && !value.includes(" ")) return;

  GLUED_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = GLUED_PATTERN.exec(value)) !== null) {
    const start = Math.max(0, match.index - 20);
    const end = Math.min(value.length, match.index + match[0].length + 20);
    issues.push({
      path,
      field,
      rule: "apostrophe_manquante",
      match: match[0],
      snippet: `…${value.slice(start, end)}…`,
    });
  }

  STRAIGHT_APOSTROPHE_PATTERN.lastIndex = 0;
  while ((match = STRAIGHT_APOSTROPHE_PATTERN.exec(value)) !== null) {
    const start = Math.max(0, match.index - 15);
    const end = Math.min(value.length, match.index + match[0].length + 15);
    issues.push({
      path,
      field,
      rule: "apostrophe_droite_au_lieu_de_typographique",
      match: match[0],
      snippet: `…${value.slice(start, end)}…`,
    });
  }

  SPACE_AROUND_APOSTROPHE_PATTERN.lastIndex = 0;
  while ((match = SPACE_AROUND_APOSTROPHE_PATTERN.exec(value)) !== null) {
    const start = Math.max(0, match.index - 15);
    const end = Math.min(value.length, match.index + match[0].length + 15);
    issues.push({
      path,
      field,
      rule: "espace_autour_apostrophe",
      match: match[0],
      snippet: `…${value.slice(start, end)}…`,
    });
  }

  LITERAL_SPACED_ELISION_PATTERN.lastIndex = 0;
  while ((match = LITERAL_SPACED_ELISION_PATTERN.exec(value)) !== null) {
    const start = Math.max(0, match.index - 15);
    const end = Math.min(value.length, match.index + match[0].length + 15);
    issues.push({
      path,
      field,
      rule: "elision_avec_espace",
      match: match[0],
      snippet: `…${value.slice(start, end)}…`,
    });
  }

  DOUBLE_SPACE_PATTERN.lastIndex = 0;
  while ((match = DOUBLE_SPACE_PATTERN.exec(value)) !== null) {
    issues.push({
      path,
      field,
      rule: "double_espace",
      match: JSON.stringify(match[0]),
      snippet: `…${value.slice(Math.max(0, match.index - 15), match.index + 15)}…`,
    });
  }

  ENGLISH_QUOTES_PATTERN.lastIndex = 0;
  while ((match = ENGLISH_QUOTES_PATTERN.exec(value)) !== null) {
    const start = Math.max(0, match.index - 15);
    const end = Math.min(value.length, match.index + 15);
    issues.push({
      path,
      field,
      rule: "guillemet_droit_anglais",
      match: '"',
      snippet: `…${value.slice(start, end)}…`,
    });
  }
}

function walk(value: unknown, path: string, field: string): void {
  if (typeof value === "string") {
    checkString(path, field, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, field));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      walk(nested, path ? `${path}.${key}` : key, key);
    }
  }
}

async function main() {
  walk(gameContent, "gameContent", "");

  await mkdir(OUT_DIR, { recursive: true });
  const header = ["path", "field", "rule", "match", "snippet"] as const;
  const csv = [
    header.join(","),
    ...issues.map((issue) =>
      header
        .map((key) => `"${String(issue[key]).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");
  await writeFile(resolve(OUT_DIR, "text-quality.csv"), `${csv}\n`, "utf8");

  const byRule = issues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue.rule] = (acc[issue.rule] ?? 0) + 1;
    return acc;
  }, {});

  console.log(
    JSON.stringify(
      {
        totalIssues: issues.length,
        byRule,
        sample: issues.slice(0, 15),
      },
      null,
      2,
    ),
  );
}

await main();
