import { LEVELS, bannerName, portionText, type Marking, type Rule } from "../src/core";
import type { Finding } from "../src/core/validator";
import type { ExtractedData, ProposalsFile } from "../src/data/schema";
import { h } from "./dom";
import { readableNote, type DocumentView, type PortionView } from "./state";

export interface Handlers {
  onChange(paragraphId: string, marking: Marking, focusId: string): void;
  onReset(): void;
}

const REPO_URL = "https://github.com/bpbraun/classification_app";
const CONTROL = "NOFORN";

export function renderPage(
  data: ExtractedData,
  proposals: ProposalsFile,
  view: DocumentView,
  handlers: Handlers,
): DocumentFragment {
  const page = document.createDocumentFragment();
  page.append(
    intro(data, view),
    guideSection(data),
    markingSection(data, view, handlers),
    keySection(data, view),
    conflictSection(data, view),
    howSection(data, proposals),
  );
  return page;
}

function intro(data: ExtractedData, view: DocumentView): HTMLElement {
  return h(
    "section",
    { class: "intro", "aria-labelledby": "page-title" },
    h("h1", { id: "page-title" }, "From Static Guide to Cited Markings"),
    h(
      "p",
      { class: "lede" },
      "Security classification guides live as PDFs. This walkthrough reads one into machine-readable rules, proposes a marking for every paragraph of a document with the rule behind it, and lets fixed code check each one.",
    ),
    h(
      "p",
      { class: "notice" },
      h("strong", {}, "Training material only: "),
      "Everything here comes from a public training handbook by the National Archives' Information Security Oversight Office (ISOO), ",
      h("a", { href: data.source.url }, data.source.title),
      ` (${data.source.published}). It shows the method, not performance at classified scale. Markings are for training use only.`,
    ),
    view.isFixture
      ? h(
          "p",
          { class: "notice notice-warning", role: "alert" },
          h("strong", {}, "Preview build: "),
          "The citations on this page are a hand-written placeholder, not model output.",
        )
      : null,
    h(
      "ol",
      { class: "steps", "aria-label": "Steps in this walkthrough" },
      h("li", {}, h("a", { href: "#guide" }, "The guide as rules")),
      h("li", {}, h("a", { href: "#marking" }, "Cited markings you can test")),
      h("li", {}, h("a", { href: "#key" }, "Compared with ISOO's answer key")),
      h("li", {}, h("a", { href: "#conflicts" }, "Conflicts between guides")),
      h("li", {}, h("a", { href: "#how" }, "How it works")),
    ),
  );
}

function guideSection(data: ExtractedData): HTMLElement {
  const { guide } = data;
  return section(
    "guide",
    "1. The Guide as Rules",
    h(
      "p",
      {},
      `ISOO's sample guide, "${guide.title}," is a table on page ${guide.rules[0]?.source.page ?? ""} of the PDF. The pipeline reads that table straight from the file into ${guide.rules.length} structured rules. Each rule keeps a link to the row it came from.`,
    ),
    h(
      "table",
      { class: "rules" },
      h("caption", {}, `${guide.title}, issued ${guide.date} by ${guide.issuedBy}`),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          [
            "Element of information",
            "Level",
            "Reason",
            "Declassify after",
            "Controls",
            "Source",
          ].map((c) => h("th", { scope: "col" }, c)),
        ),
      ),
      h(
        "tbody",
        {},
        guide.rules.map((rule) =>
          h(
            "tr",
            {},
            h("th", { scope: "row", "data-label": "Element" }, rule.element),
            h("td", { "data-label": "Level" }, levelBadge(rule.level)),
            h("td", { "data-label": "Reason" }, rule.reasons.join(", ") || "None"),
            h(
              "td",
              { "data-label": "Declassify after" },
              rule.durationYears ? `${rule.durationYears} years` : "Not applicable",
            ),
            h("td", { "data-label": "Controls" }, rule.controls.join(", ") || "None"),
            h("td", { "data-label": "Source" }, sourceLink(data, rule)),
          ),
        ),
      ),
    ),
  );
}

function markingSection(data: ExtractedData, view: DocumentView, handlers: Handlers): HTMLElement {
  const reset = h(
    "button",
    {
      type: "button",
      id: "reset-button",
      class: "button",
      disabled: !view.portions.some((p) => p.changed),
    },
    "Reset to proposed markings",
  );
  reset.addEventListener("click", () => handlers.onReset());
  return section(
    "marking",
    "2. Cited Markings You Can Test",
    h(
      "p",
      {},
      "A model read each paragraph of ISOO's exercise document and reported which elements of the guide it reveals. It never saw the levels. Fixed code then set each marking from the cited rules and built the classification block.",
    ),
    h(
      "p",
      { class: "callout" },
      h("strong", {}, "Try to break it: "),
      "Change any marking below. The check compares your choice with what the cited rules support and tells you what's wrong.",
    ),
    h(
      "div",
      { class: "document" },
      h("p", { class: "banner" }, view.banner),
      view.portions.map((portion) => portionBlock(data, portion, handlers)),
      authorityBlock(view),
      h("p", { class: "banner" }, view.banner),
    ),
    reset,
  );
}

function portionBlock(data: ExtractedData, portion: PortionView, handlers: Handlers): HTMLElement {
  const id = portion.paragraph.id;
  const levelId = `level-${id}`;
  const controlId = `control-${id}`;
  const status = portion.check.findings;
  const supported = status.every((f) => f.kind === "supported");

  const select = h(
    "select",
    { id: levelId, "aria-describedby": `check-${id}` },
    LEVELS.map((level) =>
      h("option", { value: level, selected: level === portion.current.level }, bannerName(level)),
    ),
  );
  const checkbox = h("input", {
    type: "checkbox",
    id: controlId,
    checked: portion.current.controls.includes(CONTROL),
    "aria-describedby": `check-${id}`,
  });
  const readMarking = (): Marking => ({
    level: select.value as Marking["level"],
    controls: checkbox.checked ? [CONTROL] : [],
  });
  select.addEventListener("change", () => handlers.onChange(id, readMarking(), levelId));
  checkbox.addEventListener("change", () => handlers.onChange(id, readMarking(), controlId));

  return h(
    "article",
    { class: `portion${supported ? "" : " portion-flagged"}`, "aria-labelledby": `label-${id}` },
    h(
      "div",
      { class: "portion-head" },
      h("h3", { id: `label-${id}` }, portion.label),
      h(
        "div",
        { class: "portion-controls" },
        h("label", { for: levelId }, "Marking"),
        select,
        h("label", { class: "check-label" }, checkbox, " NOFORN"),
      ),
    ),
    h(
      "p",
      { class: "portion-text" },
      h("span", { class: "portion-mark" }, portionText(portion.current)),
      " ",
      portion.paragraph.text,
    ),
    h(
      "p",
      { class: "citation" },
      h("span", { class: "meta-label" }, "Cites: "),
      portion.check.citedRules.length > 0
        ? portion.check.citedRules.flatMap((rule, i) => [
            i > 0 ? "; " : "",
            h("a", { href: sourceHref(data, rule) }, rule.element),
            ` (${rule.level})`,
          ])
        : "No rule",
    ),
    portion.proposal.rationale
      ? h(
          "p",
          { class: "rationale" },
          h("span", { class: "meta-label" }, "Why: "),
          portion.proposal.rationale,
        )
      : null,
    h(
      "div",
      { class: `check ${supported ? "check-ok" : "check-flag"}`, id: `check-${id}` },
      status.map((f) => findingLine(f)),
    ),
  );
}

function findingLine(finding: Finding): HTMLElement {
  const labels: Record<Finding["kind"], string> = {
    supported: "Supported",
    "unknown-rule": "Unknown rule",
    "no-guidance": "No guidance",
    "under-classified": "Under-classified",
    "over-classified": "Over-classified",
    "missing-control": "Missing control",
    "extra-control": "Extra control",
  };
  const ok = finding.kind === "supported";
  return h(
    "p",
    {},
    h("span", { class: "check-icon", "aria-hidden": "true" }, ok ? "✓" : "!"),
    h("strong", {}, `${labels[finding.kind]}: `),
    finding.message,
  );
}

function authorityBlock(view: DocumentView): HTMLElement {
  const block = view.authorityBlock;
  if (!block)
    return h("p", { class: "authority" }, "Unclassified document: no classification block.");
  return h(
    "dl",
    { class: "authority" },
    h("dt", {}, "Classified By:"),
    h("dd", {}, block.classifiedBy),
    h("dt", {}, "Derived From:"),
    h("dd", {}, block.derivedFrom),
    h("dt", {}, "Declassify On:"),
    h("dd", {}, block.declassifyOn),
  );
}

function keySection(data: ExtractedData, view: DocumentView): HTMLElement {
  const { summary, rows } = view.comparison;
  const key = data.answerKey;
  const ours = view.authorityBlock;
  return section(
    "key",
    "3. Compared With ISOO's Answer Key",
    h(
      "p",
      {},
      `ISOO publishes its own marked answer for this exercise. The current markings agree with it on ${summary.agree} of ${summary.total} portions. Where they differ, the table shows the rule the demo cited so a person can judge.`,
    ),
    h(
      "table",
      { class: "compare" },
      h("caption", {}, "Portion markings: this demo and ISOO's answer key"),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          ["Portion", "This demo", "ISOO's key", "Result"].map((c) => h("th", { scope: "col" }, c)),
        ),
      ),
      h(
        "tbody",
        {},
        rows.map((row) => {
          const portion = view.portions.find((p) => p.paragraph.id === row.paragraphId);
          return h(
            "tr",
            { class: row.agrees ? "" : "row-differs" },
            h("th", { scope: "row", "data-label": "Portion" }, portion?.label ?? row.paragraphId),
            h(
              "td",
              { "data-label": "This demo" },
              row.proposed ? portionText(row.proposed) : "None",
            ),
            h("td", { "data-label": "ISOO's key" }, portionText(row.key)),
            h(
              "td",
              { "data-label": "Result" },
              row.agrees ? "Agrees" : `Differs. Demo cites ${citedSummary(portion)}.`,
              row.note ? h("span", { class: "note" }, ` ${readableNote(row.note)}`) : null,
            ),
          );
        }),
      ),
    ),
    h("h3", {}, "Classification Block"),
    h(
      "div",
      { class: "two-col" },
      h(
        "div",
        {},
        h("h4", {}, "This demo"),
        ours
          ? h(
              "p",
              {},
              `Banner: ${view.banner}`,
              h("br"),
              `Derived From: ${ours.derivedFrom}`,
              h("br"),
              `Declassify On: ${ours.declassifyOn}`,
            )
          : h("p", {}, "Unclassified: no block."),
      ),
      h(
        "div",
        {},
        h("h4", {}, "ISOO's key"),
        h(
          "p",
          {},
          `Banner: ${key.banner}`,
          h("br"),
          `Derived From: ${key.authorityBlock.derivedFrom}`,
          h("br"),
          `Declassify On: ${key.authorityBlock.declassifyOn}`,
        ),
      ),
    ),
  );
}

function citedSummary(portion: PortionView | undefined): string {
  const rules = portion?.check.citedRules ?? [];
  if (rules.length === 0) return "no rule";
  return rules.map((r) => `"${r.element}" (${r.level})`).join(", ");
}

function conflictSection(data: ExtractedData, view: DocumentView): HTMLElement {
  const [one, two] = data.examples;
  return section(
    "conflicts",
    "4. Conflicts Between Guides",
    h(
      "p",
      {},
      `The handbook's page ${one?.rules[0]?.source.page ?? ""} uses two example tables to teach classification by compilation. Read as two guides, they treat the same elements differently. The check pairs elements by their wording and flags every difference. These are illustrative examples, not real guides.`,
    ),
    h(
      "table",
      { class: "compare" },
      h("caption", {}, `${one?.title ?? ""} compared with ${two?.title ?? ""}`),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          ["Element", one?.title ?? "A", two?.title ?? "B", "Differs on"].map((c) =>
            h("th", { scope: "col" }, c),
          ),
        ),
      ),
      h(
        "tbody",
        {},
        view.conflicts.map((c) =>
          h(
            "tr",
            { class: "row-differs" },
            h("th", { scope: "row", "data-label": "Element" }, c.a.element),
            h("td", { "data-label": one?.title ?? "A" }, ruleSummary(c.a)),
            h("td", { "data-label": two?.title ?? "B" }, ruleSummary(c.b)),
            h("td", { "data-label": "Differs on" }, c.differences.join(", ")),
          ),
        ),
      ),
    ),
    h(
      "p",
      { class: "callout" },
      "Each conflict goes to the responsible Original Classification Authorities to decide. The tool flags; it never picks a winner.",
    ),
  );
}

function ruleSummary(rule: Rule): string {
  const parts = [bannerName(rule.level)];
  if (rule.reasons.length > 0) parts.push(rule.reasons.join(", "));
  if (rule.durationYears) parts.push(`${rule.durationYears} years`);
  if (rule.controls.length > 0) parts.push(rule.controls.join(", "));
  return parts.join(" · ");
}

function howSection(data: ExtractedData, proposals: ProposalsFile): HTMLElement {
  const p = proposals.provenance;
  return section(
    "how",
    "5. How It Works",
    h(
      "ul",
      { class: "how-list" },
      h(
        "li",
        {},
        h("strong", {}, "The model narrows the search: "),
        "It sees each rule's id and wording, never its level, and must answer in a strict format. Paragraph text is treated as data, so instructions hidden in a document can't steer it.",
      ),
      h(
        "li",
        {},
        h("strong", {}, "Fixed code decides: "),
        "The marking is the highest level among the cited rules, with every control they carry. The banner and Declassify On date follow from the same rules. Unknown rules, missing guidance, and unsupported markings are flagged.",
      ),
      h(
        "li",
        {},
        h("strong", {}, "People own the call: "),
        "Every marking shows its citation and links to the source row, so a classifier can confirm it in seconds.",
      ),
    ),
    h(
      "dl",
      { class: "provenance" },
      h("dt", {}, "Citations"),
      h(
        "dd",
        {},
        p.kind === "model"
          ? `${p.model ?? "Model"}, generated ${p.createdAt.slice(0, 10)}`
          : p.description,
      ),
      h("dt", {}, "Prompt template"),
      h(
        "dd",
        {},
        p.promptTemplateSha256 ? `SHA-256 ${p.promptTemplateSha256.slice(0, 12)}…` : "Not recorded",
      ),
      h("dt", {}, "Source PDF"),
      h("dd", {}, `SHA-256 ${data.source.sha256.slice(0, 12)}…`),
      h("dt", {}, "Code"),
      h("dd", {}, h("a", { href: REPO_URL }, "github.com/bpbraun/classification_app")),
    ),
    h(
      "div",
      { class: "contact" },
      h("p", {}, h("strong", {}, "Braun Applied Intelligence")),
      h(
        "p",
        {},
        "Benjy Braun, Co-Founder and Head of Delivery · ",
        h("a", { href: "mailto:benjy@braun-ai.com" }, "benjy@braun-ai.com"),
        " · ",
        h("a", { href: "https://www.braun-ai.com" }, "www.braun-ai.com"),
      ),
    ),
  );
}

function section(id: string, title: string, ...children: (Node | Node[] | null)[]): HTMLElement {
  return h(
    "section",
    { id, "aria-labelledby": `${id}-title` },
    h("h2", { id: `${id}-title`, tabindex: "-1" }, title),
    ...children,
  );
}

function levelBadge(level: Marking["level"]): HTMLElement {
  return h("span", { class: `badge badge-${level.toLowerCase()}` }, bannerName(level));
}

function sourceHref(data: ExtractedData, rule: Rule): string {
  return `${data.source.url}#page=${rule.source.page}`;
}

function sourceLink(data: ExtractedData, rule: Rule): HTMLElement {
  return h("a", { href: sourceHref(data, rule) }, `p. ${rule.source.page}, row ${rule.source.row}`);
}
