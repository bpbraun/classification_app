# Product Requirements

Carried over from the planning doc in the BAI Marketing project (Nov 4, 2026).

## Problem

BAI's ACME Industry Day handout says we can turn static security classification guides into machine-readable rules and give derivative classifiers cited recommendations. The Government said it doesn't want marketing. We need to show the method working, on material anyone can see.

## Goal

By Sunday, November 8, 2026 (Industry Day is Monday, November 9, NCR), a page at demo.braun-ai.com that walks a Government or prime reader through the method in about two minutes, on a phone (from the handout's QR code) or on Benjy's laptop.

## Users

- Government PMO staff and engineers (AFLCMC/HNJJ and its advisors)
- Integrator primes evaluating Function 2 partners
- Benjy, presenting live

## MVP

1. Guide to rules, each rule linked to its source page and row
2. Proposed marking per paragraph, with cited rules and a one-line rationale
3. Generated banner and classification authority block
4. Deterministic check, live in the browser when a viewer changes a marking
5. Neutral comparison with ISOO's answer key
6. Conflict check between handbook Examples 1 and 2
7. Clear labeling: ISOO training material, demonstrates the method, not performance at classified scale
8. Static and safe: no backend, keys, uploads, tracking, or third-party requests; mobile first; accessible
9. Hosted at demo.braun-ai.com

## Not in Scope

Live model calls from the browser, uploads, declassification triage, real or classified guides, CUI marking.

## Success Criteria

- Loads in under 3 seconds on a phone over LTE (the built page is about 35 KB of HTML, CSS, and JavaScript before the logo)
- Every proposed marking traces to a rule and a source page
- The check catches every case in a seeded set of wrong markings (tested)
- The full walkthrough takes about 2 minutes
