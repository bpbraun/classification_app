import { describe, expect, it } from "vitest";
import { LEVELS, type Marking } from "../src/core/types";
import { sameControls } from "../src/core/levels";
import { checkProposal, deriveMarking, resolveRules } from "../src/core/validator";
import { threeLittlePigs as guide } from "./fixtures/three-little-pigs";

/**
 * Seeded sweep: every pair of rules (including none and single rules), every level,
 * with and without NOFORN. The check must pass exactly the marking the citations
 * support and flag every other one.
 */
const ids = guide.rules.map((r) => r.id);
const citationSets: string[][] = [
  [],
  ...ids.map((a) => [a]),
  ...ids.flatMap((a, i) => ids.slice(i + 1).map((b) => [a, b])),
];
const markings: Marking[] = LEVELS.flatMap((level) => [
  { level, controls: [] },
  { level, controls: ["NOFORN"] },
]);

describe("checkProposal across every seeded wrong marking", () => {
  it("covers a meaningful number of cases", () => {
    expect(citationSets.length * markings.length).toBeGreaterThan(200);
  });

  for (const cites of citationSets) {
    const derived = deriveMarking(resolveRules(guide, cites));
    it(`citing [${cites.join(", ") || "nothing"}]`, () => {
      for (const marking of markings) {
        const result = checkProposal(
          guide,
          { paragraphId: "x", citedRuleIds: cites, rationale: "" },
          marking,
        );
        const kinds = result.findings.map((f) => f.kind);
        const correct =
          derived !== null &&
          derived.level === marking.level &&
          sameControls(derived.controls, marking.controls);
        if (derived === null) expect(kinds).toEqual(["no-guidance"]);
        else if (correct) expect(kinds).toEqual(["supported"]);
        else expect(kinds).not.toContain("supported");
      }
    });
  }
});
