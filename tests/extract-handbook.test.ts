import { describe, expect, it } from "vitest";
import { assembleDocument } from "../src/core/assemble";
import { findConflicts } from "../src/core/conflicts";
import { deriveMarking } from "../src/core/validator";
import { extractFromItems, PAGES } from "../src/pipeline/extract";
import { readTextItems, sha256File } from "../src/pipeline/pdf-text";
import { extractedSchema } from "../src/data/schema";

const PDF = "sources/isoo-scg-handbook-2018.pdf";
const PINNED_SHA256 = "290a92cd92bf9af88d57ddee42221280a730ad03197d9270984b0d33efc63415";

/** End-to-end check against the real handbook. If ISOO changes the file, this fails loudly. */
describe("extracting the ISOO handbook", async () => {
  const sha = await sha256File(PDF);
  const data = extractFromItems(await readTextItems(PDF, Object.values(PAGES)), sha);

  it("is the pinned edition of the file", () => {
    expect(sha).toBe(PINNED_SHA256);
  });

  it("produces data that passes its schema", () => {
    expect(() => extractedSchema.parse(data)).not.toThrow();
  });

  it("reads the sample guide's cover", () => {
    expect(data.guide).toMatchObject({
      title: "Project Three Little Pigs SCG",
      date: "2018-08-15",
      issuedBy: "Information Security Oversight Office",
      originalClassificationAuthority: "James Halliwell-Phillipps",
    });
  });

  it("reads all seven rules exactly", () => {
    expect(
      data.guide.rules.map((r) => [r.element, r.level, r.reasons, r.durationYears, r.controls]),
    ).toEqual([
      ["Project name", "U", [], null, []],
      ["The existence of pigs", "U", [], null, []],
      ["The existence of the wolf", "U", [], null, []],
      ["Building material of houses", "S", ["1.4(a)"], 10, []],
      ["Methods used to destroy houses", "S", ["1.4(c)"], 25, []],
      ["Entry points into houses", "TS", ["1.4(c)"], 25, ["NOFORN"]],
      ["Advice from Mom", "U", [], null, []],
    ]);
    expect(data.guide.rules[5]?.source).toEqual({ page: 12, row: 6 });
  });

  it("reads the exercise as a title and eleven paragraphs", () => {
    expect(data.exercise.paragraphs).toHaveLength(12);
    expect(data.exercise.paragraphs[0]?.text).toBe("Project Three Little Pigs");
    expect(data.exercise.paragraphs.at(-1)?.text).toMatch(/KERSPLASH .* big bad wolf\.$/);
  });

  it("aligns every paragraph to ISOO's answer key", () => {
    const levels = data.answerKey.paragraphs.map((p) => p.marking.level);
    expect(levels).toEqual(["S", "U", "S", "S", "S", "S", "U", "S", "U", "S", "U", "TS"]);
    expect(data.answerKey.paragraphs[3]?.note).toContain("p4");
    expect(data.answerKey.paragraphs[4]?.note).toContain("p3");
    const noted = data.answerKey.paragraphs.filter((p) => p.note).map((p) => p.paragraphId);
    expect(noted).toEqual(["p3", "p4"]);
    expect(data.answerKey.paragraphs.at(-1)?.marking.controls).toEqual(["NOFORN"]);
  });

  it("matches ISOO's banner and declassification date when every rule is cited", () => {
    const assembled = assembleDocument(
      data.guide,
      [
        {
          citedRuleIds: data.guide.rules.map((r) => r.id),
          marking: deriveMarking(data.guide.rules) ?? { level: "U", controls: [] },
        },
      ],
      { documentDate: data.answerKey.documentDate, classifiedBy: "Test" },
    );
    expect(assembled.banner).toBe(data.answerKey.banner);
    expect(assembled.authorityBlock?.declassifyOn).toBe("20430904");
    expect(data.answerKey.authorityBlock.declassifyOn).toBe("September 4, 2043");
    expect(data.answerKey.authorityBlock.declassifyOnDate).toBe("2043-09-04");
  });

  it("finds the conflict between handbook Examples 1 and 2", () => {
    const [one, two] = data.examples;
    const conflicts = findConflicts(one!, two!);
    expect(conflicts.map((c) => [c.a.level, c.b.level])).toEqual([
      ["U", "S"],
      ["U", "S"],
      ["S", "TS"],
    ]);
  });
});
