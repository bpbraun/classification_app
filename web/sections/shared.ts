import { bannerName, type Level, type Rule } from "../../src/core";
import type { ExtractedData } from "../../src/data/schema";
import { h } from "../dom";

type Content = Node | string | null | undefined | false;

export function section(
  id: string,
  title: string,
  ...children: (Content | Content[])[]
): HTMLElement {
  return h(
    "section",
    { id, "aria-labelledby": `${id}-title` },
    h("h2", { id: `${id}-title`, tabindex: "-1" }, title),
    ...children,
  );
}

export function levelBadge(level: Level): HTMLElement {
  return h("span", { class: `badge badge-${level.toLowerCase()}` }, bannerName(level));
}

/** In-page anchor for a rule's row in step 1. */
export function ruleAnchor(rule: Rule): string {
  return `rule-${rule.id}`;
}

/** Link to the rule's page in the source PDF. */
export function pdfHref(data: ExtractedData, rule: Rule): string {
  return `${data.source.url}#page=${rule.source.page}`;
}

export function ruleSummary(rule: Rule): string {
  const parts = [bannerName(rule.level)];
  if (rule.reasons.length > 0) parts.push(rule.reasons.join(", "));
  if (rule.durationYears) parts.push(`${rule.durationYears} years`);
  if (rule.controls.length > 0) parts.push(rule.controls.join(", "));
  return parts.join(" · ");
}
