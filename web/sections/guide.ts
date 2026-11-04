import type { ExtractedData } from "../../src/data/schema";
import { h } from "../dom";
import { levelBadge, pdfHref, ruleAnchor, section } from "./shared";

const COLUMNS = [
  "Element of information",
  "Level",
  "Reason",
  "Declassify after",
  "Controls",
  "Source",
];

export function guideSection(data: ExtractedData): HTMLElement {
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
          COLUMNS.map((c) => h("th", { scope: "col" }, c)),
        ),
      ),
      h(
        "tbody",
        {},
        guide.rules.map((rule) =>
          h(
            "tr",
            { id: ruleAnchor(rule), tabindex: "-1" },
            h("th", { scope: "row", "data-label": "Element" }, rule.element),
            h("td", { "data-label": "Level" }, levelBadge(rule.level)),
            h("td", { "data-label": "Reason" }, rule.reasons.join(", ") || "None"),
            h(
              "td",
              { "data-label": "Declassify after" },
              rule.durationYears ? `${rule.durationYears} years` : "Not applicable",
            ),
            h("td", { "data-label": "Controls" }, rule.controls.join(", ") || "None"),
            h(
              "td",
              { "data-label": "Source" },
              h(
                "a",
                { class: "tap", href: pdfHref(data, rule) },
                `PDF p. ${rule.source.page}, row ${rule.source.row}`,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
