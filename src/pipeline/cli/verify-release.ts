import { readFile } from "node:fs/promises";
import { sha256File } from "../pdf-text";
import { promptTemplateSha256 } from "../propose";
import { releaseProblems } from "../release-check";
import { extractedSchema, proposalsFileSchema } from "../schema";
import { PATHS } from "./paths";

const data = extractedSchema.parse(JSON.parse(await readFile(PATHS.extracted, "utf8")));
const proposals = proposalsFileSchema.parse(JSON.parse(await readFile(PATHS.proposals, "utf8")));
const problems = releaseProblems(
  data,
  proposals,
  await sha256File(PATHS.sourcePdf),
  promptTemplateSha256(),
);

if (problems.length > 0) {
  console.error("Not ready to release:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `Ready to release: ${proposals.proposals.length} proposals from ${proposals.provenance.model}.`,
);
