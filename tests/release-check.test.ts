import { describe, expect, it } from "vitest";
import { releaseProblems } from "../src/pipeline/release-check";
import type { ExtractedData, ProposalsFile } from "../src/pipeline/schema";
import { threeLittlePigs } from "./fixtures/three-little-pigs";

const SHA = "a".repeat(64);
const PROMPT = "b".repeat(64);

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
    authorityBlock: { classifiedBy: "", derivedFrom: "", declassifyOn: "" },
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
    expect(releaseProblems(data, modelRun(), SHA, PROMPT)).toEqual([]);
  });

  it("blocks a development fixture", () => {
    const fixture = modelRun({
      kind: "development-fixture",
      model: null,
      promptTemplateSha256: null,
    });
    expect(releaseProblems(data, fixture, SHA, PROMPT)[0]).toMatch(/development fixture/);
  });

  it("blocks stale proposals after the PDF or prompt changes", () => {
    expect(releaseProblems(data, modelRun(), "c".repeat(64), PROMPT)).toHaveLength(2);
    expect(releaseProblems(data, modelRun(), SHA, "d".repeat(64))[0]).toMatch(/prompt changed/);
  });

  it("blocks missing, unknown, and duplicate proposals", () => {
    const run = modelRun();
    run.proposals = [
      run.proposals[0]!,
      run.proposals[0]!,
      { paragraphId: "p9", citedRuleIds: [], rationale: "" },
    ];
    const problems = releaseProblems(data, run, SHA, PROMPT);
    expect(problems.join(" ")).toMatch(/No proposal for: p1/);
    expect(problems.join(" ")).toMatch(/unknown paragraphs: p9/);
    expect(problems.join(" ")).toMatch(/more than one/);
  });
});
