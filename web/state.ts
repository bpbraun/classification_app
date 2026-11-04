import {
  assembleDocument,
  checkProposal,
  compactDate,
  compareToKey,
  findConflicts,
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
  /** What the portion is marked right now. Null only when no rule applies and nothing was chosen. */
  current: Marking | null;
  changed: boolean;
  check: CheckResult;
}

export interface DocumentView {
  portions: PortionView[];
  banner: string;
  authorityBlock: AuthorityBlock | null;
  /** True when our Declassify On is the same date as ISOO's, whatever the format. */
  declassifyMatchesKey: boolean;
  comparison: Comparison;
  conflicts: Conflict[];
  supportedCount: number;
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
  const assembled = assembleDocument(
    data.guide,
    portions.map((p) => ({
      citedRuleIds: p.proposal.citedRuleIds,
      marking: p.current ?? UNMARKED,
    })),
    { documentDate: data.answerKey.documentDate, classifiedBy },
  );
  const [exampleOne, exampleTwo] = data.examples;
  const keyDate = compactDate(data.answerKey.authorityBlock.declassifyOnDate);

  return {
    portions,
    banner: assembled.banner,
    authorityBlock: assembled.authorityBlock,
    declassifyMatchesKey: assembled.authorityBlock?.declassifyOn === keyDate,
    comparison: compareToKey(
      portions.flatMap((p) =>
        p.current ? [{ paragraphId: p.paragraph.id, marking: p.current }] : [],
      ),
      data.answerKey.paragraphs,
    ),
    conflicts: exampleOne && exampleTwo ? findConflicts(exampleOne, exampleTwo) : [],
    supportedCount: portions.filter((p) => p.check.findings.every((f) => f.kind === "supported"))
      .length,
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
  const check = checkProposal(data.guide, proposal, override);
  return {
    paragraph,
    label: labelFor(paragraph.id),
    proposal,
    proposed: check.derived,
    current: override ?? check.derived,
    changed: override !== undefined,
    check,
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
