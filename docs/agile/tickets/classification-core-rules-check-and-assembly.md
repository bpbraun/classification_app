---
name: Classification core: rules, check, and assembly
status: Done
sprint: 1
---

## Acceptance Criteria

- Portion marking derives from cited rules: highest level, union of controls
- The check flags unknown rules, missing guidance, under- and over-classification, and missing or extra controls
- An unknown citation never counts as support
- The banner and classification authority block build from citations; Declassify On uses the longest duration among classified rules
- Answer-key comparison reports agree, disagree, and missing per paragraph
- The conflict check pairs elements across guides by word overlap and reports level, reason, duration, and control differences
- No I/O, no Node or network imports (enforced by lint)

## Activity

- 2026-11-04: Developer (orchestrator, inline): Tests written first. 29 core tests pass. Type-check and lint clean.
- 2026-11-04: Code Review (Sonnet): Should-fix: authority block ignored viewer overrides; a classified rule with no duration produced "declassify today"; `addYears` accepted impossible dates; duplicated overall-marking logic. Fixed: `assembleDocument` now takes markings, leaves Declassify On empty with a reason when the rules can't support a date, validates dates, and shares `overallMarking`.
- 2026-11-04: QA (Sonnet): Passed every change-marking case (under, over, missing and extra control, all-U, reset).
- 2026-11-04: Senior Review (Sonnet): Asked for a seeded test matrix. Added: every citation pair × every level × NOFORN on and off (232 cases).
- 2026-11-04: Security Check (Sonnet): Unknown citations never count as support. Pass.
- 2026-11-04: Orchestrator: Accepted. 111 tests pass.
