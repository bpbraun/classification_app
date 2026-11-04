import { bannerText, overallMarking } from "./levels";
import { resolveRules } from "./validator";
import type { Guide, Marking } from "./types";

export interface AuthorityBlock {
  classifiedBy: string;
  derivedFrom: string;
  /** YYYYMMDD, or null when the cited rules don't support a date. */
  declassifyOn: string | null;
  /** Why there is no date, for a person to resolve. Null when there is a date. */
  problem: string | null;
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

/** One portion as marked, with the rules it cites. */
export interface MarkedPortion {
  citedRuleIds: readonly string[];
  marking: Marking;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parses YYYY-MM-DD, rejecting impossible months and days. */
export function parseIsoDate(isoDate: string): { year: number; month: number; day: number } {
  const match = ISO_DATE.exec(isoDate);
  if (!match) throw new Error(`Expected YYYY-MM-DD, got "${isoDate}"`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > lastDayOfMonth(year, month)) {
    throw new Error(`"${isoDate}" is not a real date`);
  }
  return { year, month, day };
}

export function addYears(isoDate: string, years: number): string {
  const { year, month, day } = parseIsoDate(isoDate);
  const target = year + years;
  return `${target}-${pad(month)}-${pad(Math.min(day, lastDayOfMonth(target, month)))}`;
}

export function compactDate(isoDate: string): string {
  parseIsoDate(isoDate);
  return isoDate.replaceAll("-", "");
}

/**
 * Overall marking and classification authority block for a document as it is marked now.
 * Declassify On follows the longest duration among the classified rules cited by portions
 * marked classified. It is left empty, with the reason, whenever the citations can't
 * support a date.
 */
export function assembleDocument(
  guide: Guide,
  portions: readonly MarkedPortion[],
  options: AssembleOptions,
): AssembledDocument {
  const overall = overallMarking(portions.map((p) => p.marking));
  const banner = bannerText(overall);
  if (overall.level === "U") return { overall, banner, authorityBlock: null };

  // Only portions marked classified contribute, and each must cite a classified rule.
  const classifiedPortions = portions.filter((p) => p.marking.level !== "U");
  const rulesPerPortion = classifiedPortions.map((p) =>
    resolveRules(guide, p.citedRuleIds).filter((r) => r.level !== "U"),
  );
  const classifiedRules = rulesPerPortion.flat();
  const undated = classifiedRules.filter((r) => r.durationYears === null);

  let declassifyOn: string | null = null;
  let problem: string | null = null;
  if (rulesPerPortion.some((rules) => rules.length === 0)) {
    problem =
      "A portion marked classified cites no classified rule, so the guide gives no duration for it. Refer to the OCA.";
  } else if (undated.length > 0) {
    problem = `"${undated[0]?.element}" has no duration in the guide. Refer to the OCA.`;
  } else {
    const years = Math.max(...classifiedRules.map((r) => r.durationYears ?? 0));
    declassifyOn = compactDate(addYears(options.documentDate, years));
  }

  return {
    overall,
    banner,
    authorityBlock: {
      classifiedBy: options.classifiedBy,
      derivedFrom: `${guide.title}, dated ${compactDate(guide.date)}`,
      declassifyOn,
      problem,
    },
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
