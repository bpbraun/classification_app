import { sameControls } from "./levels";
import type { Guide, Rule } from "./types";

export type Difference = "level" | "reasons" | "duration" | "controls";

export interface Conflict {
  a: Rule;
  b: Rule;
  /** Word-overlap score between the two elements, 0 to 1. */
  similarity: number;
  differences: Difference[];
}

const FILLER_WORDS = new Set(["a", "an", "the", "of", "and", "or", "in", "into", "to", "for"]);

/** The meaningful words of an element description, for matching across guides. */
export function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0 && !FILLER_WORDS.has(w)),
  );
}

/** Jaccard overlap of significant words. 1 means the same words, 0 means none shared. */
export function similarity(a: string, b: string): number {
  const x = significantWords(a);
  const y = significantWords(b);
  const shared = [...x].filter((w) => y.has(w)).length;
  const total = new Set([...x, ...y]).size;
  return total === 0 ? 0 : shared / total;
}

/**
 * Pairs each rule in guide A with its closest element in guide B and reports
 * pairs that assign different treatment. Resolution is left to the OCAs.
 */
export function findConflicts(a: Guide, b: Guide, threshold = 0.8): Conflict[] {
  return a.rules.flatMap((ruleA) => {
    const match = closestMatch(ruleA, b.rules, threshold);
    if (!match) return [];
    const differences = differencesBetween(ruleA, match.rule);
    return differences.length > 0
      ? [{ a: ruleA, b: match.rule, similarity: match.score, differences }]
      : [];
  });
}

function closestMatch(rule: Rule, candidates: readonly Rule[], threshold: number) {
  let best: { rule: Rule; score: number } | null = null;
  for (const candidate of candidates) {
    const score = similarity(rule.element, candidate.element);
    if (score >= threshold && (best === null || score > best.score))
      best = { rule: candidate, score };
  }
  return best;
}

function differencesBetween(a: Rule, b: Rule): Difference[] {
  const differences: Difference[] = [];
  if (a.level !== b.level) differences.push("level");
  if (!sameControls(a.reasons, b.reasons)) differences.push("reasons");
  if (a.durationYears !== b.durationYears) differences.push("duration");
  if (!sameControls(a.controls, b.controls)) differences.push("controls");
  return differences;
}
