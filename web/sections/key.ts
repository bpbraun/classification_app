import { portionText } from "../../src/core";
import type { ExtractedData } from "../../src/data/schema";
import { h } from "../dom";
import { readableNote, type DocumentView, type PortionView } from "../state";
import { section } from "./shared";

export function keySection(data: ExtractedData, view: DocumentView): HTMLElement {
  const { summary, rows } = view.comparison;
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
              row.proposed ? portionText(row.proposed) : "No guidance",
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
    blockComparison(data, view),
  );
}

function blockComparison(data: ExtractedData, view: DocumentView): HTMLElement {
  const key = data.answerKey;
  const ours = view.authorityBlock;
  const sameBanner = view.banner === key.banner;
  return h(
    "div",
    {},
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
              `Classified By: ${ours.classifiedBy}`,
              h("br"),
              `Derived From: ${ours.derivedFrom}`,
              h("br"),
              `Declassify On: ${ours.declassifyOn ?? "Not determined"}`,
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
          `Classified By: ${key.authorityBlock.classifiedBy}`,
          h("br"),
          `Derived From: ${key.authorityBlock.derivedFrom}`,
          h("br"),
          `Declassify On: ${key.authorityBlock.declassifyOn}`,
        ),
      ),
    ),
    h(
      "p",
      { class: "note" },
      sameBanner ? "Same banner. " : "The banners differ. ",
      view.declassifyMatchesKey
        ? "Same Declassify On date, written as YYYYMMDD here. "
        : "The Declassify On dates differ. ",
      "Both cite the same guide and date. Classified By is a placeholder here; in practice it names the classifier and position.",
    ),
  );
}

function citedSummary(portion: PortionView | undefined): string {
  const rules = portion?.check.citedRules ?? [];
  if (rules.length === 0) return "no rule";
  return rules.map((r) => `"${r.element}" (${r.level})`).join(", ");
}
