---
name: Extract rules and exercise from the ISOO PDF
status: In review
sprint: 1
---

## Acceptance Criteria

- Reads the sample guide's seven rules, with source page and row, from positioned PDF text (no hand entry)
- Reads the guide's cover (title, date, issuer, OCA), the exercise paragraphs, and ISOO's answer key with its authority block
- Aligns each exercise paragraph to its answer-key portion and notes where the key merges paragraphs
- Reads handbook Examples 1 and 2 as two guides for the conflict check
- Output validates against a strict schema; the source PDF is pinned by SHA-256
- An end-to-end test runs against the real PDF

## Activity

- 2026-11-04: Developer (orchestrator, inline): Unit tests on synthetic layouts plus an end-to-end test on the pinned handbook. Banner and Declassify On computed from the extracted rules match ISOO's key (TOP SECRET//NOFORN, 20430904). 59 tests pass.
- 2026-11-04: Finding while building: ISOO's key marks "the wolf did blow the house in" (S) but "the wolf blew that house in too" (U), and marks the title (S) although "Project name" is Unclassified. Decision with Benjy: show disagreements neutrally.
