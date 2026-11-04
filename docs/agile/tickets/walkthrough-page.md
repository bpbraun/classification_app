---
name: Walkthrough page
status: Done
sprint: 1
---

## Acceptance Criteria

- Five steps: the guide as rules, cited markings with the live check, comparison with ISOO's key, the conflict check (illustrative), and how it works
- Every marking shows its cited rule and links to the source page
- A viewer can change any portion's marking and see the check respond
- A visible notice when proposals are a development fixture
- Labeled as ISOO training material demonstrating the method
- Mobile first, keyboard and screen-reader usable, color never the only signal
- No runtime network requests; strict Content Security Policy

## Activity

- 2026-11-04: Developer (orchestrator, inline): Built as a vanilla TypeScript static page. Text-only DOM building, strict CSP.
- 2026-11-04: QA (Sonnet): All acceptance criteria pass except the step structure (the live check is part of step 2, and "How it works" is step 5). Should-fix: in-page links to the source rule; 44px tap targets for inline links; spoken status messages. Fixed. Criteria amended below to match the page.
- 2026-11-04: Senior Review (Sonnet): Blocker: the prompt-injection claim went beyond ADR-4. Reworded. Should-fix: result summary near the top; the conflict section labeled illustrative and described as word overlap; a note that compilation isn't modeled; the authority block compared with ISOO's across formats, with Classified By marked as a placeholder. All fixed.
- 2026-11-04: Code Review (Sonnet): `sections.ts` too large; casts on select values. Split into one module per section with a config module; added an `isLevel` guard.
- 2026-11-04: Security Check (Sonnet): No HTML sinks, effective CSP in the built page, no runtime requests, about 9 KB of JavaScript (gzip) with no zod or SDK bundled. Schema now requires https links. Pass.
- 2026-11-04: Orchestrator: Accepted.
