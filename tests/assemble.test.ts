import { describe, expect, it } from "vitest";
import { addYears, assembleDocument, compactDate, parseIsoDate } from "../src/core/assemble";
import { deriveMarking, resolveRules } from "../src/core/validator";
import type { Guide, Marking } from "../src/core/types";
import { threeLittlePigs as guide } from "./fixtures/three-little-pigs";

/** A portion marked exactly as its citations support. */
const cited = (...ids: string[]) => ({
  citedRuleIds: ids,
  marking: deriveMarking(resolveRules(guide, ids)) ?? { level: "U" as const, controls: [] },
});
const options = { documentDate: "2018-09-04", classifiedBy: "Derivative Classifier" };

describe("dates", () => {
  it("adds whole years to an ISO date", () => {
    expect(addYears("2018-09-04", 25)).toBe("2043-09-04");
  });

  it("moves Feb 29 to Feb 28 in a non-leap year", () => {
    expect(addYears("2024-02-29", 1)).toBe("2025-02-28");
  });

  it("rejects malformed and impossible dates", () => {
    expect(() => addYears("09/04/2018", 1)).toThrow();
    expect(() => addYears("2026-13-45", 1)).toThrow();
    expect(() => parseIsoDate("2026-00-10")).toThrow();
    expect(() => parseIsoDate("2025-02-29")).toThrow();
    expect(() => compactDate("2026-04-31")).toThrow();
  });
});

describe("assembleDocument", () => {
  it("builds the banner and authority block from the cited rules", () => {
    const result = assembleDocument(
      guide,
      [cited("existence-of-pigs"), cited("building-material"), cited("entry-points")],
      options,
    );
    expect(result.banner).toBe("TOP SECRET//NOFORN");
    expect(result.authorityBlock).toEqual({
      classifiedBy: "Derivative Classifier",
      derivedFrom: "Security Classification Guide: Project Three Little Pigs, dated 20180815",
      declassifyOn: "20430904",
      problem: null,
    });
  });

  it("uses the longest duration among classified rules", () => {
    const result = assembleDocument(guide, [cited("building-material")], options);
    expect(result.authorityBlock?.declassifyOn).toBe("20280904");
  });

  it("omits the authority block for an unclassified document", () => {
    const result = assembleDocument(guide, [cited("advice-from-mom")], options);
    expect(result.banner).toBe("UNCLASSIFIED");
    expect(result.authorityBlock).toBeNull();
  });

  it("follows the markings as set, not just the citations", () => {
    const raised: Marking = { level: "S", controls: [] };
    const result = assembleDocument(
      guide,
      [{ citedRuleIds: ["advice-from-mom"], marking: raised }],
      options,
    );
    expect(result.banner).toBe("SECRET");
    expect(result.authorityBlock?.declassifyOn).toBeNull();
    expect(result.authorityBlock?.problem).toMatch(/Refer to the OCA/);
  });

  it("never invents a date when a classified rule has no duration", () => {
    const broken: Guide = {
      ...guide,
      rules: guide.rules.map((r) =>
        r.id === "building-material" ? { ...r, durationYears: null } : r,
      ),
    };
    const result = assembleDocument(
      broken,
      [{ citedRuleIds: ["building-material"], marking: { level: "S", controls: [] } }],
      options,
    );
    expect(result.authorityBlock?.declassifyOn).toBeNull();
    expect(result.authorityBlock?.problem).toMatch(/Building material of houses/);
  });

  it("ignores citations that are not in the guide", () => {
    const result = assembleDocument(guide, [cited("made-up-rule")], options);
    expect(result.banner).toBe("UNCLASSIFIED");
  });
});
