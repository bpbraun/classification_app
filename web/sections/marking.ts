import { LEVELS, bannerName, isLevel, portionText, type Marking } from "../../src/core";
import type { Finding } from "../../src/core/validator";
import { CONTROL } from "../config";
import { h } from "../dom";
import type { DocumentView, PortionView } from "../state";
import { ruleAnchor, section } from "./shared";

export interface Handlers {
  onChange(paragraphId: string, marking: Marking, focusId: string): void;
  onReset(): void;
}

const FINDING_LABELS: Record<Finding["kind"], string> = {
  supported: "Supported",
  "unknown-rule": "Unknown rule",
  "no-guidance": "No guidance",
  "under-classified": "Under-classified",
  "over-classified": "Over-classified",
  "missing-control": "Missing control",
  "extra-control": "Extra control",
};

export function markingSection(view: DocumentView, handlers: Handlers): HTMLElement {
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
      view.portions.map((portion) => portionBlock(portion, handlers)),
      authorityBlock(view),
      h("p", { class: "banner" }, view.banner),
    ),
    reset,
  );
}

function portionBlock(portion: PortionView, handlers: Handlers): HTMLElement {
  const id = portion.paragraph.id;
  const levelId = `level-${id}`;
  const controlId = `control-${id}`;
  const findings = portion.check.findings;
  const supported = findings.every((f) => f.kind === "supported");
  const shown = portion.current ?? { level: "U" as const, controls: [] };

  const select = h(
    "select",
    { id: levelId, "aria-describedby": `check-${id}` },
    LEVELS.map((level) =>
      h("option", { value: level, selected: level === shown.level }, bannerName(level)),
    ),
  );
  const checkbox = h("input", {
    type: "checkbox",
    id: controlId,
    checked: shown.controls.includes(CONTROL),
    "aria-describedby": `check-${id}`,
  });
  const readMarking = (): Marking => ({
    level: isLevel(select.value) ? select.value : "U",
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
        h("label", { class: "check-label" }, checkbox, ` ${CONTROL}`),
      ),
    ),
    h(
      "p",
      { class: "portion-text" },
      h(
        "span",
        { class: "portion-mark" },
        portion.current ? portionText(portion.current) : "( ? )",
      ),
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
            h("a", { class: "tap", href: `#${ruleAnchor(rule)}` }, rule.element),
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
      findings.map(findingLine),
    ),
  );
}

function findingLine(finding: Finding): HTMLElement {
  const ok = finding.kind === "supported";
  return h(
    "p",
    {},
    h("span", { class: "check-icon", "aria-hidden": "true" }, ok ? "✓" : "!"),
    h("strong", {}, `${FINDING_LABELS[finding.kind]}: `),
    finding.message,
  );
}

function authorityBlock(view: DocumentView): HTMLElement {
  const block = view.authorityBlock;
  if (!block)
    return h("p", { class: "authority" }, "Unclassified document: no classification block.");
  return h(
    "div",
    {},
    h(
      "dl",
      { class: "authority" },
      h("dt", {}, "Classified By:"),
      h("dd", {}, block.classifiedBy),
      h("dt", {}, "Derived From:"),
      h("dd", {}, block.derivedFrom),
      h("dt", {}, "Declassify On:"),
      h("dd", {}, block.declassifyOn ?? "Not determined"),
    ),
    block.problem
      ? h("p", { class: "check check-flag" }, h("strong", {}, "No date: "), block.problem)
      : null,
    h(
      "p",
      { class: "note" },
      "Built from the current markings and the rules they cite. Declassify On is the document's date plus the longest duration among the cited classified rules, as the handbook describes.",
    ),
  );
}
