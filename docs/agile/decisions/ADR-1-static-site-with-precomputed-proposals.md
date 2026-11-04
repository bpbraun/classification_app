# ADR-1: Static Site With Precomputed Proposals

**Status:** Accepted, November 4, 2026

## Decision

Publish a static site. Model proposals are generated offline, committed with provenance, and bundled into the page. Nothing calls a model or a server at runtime.

## Alternatives Considered

- **Live service calling a model per request:** Shows real-time behavior, but depends on conference Wi-Fi and a running backend, and needs a key stored somewhere reachable from the internet.
- **Static page with a live mode behind a key the viewer enters:** Adds risk and setup for viewers who will spend two minutes on the page.

## Why

Reliability at Industry Day matters more than real-time output, and a demo about classification security shouldn't put secrets anywhere near the browser. A static page has nothing to attack. The method stays honest because the committed proposals are real model output with a recorded model, prompt hash, and source hash, and the release check enforces that.
