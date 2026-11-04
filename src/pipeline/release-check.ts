import type { ExtractedData, ProposalsFile } from "../data/schema";

export interface ReleaseFingerprints {
  pdfSha256: string;
  promptSha256: string;
  guideSha256: string;
}

/**
 * Problems that must block a public release. Pure, so it is unit tested;
 * the CLI only reads files and prints the result. This is a process control
 * on the deploy workflow, not tamper-proofing.
 */
export function releaseProblems(
  data: ExtractedData,
  proposals: ProposalsFile,
  current: ReleaseFingerprints,
): string[] {
  return [...provenanceProblems(data, proposals, current), ...coverageProblems(data, proposals)];
}

function provenanceProblems(
  data: ExtractedData,
  { provenance }: ProposalsFile,
  current: ReleaseFingerprints,
): string[] {
  const problems: string[] = [];
  const rerun = "Run `npm run propose`.";
  if (provenance.kind !== "model") {
    problems.push(`Proposals are a development fixture, not model output. ${rerun}`);
  }
  if (data.source.sha256 !== current.pdfSha256) {
    problems.push("data/extracted.json was built from a different PDF. Run `npm run extract`.");
  }
  if (provenance.sourceSha256 !== current.pdfSha256) {
    problems.push(`Proposals were generated from a different PDF. ${rerun}`);
  }
  if (provenance.kind !== "model") return problems;
  if (!provenance.model) problems.push("Proposals don't record which model made them.");
  if (provenance.promptTemplateSha256 !== current.promptSha256) {
    problems.push(`The prompt changed since the proposals were generated. ${rerun}`);
  }
  if (provenance.guideSha256 !== current.guideSha256) {
    problems.push(`The guide's rules changed since the proposals were generated. ${rerun}`);
  }
  return problems;
}

function coverageProblems(data: ExtractedData, { proposals }: ProposalsFile): string[] {
  const problems: string[] = [];
  const expected = data.exercise.paragraphs.map((p) => p.id);
  const actual = proposals.map((p) => p.paragraphId);
  const missing = expected.filter((id) => !actual.includes(id));
  const extra = actual.filter((id) => !expected.includes(id));
  const known = new Set(data.guide.rules.map((r) => r.id));
  const unknown = [
    ...new Set(proposals.flatMap((p) => p.citedRuleIds).filter((id) => !known.has(id))),
  ];
  if (missing.length > 0) problems.push(`No proposal for: ${missing.join(", ")}.`);
  if (extra.length > 0) problems.push(`Proposals for unknown paragraphs: ${extra.join(", ")}.`);
  if (new Set(actual).size !== actual.length) {
    problems.push("Some paragraphs have more than one proposal.");
  }
  if (unknown.length > 0)
    problems.push(`Proposals cite rules not in the guide: ${unknown.join(", ")}.`);
  return problems;
}
