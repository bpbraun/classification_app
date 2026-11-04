import {
  assembleDocument,
  bannerText,
  checkProposal,
  compareToKey,
  findConflicts,
  maxLevel,
  unionControls,
  type AuthorityBlock,
  type CheckResult,
  type Comparison,
  type Conflict,
  type Marking,
  type Paragraph,
  type Proposal,
} from "../src/core";
import type { ExtractedData, ProposalsFile } from "../src/data/schema";

/** Everything the page shows about one portion, given the viewer's current choices. */
export interface PortionView {
  paragraph: Paragraph;
  label: string;
  proposal: Proposal;
  /** What the cited rules support. Null when no rule applies. */
  proposed: Marking | null;
  /** What the portion is marked right now: the viewer's override, or the proposed marking. */
  current: Marking;
  changed: boolean;
  check: CheckResult;
}

export interface DocumentView {
  portions: PortionView[];
  banner: string;
  authorityBlock: AuthorityBlock | null;
  comparison: Comparison;
  conflicts: Conflict[];
  isFixture: boolean;
}

export type Overrides = ReadonlyMap<string, Marking>;

const UNMARKED: Marking = { level: "U", controls: [] };

export function labelFor(paragraphId: string): string {
  return paragraphId === "title" ? "Title" : paragraphId.replace(/^p(\d+)$/, "Paragraph $1");
}

/** Rewrites paragraph ids inside notes as readable labels. */
export function readableNote(note: string): string {
  return note.replace(/\bp(\d+)\b/g, "Paragraph $1");
}

export function buildView(
  data: ExtractedData,
  proposals: ProposalsFile,
  overrides: Overrides,
  classifiedBy: string,
): DocumentView {
  const portions = data.exercise.paragraphs.map((paragraph) =>
    buildPortion(data, proposalFor(proposals, paragraph.id), paragraph, overrides),
  );
  const current = portions.map((p) => p.current);
  const overall: Marking = {
    level: maxLevel(current.map((m) => m.level)),
    controls: unionControls(current.map((m) => m.controls)),
  };
  const assembled = assembleDocument(data.guide, proposals.proposals, {
    documentDate: data.answerKey.documentDate,
    classifiedBy,
  });
  const [exampleOne, exampleTwo] = data.examples;

  return {
    portions,
    banner: bannerText(overall),
    authorityBlock: overall.level === "U" ? null : assembled.authorityBlock,
    comparison: compareToKey(
      portions.map((p) => ({ paragraphId: p.paragraph.id, marking: p.current })),
      data.answerKey.paragraphs,
    ),
    conflicts: exampleOne && exampleTwo ? findConflicts(exampleOne, exampleTwo) : [],
    isFixture: proposals.provenance.kind !== "model",
  };
}

function buildPortion(
  data: ExtractedData,
  proposal: Proposal,
  paragraph: Paragraph,
  overrides: Overrides,
): PortionView {
  const override = overrides.get(paragraph.id);
  const proposed = checkProposal(data.guide, proposal).derived;
  const current = override ?? proposed ?? UNMARKED;
  return {
    paragraph,
    label: labelFor(paragraph.id),
    proposal,
    proposed,
    current,
    changed: override !== undefined,
    check: checkProposal(data.guide, proposal, current),
  };
}

function proposalFor(file: ProposalsFile, paragraphId: string): Proposal {
  return (
    file.proposals.find((p) => p.paragraphId === paragraphId) ?? {
      paragraphId,
      citedRuleIds: [],
      rationale: "No proposal was generated for this portion.",
    }
  );
}
