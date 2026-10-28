// Prints Sidekick's own estimated spending record. Makes no network calls and reads no keys.
// Usage: npm run spend
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.env.SIDEKICK_DATA_DIR || ".sidekick-data";
const file = join(dir, "spend-ledger.json");

let ledger;
try {
  ledger = JSON.parse(readFileSync(file, "utf8"));
} catch {
  console.log(`No spending record yet (${file}). That means no AI calls have been made.`);
  process.exit(0);
}

console.log("Sidekick's ESTIMATED spending (not your real OpenAI bill; check platform.openai.com):");
console.log(JSON.stringify(ledger, null, 2));
