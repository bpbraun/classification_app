import { bannerText, maxLevel, unionControls } from "./levels";
import { resolveRules } from "./validator";
import type { Guide, Marking } from "./types";

export interface AuthorityBlock {
  classifiedBy: string;
  derivedFrom: string;
  declassifyOn: string;
}

export interface AssembledDocument {
  overall: Marking;
  banner: string;
  /** Null when the document is unclassified. */
  authorityBlock: AuthorityBlock | null;
}

export interface AssembleOptions {
  /** ISO date the document was created, YYYY-MM-DD. */
  documentDate: string;
  classifiedBy: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function addYears(isoDate: string, years: number): string {
  const match = ISO_DATE.exec(isoDate);
  if (!match) throw new Error(`Expected YYYY-MM-DD, got "${isoDate}"`);
  const year = Number(match[1]) + years;
  const month = Number(match[2]);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(Number(match[3]), lastDay);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Overall marking and classification authority block for a document, from its citations. */
export function assembleDocument(
  guide: Guide,
  portions: readonly { paragraphId: string; citedRuleIds: readonly string[] }[],
  options: AssembleOptions,
): AssembledDocument {
  const rules = portions.flatMap((p) => resolveRules(guide, p.citedRuleIds));
  const overall: Marking = {
    level: maxLevel(rules.map((r) => r.level)),
    controls: unionControls(rules.map((r) => r.controls)),
  };
  const classified = rules.filter((r) => r.level !== "U");
  if (classified.length === 0)
    return { overall, banner: bannerText(overall), authorityBlock: null };

  const years = Math.max(...classified.map((r) => r.durationYears ?? 0));
  return {
    overall,
    banner: bannerText(overall),
    authorityBlock: {
      classifiedBy: options.classifiedBy,
      derivedFrom: `${guide.title}, dated ${compact(guide.date)}`,
      declassifyOn: compact(addYears(options.documentDate, years)),
    },
  };
}

function compact(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
