/** Classification levels in ascending order. */
export const LEVELS = ["U", "C", "S", "TS"] as const;
export type Level = (typeof LEVELS)[number];

/** Where a rule came from in the source document, so every rule can be checked by a person. */
export interface SourceRef {
  /** Printed page number in the source PDF. */
  page: number;
  /** Row of the classification table, counting from 1. */
  row: number;
}

/** One element of information from a security classification guide, as structured data. */
export interface Rule {
  id: string;
  element: string;
  level: Level;
  /** E.O. 13526 Sec. 1.4 categories, e.g. "1.4(a)". Empty when unclassified. */
  reasons: string[];
  /** Years from the document's date until declassification. Null when unclassified. */
  durationYears: number | null;
  /** Dissemination controls such as NOFORN or "REL TO USA, GBR". */
  controls: string[];
  source: SourceRef;
}

export interface Guide {
  id: string;
  title: string;
  issuedBy: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  originalClassificationAuthority: string;
  sourceUrl: string;
  rules: Rule[];
}

export interface Paragraph {
  id: string;
  text: string;
}

/** The proposer's answer for one paragraph: which rules apply and why. */
export interface Proposal {
  paragraphId: string;
  citedRuleIds: string[];
  rationale: string;
}

export interface Marking {
  level: Level;
  controls: string[];
}
