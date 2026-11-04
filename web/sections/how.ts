import type { ExtractedData, ProposalsFile } from "../../src/data/schema";
import { SITE } from "../config";
import { h } from "../dom";
import { section } from "./shared";

export function howSection(data: ExtractedData, proposals: ProposalsFile): HTMLElement {
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
        "It sees each rule's id and wording, never its level, and must answer in a strict format. Paragraph text is fenced as data. Text inside a document can at most change which rule ids get cited, and every citation is shown beside its source rule.",
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
        "Every marking shows the rule behind it and links to the source row, so a classifier can confirm the reasoning instead of searching the guide.",
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
      h("dd", {}, h("a", { class: "tap", href: SITE.repoUrl }, SITE.repoLabel)),
    ),
    h(
      "div",
      { class: "contact" },
      h("p", {}, h("strong", {}, SITE.company)),
      h(
        "p",
        {},
        `${SITE.contactName} · `,
        h("a", { class: "tap", href: `mailto:${SITE.contactEmail}` }, SITE.contactEmail),
        " · ",
        h("a", { class: "tap", href: SITE.website }, SITE.websiteLabel),
      ),
    ),
  );
}
