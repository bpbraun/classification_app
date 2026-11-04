import { describe, expect, it } from "vitest";
import { compareToKey } from "../src/core/compare";

describe("compareToKey", () => {
  it("reports agreement and disagreement per paragraph", () => {
    const result = compareToKey(
      [
        { paragraphId: "p1", marking: { level: "U", controls: [] } },
        { paragraphId: "p2", marking: { level: "S", controls: [] } },
      ],
      [
        { paragraphId: "p1", marking: { level: "U", controls: [] } },
        { paragraphId: "p2", marking: { level: "U", controls: [] } },
      ],
    );
    expect(result.rows.map((r) => r.agrees)).toEqual([true, false]);
    expect(result.summary).toEqual({ agree: 1, disagree: 1, missing: 0, total: 2 });
  });

  it("treats a control difference as disagreement", () => {
    const result = compareToKey(
      [{ paragraphId: "p1", marking: { level: "TS", controls: [] } }],
      [{ paragraphId: "p1", marking: { level: "TS", controls: ["NOFORN"] } }],
    );
    expect(result.rows[0]?.agrees).toBe(false);
  });

  it("counts a key paragraph with no proposal as missing", () => {
    const result = compareToKey([], [{ paragraphId: "p1", marking: { level: "U", controls: [] } }]);
    expect(result.rows[0]?.proposed).toBeNull();
    expect(result.summary.missing).toBe(1);
  });
});
