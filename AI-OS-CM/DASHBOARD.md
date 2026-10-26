# AI-OS-CM dashboard handoff

The complete ORB engineering-intelligence frontend is in `apps/dashboard/`, isolated from the Phase 1 Cognitive Metabolism API description. It is a static Vite/React app, not a FastAPI route or an OPA policy. No files in the existing repository were executed during this handoff.

## Pull request intake

The previous fictional PR #284-#264 table is replaced by twelve repository rows. The first four are `TWGT-`, `twgt-bridge`, `twgt-schema-gate`, and `engineering-intelligence`. The other eight are `rootly-mcp-server`, `Swarm-Mind-Console`, `caddy`, `sanitizers`, `plugins`, `router-cli`, `all-in-one`, and `gods-eye-view`. The list is curated from the supplied inventory, not an account scan.

`apps/dashboard/src/RepoPullOverview.tsx` owns the read-only table. Until the user clicks **Check public PRs**, each repository is `Not checked`. The action calls GitHub's public `GET /repos/{owner}/{repo}/pulls` endpoint for the latest updated PR, with no credentials, and labels unavailable/rate-limited responses. It does not fetch private PRs, verify checks, compute git scores, commit, merge, or write to GitHub. The summary metrics and charts elsewhere on the page remain clearly labeled demo data.

## Running and review

```sh
cd apps/dashboard
npm ci
npm run build
```

The app works without a server-side token. Its public API requests are optional and subject to GitHub rate limits. Keep any future private-repository credentials in a separately reviewed server-side service. Follow the upstream evidence and ADR registry rules before merging changes to protected branches.