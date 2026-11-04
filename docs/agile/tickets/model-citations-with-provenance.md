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
- 2026-11-04: Code Review (Sonnet): Should-fix: the prompt hash ignored rule-list format and request settings; stale proposals passed after a re-extraction; release check didn't verify cited ids. Fixed: the hash covers a two-rule sample and the settings, provenance records a guide fingerprint, and the release check rejects unknown citations and runs without a model name.
- 2026-11-04: Security Check (Sonnet): Should-fix: the key was reachable from any branch; actions pinned by tag; token on disk during the run. Fixed: Run model is main-only on a protected `model-run` environment, actions pinned to SHAs, `persist-credentials: false`, model name validated. Branch protection documented in docs/DEPLOY.md (a repository setting).
- 2026-11-04: Senior Review (Sonnet): The release gate is a process control. The README now says so.
- 2026-11-04: Orchestrator: Accepted. Still waiting on the model run.
