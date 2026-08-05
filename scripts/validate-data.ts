import { gameContent } from "../src/game/data/index";
import { validateGameContent } from "../src/game/data/validation";

const report = validateGameContent(gameContent);

console.log(
  `Données : ${report.stats.parties} partis, ${report.stats.actors} acteurs fictifs/contextuels, ${report.stats.events} événements, ${report.stats.achievements} succès.`,
);
console.log(`Catégories : ${JSON.stringify(report.stats.categories)}`);
console.log(`Rares ou secrets : ${report.stats.rareOrSecret}`);

for (const warning of report.warnings) console.warn(`AVERTISSEMENT: ${warning}`);
if (!report.valid) {
  for (const error of report.errors) console.error(`ERREUR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("Validation structurelle et éditoriale réussie.");
}
