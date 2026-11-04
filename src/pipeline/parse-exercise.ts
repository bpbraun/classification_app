import type { KeyParagraph } from "../core/compare";
import type { Level, Marking, Paragraph } from "../core/types";
import { lineText, normalizeSpace, type Line } from "./layout";

const BLANK_PORTION = /^\(\s*\)\s*/;
const KEY_PORTION = /^\((TS|S|C|U)((?:\/{1,2}[A-Z][A-Z ,]*)*)\)\s*/;
const CONTROL_EXPANSIONS: Readonly<Record<string, string>> = { NF: "NOFORN" };
const MONTH_DATE =
  /^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})$/;
const STOP_LINE = /^(Classified By:|Derived From:|Declassify On:)|^[A-Z ]+\/\/[A-Z]+$|^_+$/;

/** Splits the blank exercise into paragraphs, each starting with an empty "( )" portion mark. */
export function parseExercise(lines: readonly Line[]): Paragraph[] {
  return splitPortions(lines, BLANK_PORTION).map((text, i) => ({
    id: i === 0 ? "title" : `p${i}`,
    text,
  }));
}

export interface ParsedKey {
  banner: string;
  documentDate: string;
  portions: { marking: Marking; text: string }[];
  authorityBlock: { classifiedBy: string; derivedFrom: string; declassifyOn: string };
}

/** Reads ISOO's marked answer key: banner, date, each marked portion, and the authority block. */
export function parseAnswerKey(lines: readonly Line[]): ParsedKey {
  const texts = lines.map(lineText);
  const banner = texts.find(
    (t) => /^[A-Z ]+(\/\/[A-Z ]+)*$/.test(t) && /SECRET|CONFIDENTIAL|UNCLASSIFIED/.test(t),
  );
  const date = texts.find((t) => MONTH_DATE.test(t));
  const portions = splitPortions(lines, KEY_PORTION, true).map((raw) => {
    const match = KEY_PORTION.exec(raw);
    if (!match) throw new Error(`Answer key portion has no marking: "${raw.slice(0, 40)}"`);
    return {
      marking: parsePortionMarking(match[1] as Level, match[2] ?? ""),
      text: raw.slice(match[0].length),
    };
  });
  if (!banner || !date) throw new Error("Answer key is missing its banner or date");
  return {
    banner,
    documentDate: toIsoDate(date),
    portions,
    authorityBlock: {
      classifiedBy: labeled(texts, "Classified By:"),
      derivedFrom: labeled(texts, "Derived From:"),
      declassifyOn: labeled(texts, "Declassify On:"),
    },
  };
}

/**
 * Lines each exercise paragraph up with the key portion that contains its text.
 * The key sometimes merges paragraphs; each merged paragraph then gets a note.
 */
export function alignKey(paragraphs: readonly Paragraph[], key: ParsedKey): KeyParagraph[] {
  const keyTexts = key.portions.map((p) => comparable(p.text));
  return paragraphs.map((paragraph) => {
    const text = comparable(paragraph.text);
    const index = keyTexts.findIndex((k) => k.includes(text));
    const portion = key.portions[index];
    if (!portion) throw new Error(`No answer key portion contains paragraph ${paragraph.id}`);
    const sharedWith = paragraphs.filter(
      (p) => p.id !== paragraph.id && keyTexts[index]?.includes(comparable(p.text)),
    );
    const aligned: KeyParagraph = { paragraphId: paragraph.id, marking: portion.marking };
    if (sharedWith.length > 0) {
      aligned.note = `ISOO's key combines this paragraph with ${sharedWith.map((p) => p.id).join(", ")} into one portion.`;
    }
    return aligned;
  });
}

export function parsePortionMarking(level: Level, controlText: string): Marking {
  const controls = controlText
    .split("/")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => CONTROL_EXPANSIONS[c] ?? c);
  return { level, controls };
}

function splitPortions(lines: readonly Line[], start: RegExp, keepPrefix = false): string[] {
  const portions: string[] = [];
  let current: string[] | null = null;
  for (const line of lines) {
    const text = lineText(line);
    if (STOP_LINE.test(text)) {
      current = null;
      continue;
    }
    if (start.test(text)) {
      current = [keepPrefix ? text : text.replace(start, "")];
      portions.push("");
    } else if (current) {
      current.push(text);
    } else {
      continue;
    }
    portions[portions.length - 1] = normalizeSpace(current.join(" "));
  }
  return portions;
}

function labeled(texts: readonly string[], label: string): string {
  const line = texts.find((t) => t.startsWith(label));
  if (!line) throw new Error(`Answer key is missing "${label}"`);
  return line.slice(label.length).trim();
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function toIsoDate(text: string): string {
  const match = MONTH_DATE.exec(text.trim());
  if (!match) throw new Error(`Expected a date like "September 4, 2018", got "${text}"`);
  const month = MONTHS.indexOf(match[1] ?? "") + 1;
  return `${match[3]}-${String(month).padStart(2, "0")}-${String(match[2]).padStart(2, "0")}`;
}

/** Text normalized for containment checks: case, quotes, and spacing ignored. */
function comparable(text: string): string {
  return normalizeSpace(text.toLowerCase().replace(/[“”"]/g, '"').replace(/[‘’']/g, "'"));
}
