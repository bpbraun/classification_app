# ADR-4: The Model Proposes, Fixed Code Verifies

**Status:** Accepted, November 4, 2026

## Decision

The model's only job is to say which elements of information a paragraph reveals, by rule id. It never sees classification levels, reasons, or durations, and its reply must match a strict schema. Deterministic code derives the portion marking (highest cited level, union of cited controls), the banner, and the classification authority block, and flags unknown citations, missing guidance, and any marking the citations don't support.

## Alternatives Considered

- **Model outputs markings directly:** Simpler, but a mistaken or manipulated model could pick a level, and nothing would catch it.
- **No model, keyword rules only:** Fully deterministic, but it can't recognize "built his house out of straw" as building material, and it undercuts the handout's claim.

## Why

This is the same architecture the handout describes for ACME: humans own decisions, the model narrows the search, and code that can be tested decides what the guidance supports. It also limits prompt injection. Text inside a paragraph can at most change which rule ids get cited, and the check shows the citation next to the source rule.
