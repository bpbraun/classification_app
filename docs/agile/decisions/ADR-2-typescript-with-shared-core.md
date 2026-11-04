# ADR-2: TypeScript End to End With a Shared Core

**Status:** Accepted, November 4, 2026

## Decision

Write the pipeline, the domain logic, and the web page in TypeScript. Keep the domain logic in `src/core/` as pure functions with no I/O, imported by both the Node pipeline and the browser.

## Alternatives Considered

- **Python pipeline, JavaScript front end:** Python has strong PDF tooling, but the validator would exist twice, and the two copies could drift.
- **A UI framework (React, Svelte):** More structure than one walkthrough page needs, and more dependencies to audit.

## Why

The live "change a marking" interaction must run exactly the same check the pipeline runs. One implementation, tested once, guarantees that. ESLint rules keep the core and the web layer from importing Node, the model SDK, or network APIs.
