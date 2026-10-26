# ORB engineering intelligence

A local-first engineering dashboard prototype for `lifestyle3nergy-web`. The ORB is a visual second-brain map connecting repository changes, datasets, review evidence, and device context. The screenshot references informed the dense dark workspace, luminous network centerpiece, scrolling data views, and narrow-screen navigation.

## Workspace layout

- Root `@orb/web`: React, Vite, Tailwind frontend.
- `packages/registry`: typed sample PRs, dataset memo contracts, and activity signals shared with the frontend.
- `packages/knowledge`: optional Python paired-view training scaffold; never launched by the dashboard.

Run `npm install`, then `npm run dev` for development or `npm run build` for a static build. The current Vite configuration creates a single-file HTML bundle; the globe asset is served from the public directory.

## Prototype boundaries

The top metrics, charts, scores, lineage, and events in the engineering overview are **sample data**. The pull request overview separately tracks twelve named repositories from the supplied inventory and can request the latest public PR in each repository on demand; checks and scores remain unverified. Date and segment filters update the sample analytics, while repository state/search/sort controls belong to the tracked table. Memo notes and retention selections persist only in the browser's `localStorage`; no AndroidX Saved Games, Google Play, authenticated GitHub/GitLab, cloud backup, token exchange, proxy, CLI, or CI action is executed. "Refresh" refreshes the demo view only. See `docs/tracked-pr-intake.md`.

Device NetworX adds real but narrowly scoped browser diagnostics, an explicit same-origin reachability probe, and opt-in read-only public GitHub metadata requests for three named repositories. It does not inspect device radio, ISP, DNS, VPN, carrier, or native storage. See `docs/device-networx.md` for capability boundaries and research references.

The App dock side tab maps commonly used tools to reviewed integration boundaries. Search, group filters, and pinned shortcuts are interactive; the Download service template button generates a read-only Node microservice starter ZIP with endpoints, tests, Docker Compose, and a CI workflow. See `docs/app-dock.md`. It does not discover installed apps or deploy services.

For production, add authenticated read-only API adapters first. Keep tokens server-side, classify evidence before retention, enforce human review on merge gates, and never infer that a local snapshot has been backed up until a remote service confirms it.