export type Segment = 'Core platform' | 'Android / DeX' | 'Security' | 'Research lab';
export type ReviewStatus = 'Ready' | 'In review' | 'Blocked' | 'Merged';

export type PullRequest = {
  id: number;
  title: string;
  repo: string;
  branch: string;
  segment: Segment;
  status: ReviewStatus;
  score: number;
  checks: string;
  author: string;
  daysAgo: number;
  changes: number;
};

export const pullRequests: PullRequest[] = [
  { id: 284, title: 'Cache lineage manifest for offline datasets', repo: 'lifestyle3nergy-web', branch: 'feat/cache-lineage', segment: 'Core platform', status: 'Ready', score: 98, checks: '12 / 12', author: 'Maya Chen', daysAgo: 0, changes: 14 },
  { id: 283, title: 'AndroidX saved-game sync adapter', repo: 'orb-android-bridge', branch: 'feat/saved-state', segment: 'Android / DeX', status: 'In review', score: 86, checks: '10 / 12', author: 'Alex Rivera', daysAgo: 1, changes: 23 },
  { id: 281, title: 'Enforce signed provenance on artifacts', repo: 'supply-chain-guard', branch: 'fix/provenance-gate', segment: 'Security', status: 'Blocked', score: 62, checks: '8 / 12', author: 'Sam Okafor', daysAgo: 2, changes: 7 },
  { id: 279, title: 'Index research notes in registry', repo: 'frontier-research', branch: 'feat/registry-index', segment: 'Research lab', status: 'Merged', score: 95, checks: '12 / 12', author: 'Noor Patel', daysAgo: 3, changes: 18 },
  { id: 278, title: 'Reduce telemetry payload for DeX sessions', repo: 'orb-android-bridge', branch: 'perf/dex-telemetry', segment: 'Android / DeX', status: 'Ready', score: 94, checks: '12 / 12', author: 'Alex Rivera', daysAgo: 4, changes: 11 },
  { id: 276, title: 'Add evidence classes to merge gate', repo: 'supply-chain-guard', branch: 'feat/evidence-policy', segment: 'Security', status: 'In review', score: 88, checks: '11 / 12', author: 'Sam Okafor', daysAgo: 6, changes: 16 },
  { id: 274, title: 'ORB graph node deduplication', repo: 'lifestyle3nergy-web', branch: 'fix/node-dedupe', segment: 'Core platform', status: 'Merged', score: 99, checks: '12 / 12', author: 'Maya Chen', daysAgo: 8, changes: 9 },
  { id: 272, title: 'Sphinx wiki search connector', repo: 'frontier-research', branch: 'feat/wiki-search', segment: 'Research lab', status: 'Ready', score: 91, checks: '12 / 12', author: 'Noor Patel', daysAgo: 10, changes: 20 },
  { id: 270, title: 'Rotate sandbox proxy credentials', repo: 'supply-chain-guard', branch: 'chore/token-rotation', segment: 'Security', status: 'Merged', score: 97, checks: '12 / 12', author: 'Sam Okafor', daysAgo: 13, changes: 6 },
  { id: 268, title: 'Persist memo widget snapshots', repo: 'orb-android-bridge', branch: 'feat/memo-snapshot', segment: 'Android / DeX', status: 'Merged', score: 93, checks: '12 / 12', author: 'Alex Rivera', daysAgo: 17, changes: 12 },
  { id: 266, title: 'FAISS context window evaluation', repo: 'frontier-research', branch: 'research/context-eval', segment: 'Research lab', status: 'In review', score: 83, checks: '9 / 12', author: 'Noor Patel', daysAgo: 21, changes: 25 },
  { id: 264, title: 'GitHub Pages documentation pipeline', repo: 'lifestyle3nergy-web', branch: 'docs/pages-pipeline', segment: 'Core platform', status: 'Merged', score: 96, checks: '12 / 12', author: 'Maya Chen', daysAgo: 26, changes: 15 },
  { id: 260, title: 'Classify archived browser evidence', repo: 'frontier-research', branch: 'feat/evidence-index', segment: 'Research lab', status: 'Merged', score: 92, checks: '12 / 12', author: 'Noor Patel', daysAgo: 38, changes: 13 },
  { id: 258, title: 'DeX local proxy connectivity test', repo: 'orb-android-bridge', branch: 'test/proxy-connectivity', segment: 'Android / DeX', status: 'Merged', score: 90, checks: '12 / 12', author: 'Alex Rivera', daysAgo: 48, changes: 8 },
  { id: 255, title: 'Container image vulnerability scan', repo: 'supply-chain-guard', branch: 'ci/image-scan', segment: 'Security', status: 'Merged', score: 98, checks: '12 / 12', author: 'Sam Okafor', daysAgo: 62, changes: 10 },
  { id: 251, title: 'Registry schema validation suite', repo: 'lifestyle3nergy-web', branch: 'test/registry-schema', segment: 'Core platform', status: 'Merged', score: 97, checks: '12 / 12', author: 'Maya Chen', daysAgo: 78, changes: 17 },
];

export const datasets = [
  { id: 'registry', name: 'Engineering registry', file: 'ei_registry.index.ts', segment: 'Core platform' as Segment, size: '2.4 MB', summary: 'Map repos, ownership, sync lineage and the next task contract.', freshness: 'Just now', color: 'cyan' },
  { id: 'evidence', name: 'Evidence & governance', file: 'evidence_class.md', segment: 'Security' as Segment, size: '840 KB', summary: 'Keep merge-gate evidence and policy decisions available offline.', freshness: '8 min ago', color: 'violet' },
  { id: 'android', name: 'AndroidX saved state', file: 'saved-game.schema.json', segment: 'Android / DeX' as Segment, size: '1.8 MB', summary: 'Retain the smallest useful device snapshot before cloud backup.', freshness: '22 min ago', color: 'amber' },
  { id: 'research', name: 'Research lab notes', file: 'ADR-0007-context.md', segment: 'Research lab' as Segment, size: '1.2 MB', summary: 'Archive evaluated context and references for the next agent run.', freshness: '1 hr ago', color: 'green' },
];

export const activity = [
  { time: '09:42', title: 'Merge gate passed', detail: 'PR #284 · 12 checks verified', kind: 'success' },
  { time: '09:31', title: 'Dataset snapshot retained', detail: 'ei_registry.index.ts · local cache', kind: 'info' },
  { time: '09:18', title: 'Human review requested', detail: 'PR #283 · AndroidX adapter', kind: 'warning' },
  { time: '08:56', title: 'Provenance check failed', detail: 'PR #281 · signature missing', kind: 'danger' },
];