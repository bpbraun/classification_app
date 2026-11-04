import { describe, expect, it } from "vitest";
import extracted from "../data/extracted.json";
import proposalsJson from "../data/proposals.json";
import { extractedSchema, proposalsFileSchema } from "../src/data/schema";
import { buildView, labelFor, readableNote } from "../web/state";

const data = extractedSchema.parse(extracted);
const proposals = proposalsFileSchema.parse(proposalsJson);

describe("committed data files", () => {
  it("match their schemas and cover every paragraph", () => {
    const ids = proposals.proposals.map((p) => p.paragraphId);
    expect(ids).toEqual(data.exercise.paragraphs.map((p) => p.id));
  });

  it("cite only rules that exist", () => {
    const known = new Set(data.guide.rules.map((r) => r.id));
    for (const p of proposals.proposals)
      for (const id of p.citedRuleIds) expect(known).toContain(id);
  });
});

describe("buildView", () => {
  const view = buildView(data, proposals, new Map(), "Demo");

  it("marks each portion from its citations and builds the banner", () => {
    expect(view.portions[11]?.current).toEqual({ level: "TS", controls: ["NOFORN"] });
    expect(view.banner).toBe("TOP SECRET//NOFORN");
    expect(view.authorityBlock?.declassifyOn).toBe("20430904");
  });

  it("responds to a viewer's change with a finding", () => {
    const changed = buildView(
      data,
      proposals,
      new Map([["p11", { level: "S", controls: [] }]]),
      "Demo",
    );
    const portion = changed.portions[11];
    expect(portion?.changed).toBe(true);
    expect(portion?.check.findings.map((f) => f.kind)).toEqual([
      "under-classified",
      "missing-control",
    ]);
    expect(changed.banner).toBe("SECRET");
  });

  it("drops the authority block when everything is marked unclassified", () => {
    const allU = new Map(
      data.exercise.paragraphs.map((p) => [p.id, { level: "U" as const, controls: [] }]),
    );
    expect(buildView(data, proposals, allU, "Demo").authorityBlock).toBeNull();
  });

  it("compares with ISOO's key and finds the example conflicts", () => {
    expect(view.comparison.summary.total).toBe(12);
    expect(view.conflicts).toHaveLength(3);
  });

  it("knows when the proposals are only a fixture", () => {
    expect(view.isFixture).toBe(proposals.provenance.kind !== "model");
  });
});

describe("labels", () => {
  it("reads well", () => {
    expect(labelFor("title")).toBe("Title");
    expect(labelFor("p4")).toBe("Paragraph 4");
    expect(readableNote("combines this paragraph with p4 into one")).toContain("Paragraph 4");
  });
});
