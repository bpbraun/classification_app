import { describe, expect, it } from "vitest";
import { addYears, assembleDocument } from "../src/core/assemble";
import { threeLittlePigs as guide } from "./fixtures/three-little-pigs";

describe("addYears", () => {
  it("adds whole years to an ISO date", () => {
    expect(addYears("2018-09-04", 25)).toBe("2043-09-04");
  });

  it("moves Feb 29 to Feb 28 in a non-leap year", () => {
    expect(addYears("2024-02-29", 1)).toBe("2025-02-28");
  });

  it("rejects a malformed date", () => {
    expect(() => addYears("09/04/2018", 1)).toThrow();
  });
});

describe("assembleDocument", () => {
  const options = { documentDate: "2018-09-04", classifiedBy: "Derivative Classifier" };

  it("builds the banner and authority block from the cited rules", () => {
    const result = assembleDocument(
      guide,
      [
        { paragraphId: "p1", citedRuleIds: ["existence-of-pigs"] },
        { paragraphId: "p2", citedRuleIds: ["building-material"] },
        { paragraphId: "p3", citedRuleIds: ["entry-points"] },
      ],
      options,
    );
    expect(result.banner).toBe("TOP SECRET//NOFORN");
    expect(result.authorityBlock).toEqual({
      classifiedBy: "Derivative Classifier",
      derivedFrom: "Security Classification Guide: Project Three Little Pigs, dated 20180815",
      declassifyOn: "20430904",
    });
  });

  it("uses the longest duration among classified rules", () => {
    const result = assembleDocument(
      guide,
      [{ paragraphId: "p1", citedRuleIds: ["building-material"] }],
      options,
    );
    expect(result.authorityBlock?.declassifyOn).toBe("20280904");
  });

  it("omits the authority block for an unclassified document", () => {
    const result = assembleDocument(
      guide,
      [{ paragraphId: "p1", citedRuleIds: ["advice-from-mom"] }],
      options,
    );
    expect(result.banner).toBe("UNCLASSIFIED");
    expect(result.authorityBlock).toBeNull();
  });

  it("ignores citations that are not in the guide", () => {
    const result = assembleDocument(
      guide,
      [{ paragraphId: "p1", citedRuleIds: ["made-up-rule"] }],
      options,
    );
    expect(result.banner).toBe("UNCLASSIFIED");
  });
});
