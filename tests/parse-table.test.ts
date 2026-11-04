import { describe, expect, it } from "vitest";
import { groupLines, type TextItem } from "../src/pipeline/layout";
import {
  parseControls,
  parseDurationYears,
  parseLevel,
  parseReasons,
  parseTables,
  rowsToRules,
} from "../src/pipeline/parse-table";

const item = (x: number, y: number, text: string): TextItem => ({ page: 1, x, y, text });

/** A small table laid out the way the handbook lays its tables out. */
const header = [
  item(84, 700, "Element of Information"),
  item(200, 700, "Classification"),
  item(268, 700, "Reason"),
  item(316, 700, "Duration of"),
  item(380, 700, "Dissemination"),
  item(457, 700, "Controlled"),
  item(524, 700, "Remarks"),
  item(216, 688, "Level"),
  item(454, 688, "Unclassified"),
];

describe("parseTables", () => {
  it("reads rows, wrapped cells, and stops at the end of the table", () => {
    const lines = groupLines([
      ...header,
      item(78, 670, "Project name"),
      item(203, 670, "Unclassified"),
      item(78, 650, "Methods used to destroy"),
      item(214, 650, "Secret"),
      item(266, 650, "1.4(c)"),
      item(311, 650, "25 years"),
      item(78, 638, "houses"),
      item(78, 620, "Entry points into"),
      item(147, 620, "houses"),
      item(205, 620, "Top Secret"),
      item(266, 620, "1.4(c)"),
      item(311, 620, "25 years"),
      item(379, 620, "NOFORN"),
      item(72, 560, "Based on the guide, mark the document."),
    ]);
    const [table] = parseTables(lines);
    expect(table?.map((r) => r.cells.element)).toEqual([
      "Project name",
      "Methods used to destroy houses",
      "Entry points into houses",
    ]);
    expect(table?.[2]?.cells).toMatchObject({ level: "Top Secret", controls: "NOFORN" });
  });

  it("finds each table when a page has several", () => {
    const second = header.map((h) => ({ ...h, y: h.y - 200 }));
    const lines = groupLines([
      ...header,
      item(78, 670, "Mission"),
      item(203, 670, "Unclassified"),
      ...second,
      item(78, 470, "Mission"),
      item(203, 470, "Secret"),
    ]);
    expect(parseTables(lines).map((t) => t.map((r) => r.cells.level))).toEqual([
      ["Unclassified"],
      ["Secret"],
    ]);
  });
});

describe("cell parsers", () => {
  it("reads levels written out or abbreviated", () => {
    expect(parseLevel("Top Secret")).toBe("TS");
    expect(parseLevel("Secret")).toBe("S");
    expect(parseLevel("C")).toBe("C");
    expect(parseLevel("Unclassified")).toBe("U");
    expect(() => parseLevel("Sensitive")).toThrow();
  });

  it("reads reasons, durations, and controls", () => {
    expect(parseReasons("1.4(a), 1.4 (C)")).toEqual(["1.4(a)", "1.4(c)"]);
    expect(parseReasons("1.4(c), (a)")).toEqual(["1.4(a)", "1.4(c)"]);
    expect(parseReasons("None")).toEqual([]);
    expect(parseDurationYears("25 years *")).toBe(25);
    expect(parseDurationYears(undefined)).toBeNull();
    expect(parseControls("NOFORN")).toEqual(["NOFORN"]);
    expect(parseControls("REL TO USA, GBR")).toEqual(["REL TO USA, GBR"]);
    expect(parseControls("NOFORN, REL TO USA, GBR")).toEqual(["NOFORN", "REL TO USA, GBR"]);
    expect(parseControls("ORCON; NOFORN")).toEqual(["ORCON", "NOFORN"]);
    expect(parseControls("NOFORN ORCON")).toEqual(["NOFORN", "ORCON"]);
    expect(parseControls("None")).toEqual([]);
    expect(parseControls("N/A")).toEqual([]);
  });
});

describe("rowsToRules", () => {
  it("gives every rule a readable, unique id and keeps its source row", () => {
    const rules = rowsToRules([
      {
        page: 12,
        row: 1,
        cells: { element: "Mission", level: "Secret", reason: "1.4(a)", duration: "25 years" },
      },
      { page: 12, row: 2, cells: { element: "Mission", level: "Unclassified" } },
    ]);
    expect(rules.map((r) => r.id)).toEqual(["mission", "mission-2"]);
    expect(rules[0]).toMatchObject({
      level: "S",
      reasons: ["1.4(a)"],
      durationYears: 25,
      source: { page: 12, row: 1 },
    });
    expect(rules[1]?.durationYears).toBeNull();
  });

  it("cuts long ids back to a whole word", () => {
    const [rule] = rowsToRules([
      {
        page: 8,
        row: 1,
        cells: {
          element: "Compilation of both mission and geographic location within the same document",
          level: "Unclassified",
        },
      },
    ]);
    expect(rule?.id).toBe("compilation-of-both-mission-and-geographic");
  });

  it("keeps ids at the length limit and cuts a single overlong word at the limit", () => {
    const row = (element: string) => ({ page: 1, row: 1, cells: { element, level: "U" } });
    const exact = "a".repeat(20) + " " + "b".repeat(27); // 48 characters as a slug
    expect(rowsToRules([row(exact)])[0]?.id).toHaveLength(48);
    expect(rowsToRules([row("x".repeat(60))])[0]?.id).toHaveLength(48);
  });
});
