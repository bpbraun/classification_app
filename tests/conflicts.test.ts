import { describe, expect, it } from "vitest";
import { findConflicts, similarity } from "../src/core/conflicts";
import type { Guide, Rule } from "../src/core/types";

const r = (id: string, element: string, level: Rule["level"], controls: string[] = []): Rule => ({
  id,
  element,
  level,
  reasons: level === "U" ? [] : ["1.4(a)"],
  durationYears: level === "U" ? null : 25,
  controls,
  source: { page: 8, row: 1 },
});

const guide = (id: string, rules: Rule[]): Guide => ({
  id,
  title: id,
  issuedBy: "ISOO",
  date: "2018-10-01",
  originalClassificationAuthority: "Example OCA",
  sourceUrl: "https://www.archives.gov/files/isoo/training/scg-handbook.pdf",
  rules,
});

describe("similarity", () => {
  it("ignores case, punctuation, and filler words", () => {
    expect(similarity("Geographic Location", "the geographic location.")).toBe(1);
  });

  it("scores unrelated elements low", () => {
    expect(similarity("Mission", "Speed of aircraft")).toBeLessThan(0.5);
  });
});

describe("findConflicts", () => {
  const example1 = guide("example-1", [
    r("mission", "Mission", "U"),
    r("location", "Geographic Location", "U"),
    r("compilation", "Compilation of both mission and geographic location", "S"),
  ]);
  const example2 = guide("example-2", [
    r("mission", "Mission", "S"),
    r("location", "Geographic Location", "S"),
    r("compilation", "Compilation of both mission and geographic location", "TS", ["NOFORN"]),
  ]);

  it("flags every shared element that is treated differently", () => {
    const conflicts = findConflicts(example1, example2);
    expect(conflicts.map((c) => c.a.element)).toEqual([
      "Mission",
      "Geographic Location",
      "Compilation of both mission and geographic location",
    ]);
    expect(conflicts[0]?.differences).toEqual(["level", "reasons", "duration"]);
    expect(conflicts[2]?.differences).toEqual(["level", "controls"]);
  });

  it("reports nothing when the guides agree", () => {
    expect(findConflicts(example1, example1)).toEqual([]);
  });

  it("does not pair unrelated elements", () => {
    const other = guide("other", [r("speed", "Speed of aircraft", "S")]);
    expect(findConflicts(example1, other)).toEqual([]);
  });
});
