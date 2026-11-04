---
name: Classification core: rules, check, and assembly
status: In review
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
