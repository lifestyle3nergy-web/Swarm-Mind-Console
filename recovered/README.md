# Recovery cluster: checkpoint e65cca4

This directory preserves pre-checkpoint source assets removed or narrowed by commit `e65cca495cc9d1d24c6c9e9c596b9bd86dc7a93a`, copied from its parent `9e1ef93486a07794bbdc28beb8bc71045294c243` onto a branch based on `main` (`6c21a907fe4375f95dd342e009b17675076d902f`). It is intentionally quarantined under `recovered/`: these files are recovered evidence/source snapshots, not yet wired into production workspaces or runtime entry points.

## Clusters
- `ui/aim-os/`: prior React/Vite console artifact and UI primitives.
- `services/api-server/`: prior server core and route modules.
- `contracts/openapi.pre-e65.yaml`: prior API contract snapshot.
- `clients/react/`, `clients/zod/`: prior generated client/type artifacts, including modules removed or narrowed at the checkpoint.
- `dependency-state/pnpm-lock.pre-e65.yaml`: prior workspace lockfile snapshot.

## Validation status
- Content provenance: blob objects copied from the parent tree of `e65cca495cc9d1d24c6c9e9c596b9bd86dc7a93a`.
- Runtime integration, import remapping, dependency reconciliation, and tests: **not yet validated**.
- Do not merge or deploy these recovered clusters until each cluster is reviewed, wired deliberately, and its applicable gates pass.
