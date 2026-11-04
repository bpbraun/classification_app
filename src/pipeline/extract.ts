import type { Guide } from "../core/types";
import { groupLines, lineText, type Line, type TextItem } from "./layout";
import { alignKey, parseAnswerKey, parseExercise, toIsoDate } from "./parse-exercise";
import { parseTables, rowsToRules } from "./parse-table";
import type { ExtractedData } from "./schema";

export const SOURCE = {
  url: "https://www.archives.gov/files/isoo/training/scg-handbook.pdf",
  title: "Developing and Using Security Classification Guides",
  publisher: "Information Security Oversight Office, National Archives",
  published: "October 2018",
} as const;

/** Where each piece lives in the October 2018 handbook. Pinned to the file's SHA-256. */
export const PAGES = {
  examples: 8,
  guideCover: 11,
  guideTable: 12,
  exercise: 13,
  answerKey: 15,
} as const;

export interface GuideCover {
  title: string;
  date: string;
  issuedBy: string;
  originalClassificationAuthority: string;
}

export function parseGuideCover(lines: readonly Line[]): GuideCover {
  const texts = lines.map(lineText);
  const at = (i: number) => texts[i] ?? "";
  const heading = texts.indexOf("Security Classification Guide");
  const ocaLabel = texts.findIndex((t) => t.includes("Original Classification Authority"));
  const issued = texts.find((t) => t.startsWith("Issued By:"));
  if (heading < 0 || ocaLabel < 1 || !issued)
    throw new Error("Guide cover page is not in the expected layout");
  return {
    title: at(heading + 1),
    date: toIsoDate(at(heading + 2)),
    issuedBy: issued.replace("Issued By:", "").trim(),
    originalClassificationAuthority: at(ocaLabel - 1),
  };
}

/** Builds the demo's data set from the handbook's positioned text. Pure: no file access. */
export function extractFromItems(items: readonly TextItem[], sourceSha256: string): ExtractedData {
  const onPage = (page: number) => groupLines(items.filter((i) => i.page === page));
  const cover = parseGuideCover(onPage(PAGES.guideCover));
  const [mainTable] = parseTables(onPage(PAGES.guideTable));
  if (!mainTable) throw new Error("No classification table found in the sample guide");

  const guide: Guide = {
    id: "project-three-little-pigs",
    title: `${cover.title} SCG`,
    issuedBy: cover.issuedBy,
    date: cover.date,
    originalClassificationAuthority: cover.originalClassificationAuthority,
    sourceUrl: SOURCE.url,
    rules: rowsToRules(mainTable),
  };

  const [example1, example2] = parseTables(onPage(PAGES.examples));
  if (!example1 || !example2)
    throw new Error("Expected two example tables on the compilation page");
  const exampleGuide = (n: 1 | 2, rows: typeof example1): Guide => ({
    id: `handbook-example-${n}`,
    title: `Handbook Example ${n}`,
    issuedBy: SOURCE.publisher,
    date: "2018-10-01",
    originalClassificationAuthority: "Illustrative example (no OCA)",
    sourceUrl: SOURCE.url,
    rules: rowsToRules(rows),
  });

  const paragraphs = parseExercise(onPage(PAGES.exercise));
  const key = parseAnswerKey(onPage(PAGES.answerKey));

  return {
    source: { ...SOURCE, sha256: sourceSha256, pages: PAGES },
    guide,
    examples: [exampleGuide(1, example1), exampleGuide(2, example2)],
    exercise: { paragraphs },
    answerKey: {
      banner: key.banner,
      documentDate: key.documentDate,
      authorityBlock: key.authorityBlock,
      paragraphs: alignKey(paragraphs, key),
    },
  };
}
