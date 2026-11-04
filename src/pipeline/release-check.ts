import type { ExtractedData, ProposalsFile } from "../data/schema";

/**
 * Problems that must block a public release. Pure, so it is unit tested;
 * the CLI only reads files and prints the result.
 */
export function releaseProblems(
  data: ExtractedData,
  proposals: ProposalsFile,
  pdfSha256: string,
  currentPromptSha256: string,
): string[] {
  const problems: string[] = [];
  const { provenance } = proposals;
  if (provenance.kind !== "model") {
    problems.push("Proposals are a development fixture, not model output. Run `npm run propose`.");
  }
  if (data.source.sha256 !== pdfSha256) {
    problems.push("data/extracted.json was built from a different PDF. Run `npm run extract`.");
  }
  if (provenance.sourceSha256 !== pdfSha256) {
    problems.push("Proposals were generated from a different PDF. Run `npm run propose`.");
  }
  if (provenance.kind === "model" && provenance.promptTemplateSha256 !== currentPromptSha256) {
    problems.push("The prompt changed since the proposals were generated. Run `npm run propose`.");
  }
  const expected = data.exercise.paragraphs.map((p) => p.id);
  const actual = proposals.proposals.map((p) => p.paragraphId);
  const missing = expected.filter((id) => !actual.includes(id));
  const extra = actual.filter((id) => !expected.includes(id));
  if (missing.length > 0) problems.push(`No proposal for: ${missing.join(", ")}.`);
  if (extra.length > 0) problems.push(`Proposals for unknown paragraphs: ${extra.join(", ")}.`);
  if (new Set(actual).size !== actual.length)
    problems.push("Some paragraphs have more than one proposal.");
  return problems;
}
