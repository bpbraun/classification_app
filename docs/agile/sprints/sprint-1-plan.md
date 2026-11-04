# Sprint 1 Plan

**Dates:** November 4 to 8, 2026
**Goal:** A public walkthrough at demo.braun-ai.com, ready to link from the ACME Industry Day handout on November 9.

## Scope (Vertical Slices)

1. **Classification core: rules, check, and assembly:** Pure domain logic with tests.
2. **Extract rules and exercise from the ISOO PDF:** Pinned source, schema-validated output.
3. **Model citations with provenance:** Proposer interface, Anthropic implementation, release check.
4. **Walkthrough page:** Mobile-first static page showing all five steps.
5. **Pages deploy and custom domain:** CI, deploy workflow, DNS instructions.
6. **Handout QR code and line:** Added to page 2 of the handout canvas.

## Definition of Done

Tests pass, lint and type-check are clean, all five review gates are logged on the ticket, the slice is usable end to end, and the README covers it.

## Risks

- The model run needs Benjy's API key. The release check blocks deploy until it runs.
- DNS changes can take time to propagate. Do the CNAME record by Saturday.
