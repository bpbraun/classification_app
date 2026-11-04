---
name: Pages deploy and custom domain
status: Waiting on repo settings and DNS
sprint: 1
---

## Acceptance Criteria

- CI runs format, lint, type-check, tests, and build on every push and pull request
- Deploy runs on merge to main, only after the release check passes
- The site is served at https://demo.braun-ai.com with HTTPS enforced
- Squarespace DNS instructions written for Benjy
- Rollback: redeploy an earlier commit from the Actions tab

## Activity

- 2026-11-04: Developer (orchestrator, inline): CI, deploy, and Run model workflows; CNAME; docs/DEPLOY.md with the Squarespace DNS records, domain verification, and branch protection.
- 2026-11-04: Security Check (Sonnet): Least privilege per job confirmed. Actions now pinned to SHAs, Dependabot added.
- 2026-11-04: Orchestrator: Waiting on Benjy's repository settings and DNS.
