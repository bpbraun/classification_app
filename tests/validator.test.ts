import { describe, expect, it } from "vitest";
import { checkProposal, deriveMarking } from "../src/core/validator";
import { threeLittlePigs as guide } from "./fixtures/three-little-pigs";

const kinds = (r: ReturnType<typeof checkProposal>) => r.findings.map((f) => f.kind);

describe("deriveMarking", () => {
  it("takes the highest cited level and the union of controls", () => {
    const rules = guide.rules.filter((r) => ["building-material", "entry-points"].includes(r.id));
    expect(deriveMarking(rules)).toEqual({ level: "TS", controls: ["NOFORN"] });
  });

  it("returns null when nothing is cited", () => {
    expect(deriveMarking([])).toBeNull();
  });
});

describe("checkProposal", () => {
  const base = { paragraphId: "p3", rationale: "Names straw as a building material." };

  it("supports a marking that matches the cited rules", () => {
    const result = checkProposal(guide, { ...base, citedRuleIds: ["building-material"] });
    expect(result.derived).toEqual({ level: "S", controls: [] });
    expect(kinds(result)).toEqual(["supported"]);
  });

  it("flags a cited rule that is not in the guide", () => {
    const result = checkProposal(guide, { ...base, citedRuleIds: ["made-up-rule"] });
    expect(kinds(result)).toContain("unknown-rule");
  });

  it("flags a paragraph with no applicable guidance", () => {
    const result = checkProposal(guide, { ...base, citedRuleIds: [] });
    expect(result.derived).toBeNull();
    expect(kinds(result)).toEqual(["no-guidance"]);
  });

  it("flags a marking set lower than the cited rules support", () => {
    const result = checkProposal(
      guide,
      { ...base, citedRuleIds: ["building-material"] },
      { level: "U", controls: [] },
    );
    expect(kinds(result)).toContain("under-classified");
  });

  it("flags a marking set higher than the cited rules support", () => {
    const result = checkProposal(
      guide,
      { ...base, citedRuleIds: ["building-material"] },
      { level: "TS", controls: [] },
    );
    expect(kinds(result)).toContain("over-classified");
  });

  it("flags a dropped dissemination control", () => {
    const result = checkProposal(
      guide,
      { ...base, citedRuleIds: ["entry-points"] },
      { level: "TS", controls: [] },
    );
    expect(kinds(result)).toEqual(["missing-control"]);
  });

  it("flags a control the cited rules do not call for", () => {
    const result = checkProposal(
      guide,
      { ...base, citedRuleIds: ["building-material"] },
      { level: "S", controls: ["NOFORN"] },
    );
    expect(kinds(result)).toEqual(["extra-control"]);
  });

  it("never treats unknown citations as support", () => {
    const result = checkProposal(
      guide,
      { ...base, citedRuleIds: ["made-up-rule"] },
      { level: "TS", controls: [] },
    );
    expect(result.derived).toBeNull();
    expect(kinds(result)).not.toContain("supported");
  });
});
