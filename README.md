# Classification App: From Static Guide to Cited Markings

A working demonstration of the approach Braun Applied Intelligence (BAI) proposes for the Air Force ACME program (Function 2: Mission Application Development). It runs on the Information Security Oversight Office's public training material, not on any real or classified guide.

**Live at:** https://demo.braun-ai.com

## What It Shows

1. **Guide to rules:** ISOO's sample security classification guide ("Project Three Little Pigs") read from the PDF into structured rules, each linked to its page and row.
2. **Cited markings:** A model reads each paragraph of ISOO's exercise document and reports which elements of information it reveals. It never sees classification levels.
3. **Fixed-code check:** Deterministic code derives each portion marking from the cited rules, builds the banner and classification authority block, and flags anything a cited rule doesn't support. You can change a marking and watch the check respond.
4. **Comparison with ISOO's answer key:** Agreements and disagreements, shown neutrally with the reason for each.
5. **Conflict check:** Two handbook examples that treat the same elements differently are flagged for an Original Classification Authority to decide.

## Source Material

ISOO, _Developing and Using Security Classification Guides_ (October 2018), a public U.S. Government training handbook:
https://www.archives.gov/files/isoo/training/scg-handbook.pdf

A copy is kept in `sources/`, pinned by SHA-256 (`290a92cd...efc63415`). The pipeline refuses to release data built from any other file.

## How It's Built

| Layer    | Path            | What it does                                                                                                                                   |
| -------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Core     | `src/core/`     | Pure TypeScript domain logic: rules, validator, marking assembly, answer-key comparison, conflict check. No I/O. Runs in Node and the browser. |
| Pipeline | `src/pipeline/` | Offline steps: extract rules from the PDF, ask a model for citations, verify a release.                                                        |
| Web      | `web/`          | Static walkthrough page. Bundles the committed data and runs the core validator live.                                                          |

Design notes and decisions live in [`docs/agile/decisions/`](docs/agile/decisions/).

## Running It

Requires Node 22 or later.

```bash
npm ci
npm run check        # format, lint, type-check, and tests
npm run dev          # local preview of the site
npm run extract      # rebuild data/extracted.json from the PDF
npm run propose      # regenerate data/proposals.json (needs ANTHROPIC_API_KEY)
npm run verify-release
```

`npm run propose` is the only step that calls a model. Put your key in `.env` (see `.env.example`) or export it in your shell. The key is never committed and never reaches the website.

## Security Posture

- The published site is static: no backend, no API keys, no uploads, no cookies, no analytics, no third-party requests. A Content Security Policy limits the page to its own files.
- Model output is untrusted. It's schema-validated, it can only cite rule ids, and fixed code decides every marking.
- Releases are blocked unless proposals come from a real model run against the pinned PDF and the current prompt.

## License

Code: MIT. The ISOO handbook is a work of the U.S. Government.
