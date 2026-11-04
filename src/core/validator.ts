import { compareLevels, overallMarking, portionText } from "./levels";
import type { Guide, Marking, Proposal, Rule } from "./types";

export type FindingKind =
  | "supported"
  | "unknown-rule"
  | "no-guidance"
  | "under-classified"
  | "over-classified"
  | "missing-control"
  | "extra-control";

export interface Finding {
  kind: FindingKind;
  message: string;
}

export interface CheckResult {
  /** The marking the cited rules support, or null when no valid rule is cited. */
  derived: Marking | null;
  /** The marking that was checked: the one asserted, or the derived one. */
  checked: Marking | null;
  citedRules: Rule[];
  findings: Finding[];
}

/** The marking a set of rules supports: the highest level and every control they carry. */
export function deriveMarking(rules: readonly Rule[]): Marking | null {
  return rules.length === 0 ? null : overallMarking(rules);
}

export function resolveRules(guide: Guide, ruleIds: readonly string[]): Rule[] {
  return ruleIds.flatMap((id) => guide.rules.filter((r) => r.id === id));
}

/**
 * Deterministic check of one paragraph's marking against the rules it cites.
 * The model proposes citations; this code decides whether they support the marking.
 */
export function checkProposal(guide: Guide, proposal: Proposal, asserted?: Marking): CheckResult {
  const citedRules = resolveRules(guide, proposal.citedRuleIds);
  const unknown = proposal.citedRuleIds.filter((id) => !guide.rules.some((r) => r.id === id));
  const derived = deriveMarking(citedRules);
  const checked = asserted ?? derived;

  const findings: Finding[] = unknown.map((id) => ({
    kind: "unknown-rule",
    message: `Cites "${id}", which is not in the guide.`,
  }));

  if (derived === null) {
    findings.push({
      kind: "no-guidance",
      message: "No rule in the guide applies. Route to the security office.",
    });
    return { derived, checked, citedRules, findings };
  }

  findings.push(...compareMarkings(derived, checked ?? derived));
  if (findings.length === 0) {
    findings.push({ kind: "supported", message: `Cited rules support ${portionText(derived)}.` });
  }
  return { derived, checked, citedRules, findings };
}

function compareMarkings(derived: Marking, checked: Marking): Finding[] {
  const findings: Finding[] = [];
  const order = compareLevels(checked.level, derived.level);
  if (order < 0) {
    findings.push({
      kind: "under-classified",
      message: `Marked ${checked.level}, but the cited rules require ${derived.level}.`,
    });
  }
  if (order > 0) {
    findings.push({
      kind: "over-classified",
      message: `Marked ${checked.level}, but the cited rules support only ${derived.level}.`,
    });
  }
  for (const control of derived.controls.filter((c) => !checked.controls.includes(c))) {
    findings.push({ kind: "missing-control", message: `The cited rules require ${control}.` });
  }
  for (const control of checked.controls.filter((c) => !derived.controls.includes(c))) {
    findings.push({ kind: "extra-control", message: `No cited rule calls for ${control}.` });
  }
  return findings;
}
