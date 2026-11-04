# ADR-3: GitHub Pages on a braun-ai.com Subdomain

**Status:** Accepted, November 4, 2026

## Decision

Deploy with GitHub Actions to GitHub Pages and serve it at demo.braun-ai.com through a CNAME record in Squarespace DNS. The main site stays on Squarespace.

## Alternatives Considered

- **Inside Squarespace (code block or code injection):** Squarespace can't serve a bundled app's files cleanly, and code injection would mix demo code into the marketing site.
- **Claude artifact link:** Zero setup, but the URL isn't BAI's, and AI sites are sometimes blocked on Government networks.
- **Cloudflare Pages or Netlify:** Equally good. GitHub Pages keeps code, CI, and hosting in one place at no cost for a public repo.

## Why

A braun-ai.com address on the handout reinforces the brand and is less likely to be filtered. Pages gives HTTPS, a deploy history, and rollback by redeploying an earlier commit.
