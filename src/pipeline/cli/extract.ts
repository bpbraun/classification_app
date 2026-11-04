import { writeFile } from "node:fs/promises";
import { extractFromItems, PAGES } from "../extract";
import { readTextItems, sha256File } from "../pdf-text";
import { extractedSchema } from "../schema";
import { PATHS } from "./paths";

const sha = await sha256File(PATHS.sourcePdf);
const items = await readTextItems(PATHS.sourcePdf, Object.values(PAGES));
const data = extractedSchema.parse(extractFromItems(items, sha));
await writeFile(PATHS.extracted, JSON.stringify(data, null, 2) + "\n");

console.log(`Wrote ${PATHS.extracted}`);
console.log(`  ${data.guide.rules.length} rules from "${data.guide.title}"`);
console.log(`  ${data.exercise.paragraphs.length} exercise portions aligned to ISOO's answer key`);
console.log(`  Source SHA-256 ${sha}`);
