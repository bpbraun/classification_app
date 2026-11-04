import { sameControls } from "./levels";
import type { Marking } from "./types";

export interface MarkedParagraph {
  paragraphId: string;
  marking: Marking;
}

export interface KeyParagraph extends MarkedParagraph {
  /** Context about the key itself, e.g. that it combines two paragraphs. */
  note?: string;
}

export interface ComparisonRow {
  paragraphId: string;
  proposed: Marking | null;
  key: Marking;
  agrees: boolean;
  note?: string;
}

export interface Comparison {
  rows: ComparisonRow[];
  summary: { agree: number; disagree: number; missing: number; total: number };
}

export function sameMarking(a: Marking, b: Marking): boolean {
  return a.level === b.level && sameControls(a.controls, b.controls);
}

/** Compares proposed markings with an answer key, paragraph by paragraph, in key order. */
export function compareToKey(
  proposed: readonly MarkedParagraph[],
  key: readonly KeyParagraph[],
): Comparison {
  const rows = key.map((k): ComparisonRow => {
    const match = proposed.find((p) => p.paragraphId === k.paragraphId)?.marking ?? null;
    const row: ComparisonRow = {
      paragraphId: k.paragraphId,
      proposed: match,
      key: k.marking,
      agrees: match !== null && sameMarking(match, k.marking),
    };
    if (k.note !== undefined) row.note = k.note;
    return row;
  });
  const missing = rows.filter((r) => r.proposed === null).length;
  const agree = rows.filter((r) => r.agrees).length;
  return {
    rows,
    summary: { agree, disagree: rows.length - agree - missing, missing, total: rows.length },
  };
}
