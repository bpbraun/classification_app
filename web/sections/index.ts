import type { ExtractedData, ProposalsFile } from "../../src/data/schema";
import type { DocumentView } from "../state";
import { conflictSection } from "./conflicts";
import { guideSection } from "./guide";
import { howSection } from "./how";
import { intro } from "./intro";
import { keySection } from "./key";
import { markingSection, type Handlers } from "./marking";

export type { Handlers };

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
    markingSection(view, handlers),
    keySection(data, view),
    conflictSection(data, view),
    howSection(data, proposals),
  );
  return page;
}
