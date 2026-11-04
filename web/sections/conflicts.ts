import type { ExtractedData } from "../../src/data/schema";
import { h } from "../dom";
import type { DocumentView } from "../state";
import { ruleSummary, section } from "./shared";

export function conflictSection(data: ExtractedData, view: DocumentView): HTMLElement {
  const [one, two] = data.examples;
  const nameA = one?.title ?? "Guide A";
  const nameB = two?.title ?? "Guide B";
  return section(
    "conflicts",
    "4. Checking Guides for Conflicts (Illustrative)",
    h(
      "p",
      {},
      `Page ${one?.rules[0]?.source.page ?? ""} of the handbook shows two example tables that teach classification by compilation. They are alternative illustrations, not two guides in force. Treated as two guides, they show what the conflict check does: it pairs elements by word overlap in their wording and flags every difference in level, reason, duration, or controls.`,
    ),
    h(
      "table",
      { class: "compare" },
      h("caption", {}, `${nameA} compared with ${nameB}`),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          ["Element", nameA, nameB, "Differs on"].map((c) => h("th", { scope: "col" }, c)),
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
            h("td", { "data-label": nameA }, ruleSummary(c.a)),
            h("td", { "data-label": nameB }, ruleSummary(c.b)),
            h("td", { "data-label": "Differs on" }, c.differences.join(", ")),
          ),
        ),
      ),
    ),
    h(
      "p",
      { class: "callout" },
      "With real guides, each flagged pair goes to the responsible Original Classification Authorities. The tool flags; it doesn't pick a winner.",
    ),
    h(
      "p",
      { class: "note" },
      "This demo doesn't apply compilation rules when marking a document. Each portion is marked from the elements it reveals on its own.",
    ),
  );
}
