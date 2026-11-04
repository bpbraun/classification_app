import { describe, expect, it } from "vitest";
import { releaseProblems } from "../src/pipeline/release-check";
import type { ExtractedData, ProposalsFile } from "../src/data/schema";
import { threeLittlePigs } from "./fixtures/three-little-pigs";

const SHA = "a".repeat(64);
const PROMPT = "b".repeat(64);
const GUIDE = "e".repeat(64);
const current = (
  o: Partial<{ pdfSha256: string; promptSha256: string; guideSha256: string }> = {},
) => ({
  pdfSha256: SHA,
  promptSha256: PROMPT,
  guideSha256: GUIDE,
  ...o,
});

const data = {
  source: {
    url: "https://x.gov/a.pdf",
    title: "",
    publisher: "",
    published: "",
    sha256: SHA,
    pages: {},
  },
  guide: threeLittlePigs,
  examples: [threeLittlePigs, threeLittlePigs],
  exercise: {
    paragraphs: [
      { id: "title", text: "T" },
      { id: "p1", text: "One" },
    ],
  },
  answerKey: {
    banner: "SECRET",
    documentDate: "2018-09-04",
    authorityBlock: {
      classifiedBy: "",
      derivedFrom: "",
      declassifyOn: "",
      declassifyOnDate: "2043-09-04",
    },
    paragraphs: [],
  },
} as ExtractedData;

const modelRun = (overrides: Partial<ProposalsFile["provenance"]> = {}): ProposalsFile => ({
  provenance: {
    kind: "model",
    description: "",
    model: "test-model",
    promptTemplateSha256: PROMPT,
    sourceSha256: SHA,
    guideSha256: GUIDE,
    createdAt: "2026-11-05T00:00:00Z",
    ...overrides,
  },
  proposals: [
    { paragraphId: "title", citedRuleIds: ["project-name"], rationale: "" },
    { paragraphId: "p1", citedRuleIds: [], rationale: "" },
  ],
});

describe("releaseProblems", () => {
  it("passes a complete model run against the pinned PDF and prompt", () => {
    expect(releaseProblems(data, modelRun(), current())).toEqual([]);
  });

  it("blocks a development fixture", () => {
    const fixture = modelRun({
      kind: "development-fixture",
      model: null,
      promptTemplateSha256: null,
    });
    expect(releaseProblems(data, fixture, current())[0]).toMatch(/development fixture/);
  });

  it("blocks stale proposals after the PDF or prompt changes", () => {
    expect(releaseProblems(data, modelRun(), current({ pdfSha256: "c".repeat(64) }))).toHaveLength(
      2,
    );
    expect(releaseProblems(data, modelRun(), current({ promptSha256: "d".repeat(64) }))[0]).toMatch(
      /prompt changed/,
    );
  });

  it("blocks missing, unknown, and duplicate proposals", () => {
    const run = modelRun();
    run.proposals = [
      run.proposals[0]!,
      run.proposals[0]!,
      { paragraphId: "p9", citedRuleIds: [], rationale: "" },
    ];
    const problems = releaseProblems(data, run, current());
    expect(problems.join(" ")).toMatch(/No proposal for: p1/);
    expect(problems.join(" ")).toMatch(/unknown paragraphs: p9/);
    expect(problems.join(" ")).toMatch(/more than one/);
  });

  it("blocks proposals made against different rules or citing unknown rules", () => {
    expect(releaseProblems(data, modelRun(), current({ guideSha256: "f".repeat(64) }))[0]).toMatch(
      /rules changed/,
    );
    const run = modelRun();
    run.proposals[1] = { paragraphId: "p1", citedRuleIds: ["made-up"], rationale: "" };
    expect(releaseProblems(data, run, current()).join(" ")).toMatch(/not in the guide: made-up/);
  });

  it("blocks a model run that doesn't name its model", () => {
    expect(releaseProblems(data, modelRun({ model: null }), current())[0]).toMatch(/which model/);
  });
});
