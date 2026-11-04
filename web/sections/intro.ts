import type { ExtractedData } from "../../src/data/schema";
import { h } from "../dom";
import type { DocumentView } from "../state";

export function intro(data: ExtractedData, view: DocumentView): HTMLElement {
  const { summary } = view.comparison;
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
      { class: "result" },
      h("strong", {}, `${view.portions.length} portions marked. `),
      `${view.supportedCount} are supported by the rules they cite. `,
      `${summary.agree} of ${summary.total} match ISOO's own answer key.`,
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
      h("li", {}, h("a", { href: "#conflicts" }, "Checking guides for conflicts")),
      h("li", {}, h("a", { href: "#how" }, "How it works")),
    ),
  );
}
