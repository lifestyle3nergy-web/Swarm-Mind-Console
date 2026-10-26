# App dock and adapter template

The side-tab App dock is a curated map of commonly used apps, inspired by a mobile app drawer. It is **not** an installed-app scan and cannot inspect private application data. Users may filter, search, and pin apps; pins persist only in this browser's local storage. Tiles with official web destinations open those sites in a new tab. Tiles without a safe web destination remain planning surfaces.

Selecting an app shows its proposed middleware boundary, a local service name, and a proposed internal endpoint. No provider credentials, private APIs, or shell access are connected.

## Generated service

The Download service template action creates a ZIP in the browser with a read-only Node HTTP starter. The ZIP contains:

- `src/server.mjs`: localhost-bound HTTP service with `GET /health`, `GET /v1/capabilities`, and `GET /v1/adapters/{id}/status`. Every adapter reports `not_configured` and `upstream: false`.
- `contracts/adapter.json`: a proposed task contract marked `ACTION`, not executed or admitted evidence.
- `test/server.test.mjs`: a Node built-in test covering the read endpoints and rejecting POST.
- `Dockerfile` and `compose.yaml`: non-root container, read-only filesystem, no Linux capabilities, host-loopback port publishing.
- `.github/workflows/ci.yml`: a test-only workflow with read-only repository permissions.
- `docs/architecture.md`, `README.md`, `.gitignore`, and `package.json`.

The template is generated from the selected catalog entry in `src/serviceTemplate.ts`. It is not installed, deployed, committed, or connected by the dashboard. It has no dependencies beyond Node.js 20+ and makes no upstream requests. A real adapter must add authentication, authorization, input validation, quotas, provenance, secret storage, and human review before deployment. Check the authoritative ADR registry before proposing organization-wide architecture changes.

Architecture: `App dock -> reviewed gateway -> read-only adapter -> official provider`. Internal endpoint paths are design proposals, **not** claims about provider API paths. Never proxy arbitrary user-provided URLs or place tokens in client code.