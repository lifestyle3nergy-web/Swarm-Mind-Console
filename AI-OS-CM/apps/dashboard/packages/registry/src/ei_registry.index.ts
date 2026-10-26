// Registry contract for adapters added after the local-first prototype.
export type EvidenceClass = 'public' | 'internal' | 'sensitive';
export type SyncState = 'local-only' | 'pending-review' | 'verified-remote';

export interface RegistryEntry {
  id: string;
  source: 'repository' | 'device' | 'browser' | 'research';
  evidenceClass: EvidenceClass;
  syncState: SyncState;
  owner: string;
  retentionDays: number;
  taskContract: 'TASKCONTRACT-POINT-AUTOSYNC';
}

export const registryIndex: RegistryEntry[] = [
  { id: 'lifestyle3nergy-web', source: 'repository', evidenceClass: 'internal', syncState: 'local-only', owner: 'workspace-admin', retentionDays: 30, taskContract: 'TASKCONTRACT-POINT-AUTOSYNC' },
  { id: 'androidx-saved-state', source: 'device', evidenceClass: 'sensitive', syncState: 'pending-review', owner: 'device-owner', retentionDays: 7, taskContract: 'TASKCONTRACT-POINT-AUTOSYNC' },
];