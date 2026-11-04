---
name: Model citations with provenance
status: Waiting on model run
sprint: 1
---

## Acceptance Criteria

- A Proposer interface with an Anthropic implementation, temperature 0
- The prompt lists rule ids and elements only, never levels; paragraph text is fenced as data
- Replies must match a strict schema (no extra fields); duplicates removed
- The run records model, prompt template hash, source hash, and time
- The release check blocks a development fixture, stale proposals, or missing, unknown, or duplicate proposals
- The API key comes only from the environment or an ignored `.env`

## Activity

- 2026-11-04: Developer (orchestrator, inline): Implemented with tests using a fake client. Waiting for Benjy's local run with his key.
