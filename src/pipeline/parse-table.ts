import type { Level, Rule } from "../core/types";
import { normalizeSpace, type Line } from "./layout";

export type ColumnName =
  "element" | "level" | "reason" | "duration" | "controls" | "cui" | "remarks";

/** Header words that open each column, in left-to-right order. */
const HEADER_STARTS: readonly (readonly [ColumnName, RegExp])[] = [
  ["element", /^Element of Information$/],
  ["level", /^Classification$/],
  ["reason", /^Reason/],
  ["duration", /^(Declassification|Duration of|Declassify On)/],
  ["controls", /^Dissemination$/],
  ["cui", /^Controlled$/],
  ["remarks", /^Remarks$/],
];

/** Text can start a little left of its column header. */
const COLUMN_LEAD = 12;
/** Wrapped text inside a cell sits closer than this to the line above it. */
const CELL_LINE_GAP = 13;

export interface RawRow {
  page: number;
  row: number;
  cells: Partial<Record<ColumnName, string>>;
}

interface Column {
  name: ColumnName;
  left: number;
}

/** Finds every classification table on the given lines and returns its rows as raw text. */
export function parseTables(lines: readonly Line[]): RawRow[][] {
  const tables: RawRow[][] = [];
  lines.forEach((line, index) => {
    const columns = headerColumns(line);
    if (columns) tables.push(readTable(lines, index + 1, columns, line.page));
  });
  return tables;
}

function headerColumns(line: Line): Column[] | null {
  const columns: Column[] = [];
  for (const [name, pattern] of HEADER_STARTS) {
    const item = line.items.find((i) => pattern.test(i.text.trim()));
    if (item) columns.push({ name, left: item.x - COLUMN_LEAD });
  }
  const hasElementAndLevel = columns.some((c) => c.name === "element") && columns.length >= 4;
  return hasElementAndLevel ? columns : null;
}

function readTable(lines: readonly Line[], start: number, columns: Column[], page: number) {
  const rows: RawRow[] = [];
  let previousY: number | null = null;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.page !== page || headerColumns(line)) break;
    const cells = assignCells(line, columns);
    if (cells.element === undefined && rows.length === 0) continue; // header continuation lines
    const startsRow = cells.level !== undefined;
    const continues = previousY !== null && previousY - line.y <= CELL_LINE_GAP;
    if (!startsRow && !continues) break;
    if (startsRow) rows.push({ page, row: rows.length + 1, cells });
    else appendCells(rows.at(-1), cells);
    previousY = line.y;
  }
  return rows;
}

function assignCells(line: Line, columns: Column[]): Partial<Record<ColumnName, string>> {
  const cells: Partial<Record<ColumnName, string>> = {};
  for (const item of line.items) {
    const column = [...columns].reverse().find((c) => item.x >= c.left) ?? columns[0];
    if (!column) continue;
    cells[column.name] = normalizeSpace(`${cells[column.name] ?? ""} ${item.text}`);
  }
  return cells;
}

function appendCells(row: RawRow | undefined, cells: Partial<Record<ColumnName, string>>) {
  if (!row) return;
  for (const [name, text] of Object.entries(cells) as [ColumnName, string][]) {
    row.cells[name] = normalizeSpace(`${row.cells[name] ?? ""} ${text}`);
  }
}

const LEVEL_WORDS: readonly (readonly [RegExp, Level])[] = [
  [/^(top secret|ts)\b/i, "TS"],
  [/^(secret|s)\b/i, "S"],
  [/^(confidential|c)\b/i, "C"],
  [/^(unclassified|u)\b/i, "U"],
];

export function parseLevel(text: string): Level {
  const match = LEVEL_WORDS.find(([pattern]) => pattern.test(text.trim()));
  if (!match) throw new Error(`Unrecognized classification level "${text}"`);
  return match[1];
}

/**
 * Reads E.O. 13526 Sec. 1.4 categories, including shorthand like "1.4(a), (c)".
 * A reason cell holds only reasons, so every "(x)" after a "1.4" counts.
 */
export function parseReasons(text: string | undefined): string[] {
  const value = text ?? "";
  const start = value.search(/1\.4/);
  if (start < 0) return [];
  const letters = [...value.slice(start).matchAll(/\(\s*([a-h])\s*\)/gi)].map((m) =>
    (m[1] ?? "").toLowerCase(),
  );
  return [...new Set(letters)].sort().map((l) => `1.4(${l})`);
}

export function parseDurationYears(text: string | undefined): number | null {
  const match = /(\d+)\s*years?/i.exec(text ?? "");
  return match ? Number(match[1]) : null;
}

const NO_CONTROLS = /^(none|n\/a|na|-+|—)$/i;

/**
 * Reads dissemination controls. Controls are separated by commas, semicolons, or slashes,
 * except that "REL TO" takes the country list that follows it.
 */
export function parseControls(text: string | undefined): string[] {
  const value = normalizeSpace(text ?? "");
  if (value.length === 0 || NO_CONTROLS.test(value)) return [];
  const relTo = /REL TO\b.*$/i.exec(value);
  const before = relTo ? value.slice(0, relTo.index) : value;
  const controls = before
    .split(/[\s,;/]+/)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length > 0 && !NO_CONTROLS.test(c));
  if (relTo) controls.push(normalizeSpace(relTo[0]).replace(/^rel to/i, "REL TO"));
  return controls;
}

/** Turns raw table rows into rules with stable, readable ids. */
export function rowsToRules(rows: readonly RawRow[]): Rule[] {
  const used = new Set<string>();
  return rows.map((row) => {
    const element = row.cells.element ?? "";
    if (element.length === 0) throw new Error(`Row ${row.row} on page ${row.page} has no element`);
    const level = parseLevel(row.cells.level ?? "");
    return {
      id: uniqueSlug(element, used),
      element,
      level,
      reasons: parseReasons(row.cells.reason),
      durationYears: level === "U" ? null : parseDurationYears(row.cells.duration),
      controls: parseControls(row.cells.controls),
      source: { page: row.page, row: row.row },
    };
  });
}

/** Longest slug kept, cut back to a whole word. */
const MAX_SLUG_LENGTH = 48;

function uniqueSlug(text: string, used: Set<string>): string {
  const full = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  let base = full;
  if (full.length > MAX_SLUG_LENGTH) {
    const wordEnd = full.slice(0, MAX_SLUG_LENGTH + 1).lastIndexOf("-");
    base = wordEnd > 0 ? full.slice(0, wordEnd) : full.slice(0, MAX_SLUG_LENGTH);
  }
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  used.add(slug);
  return slug;
}
