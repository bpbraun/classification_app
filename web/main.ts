import extractedJson from "../data/extracted.json";
import proposalsJson from "../data/proposals.json";
import type { ExtractedData, ProposalsFile } from "../src/data/schema";
import { spokenMarking, type Marking } from "../src/core";
import { SITE } from "./config";
import { replaceChildren } from "./dom";
import { renderPage } from "./sections";
import { buildView, type DocumentView } from "./state";

// Both files are schema-checked in CI (tests/web-state.test.ts) before any build ships,
// so the browser bundle doesn't carry the schema library.
const data = extractedJson as ExtractedData;
const proposals = proposalsJson as ProposalsFile;

const overrides = new Map<string, Marking>();
const root = document.getElementById("app");
const status = document.getElementById("status");

function render(focusId?: string): DocumentView {
  const view = buildView(data, proposals, overrides, SITE.classifiedBy);
  if (root) replaceChildren(root, renderPage(data, proposals, view, { onChange, onReset }));
  if (focusId) document.getElementById(focusId)?.focus();
  return view;
}

function announce(message: string): void {
  if (status) status.textContent = message;
}

function onChange(paragraphId: string, marking: Marking, focusId: string): void {
  overrides.set(paragraphId, marking);
  const portion = render(focusId).portions.find((p) => p.paragraph.id === paragraphId);
  if (!portion) return;
  const findings = portion.check.findings.map((f) => f.message).join(" ");
  announce(`${portion.label} marked ${spokenMarking(marking)}. ${findings}`);
}

function onReset(): void {
  overrides.clear();
  render("marking-title");
  announce("All markings reset to the proposed markings.");
}

render();
