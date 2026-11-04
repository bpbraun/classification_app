import { describe, expect, it } from "vitest";
import { groupLines, type TextItem } from "../src/pipeline/layout";
import {
  alignKey,
  parseAnswerKey,
  parseExercise,
  parsePortionMarking,
  toIsoDate,
} from "../src/pipeline/parse-exercise";

const at = (y: number, text: string, x = 72): TextItem => ({ page: 1, x, y, text });

describe("parseExercise", () => {
  it("splits on blank portion marks and joins wrapped lines", () => {
    const lines = groupLines([
      at(700, "____________________", 243),
      at(680, "(", 251),
      at(680, ") Project Three Little Pigs", 262),
      at(660, "("),
      at(660, ") Once upon a time there were", 88),
      at(648, "three little pigs."),
      at(620, "("),
      at(620, ") The first pig built a house of straw.", 88),
      at(580, "Classified By:"),
    ]);
    expect(parseExercise(lines)).toEqual([
      { id: "title", text: "Project Three Little Pigs" },
      { id: "p1", text: "Once upon a time there were three little pigs." },
      { id: "p2", text: "The first pig built a house of straw." },
    ]);
  });
});

describe("parseAnswerKey", () => {
  const lines = groupLines([
    at(700, "TOP SECRET//NOFORN", 256),
    at(680, "September 4, 2018", 469),
    at(660, "(S) Project Three Little Pigs", 252),
    at(640, "(U) Once upon a time there were"),
    at(628, "three little pigs."),
    at(600, "(TS/NF) The wolf found the hole in the chimney."),
    at(560, "Classified By: Peggy Ushman, Senior Program Analyst, ISOO"),
    at(545, "Derived From: Project Three Little Pigs SCG, dated Aug 15, 2018"),
    at(530, "Declassify On: September 4, 2043"),
    at(500, "TOP SECRET//NOFORN", 256),
  ]);

  it("reads the banner, date, portions, and authority block", () => {
    const key = parseAnswerKey(lines);
    expect(key.banner).toBe("TOP SECRET//NOFORN");
    expect(key.documentDate).toBe("2018-09-04");
    expect(key.portions.map((p) => p.marking)).toEqual([
      { level: "S", controls: [] },
      { level: "U", controls: [] },
      { level: "TS", controls: ["NOFORN"] },
    ]);
    expect(key.portions[1]?.text).toBe("Once upon a time there were three little pigs.");
    expect(key.authorityBlock.declassifyOn).toBe("September 4, 2043");
  });

  it("aligns paragraphs to the key, noting merged portions", () => {
    const key = parseAnswerKey(lines);
    key.portions[1] = { ...key.portions[1]!, text: "Once upon a time. The end." };
    const aligned = alignKey(
      [
        { id: "title", text: "Project Three Little Pigs" },
        { id: "p1", text: "Once upon a time." },
        { id: "p2", text: "The end." },
        { id: "p3", text: "The wolf found the hole in the chimney." },
      ],
      key,
    );
    expect(aligned.map((a) => a.marking.level)).toEqual(["S", "U", "U", "TS"]);
    expect(aligned[1]?.note).toContain("p2");
    expect(aligned[0]?.note).toBeUndefined();
  });

  it("does not match a short repeated line to an earlier merged portion", () => {
    const key = parseAnswerKey(lines);
    key.portions = [
      { marking: { level: "U", controls: [] }, text: "Let me in. Not by the hair. He blew it in." },
      { marking: { level: "S", controls: [] }, text: "The wolf came to the bricks." },
      { marking: { level: "U", controls: [] }, text: "Not by the hair." },
    ];
    const aligned = alignKey(
      [
        { id: "p1", text: "Let me in. Not by the hair. He blew it in." },
        { id: "p2", text: "The wolf came to the bricks." },
        { id: "p3", text: "Not by the hair." },
      ],
      key,
    );
    expect(aligned.map((a) => a.marking.level)).toEqual(["U", "S", "U"]);
    expect(aligned.every((a) => a.note === undefined)).toBe(true);
  });

  it("refuses a key with portions no paragraph accounts for", () => {
    const key = parseAnswerKey(lines);
    expect(() => alignKey([{ id: "title", text: "Project Three Little Pigs" }], key)).toThrow(
      /match no exercise paragraph/,
    );
  });

  it("refuses to guess when a paragraph is not in the key", () => {
    const key = parseAnswerKey(lines);
    expect(() => alignKey([{ id: "p9", text: "Not in the key." }], key)).toThrow();
  });
});

describe("helpers", () => {
  it("expands portion control abbreviations", () => {
    expect(parsePortionMarking("TS", "/NF")).toEqual({ level: "TS", controls: ["NOFORN"] });
  });

  it("converts written dates to ISO", () => {
    expect(toIsoDate("August 15, 2018")).toBe("2018-08-15");
    expect(() => toIsoDate("Aug 15 2018")).toThrow();
    expect(() => toIsoDate("February 31, 2018")).toThrow();
  });
});
