import { describe, expect, it } from "vitest";
import {
  bannerText,
  compareLevels,
  isLevel,
  maxLevel,
  overallMarking,
  portionText,
  spokenMarking,
} from "../src/core/levels";

describe("marking helpers", () => {
  it("combines markings into the overall marking", () => {
    expect(
      overallMarking([
        { level: "S", controls: [] },
        { level: "C", controls: ["NOFORN"] },
      ]),
    ).toEqual({ level: "S", controls: ["NOFORN"] });
  });

  it("recognizes levels and speaks markings in words", () => {
    expect(isLevel("TS")).toBe(true);
    expect(isLevel("SECRET")).toBe(false);
    expect(spokenMarking({ level: "TS", controls: ["NOFORN"] })).toBe("Top Secret, NOFORN");
  });
});

describe("classification levels", () => {
  it("orders levels from Unclassified to Top Secret", () => {
    expect(compareLevels("U", "C")).toBeLessThan(0);
    expect(compareLevels("TS", "S")).toBeGreaterThan(0);
    expect(compareLevels("S", "S")).toBe(0);
  });

  it("takes the highest level, defaulting to Unclassified", () => {
    expect(maxLevel(["U", "S", "C"])).toBe("S");
    expect(maxLevel([])).toBe("U");
  });

  it("writes portion marks with abbreviated controls", () => {
    expect(portionText({ level: "TS", controls: ["NOFORN"] })).toBe("(TS//NF)");
    expect(portionText({ level: "S", controls: [] })).toBe("(S)");
    expect(portionText({ level: "U", controls: [] })).toBe("(U)");
  });

  it("writes the banner line in full", () => {
    expect(bannerText({ level: "TS", controls: ["NOFORN"] })).toBe("TOP SECRET//NOFORN");
    expect(bannerText({ level: "C", controls: [] })).toBe("CONFIDENTIAL");
    expect(bannerText({ level: "U", controls: [] })).toBe("UNCLASSIFIED");
  });
});
