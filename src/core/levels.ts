import { LEVELS, type Level, type Marking } from "./types";

const BANNER_NAMES: Record<Level, string> = {
  U: "UNCLASSIFIED",
  C: "CONFIDENTIAL",
  S: "SECRET",
  TS: "TOP SECRET",
};

/** Portion-mark abbreviations for controls that have one. Others print as written. */
const PORTION_ABBREVIATIONS: Readonly<Record<string, string>> = { NOFORN: "NF" };

export function compareLevels(a: Level, b: Level): number {
  return LEVELS.indexOf(a) - LEVELS.indexOf(b);
}

export function maxLevel(levels: readonly Level[]): Level {
  return levels.reduce<Level>((highest, l) => (compareLevels(l, highest) > 0 ? l : highest), "U");
}

export function bannerName(level: Level): string {
  return BANNER_NAMES[level];
}

export function portionText(marking: Marking): string {
  const controls = marking.controls.map((c) => PORTION_ABBREVIATIONS[c] ?? c);
  return `(${[marking.level, ...controls].join("//")})`;
}

export function bannerText(marking: Marking): string {
  return [BANNER_NAMES[marking.level], ...marking.controls].join("//");
}

/** Sorted, de-duplicated union of control lists. */
export function unionControls(lists: readonly (readonly string[])[]): string[] {
  return [...new Set(lists.flat())].sort();
}

export function sameControls(a: readonly string[], b: readonly string[]): boolean {
  const x = unionControls([a]);
  const y = unionControls([b]);
  return x.length === y.length && x.every((c, i) => c === y[i]);
}
