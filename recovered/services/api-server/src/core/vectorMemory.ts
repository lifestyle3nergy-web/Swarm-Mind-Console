export interface MemoryEntryData {
  input: string;
  output: string;
  timestamp: number;
  strength: number;
  vector: number;
}

export interface ScoredMemoryEntry extends MemoryEntryData {
  score: number;
}

const memory: MemoryEntryData[] = [];

function hash(str: string): number {
  return str.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
}

export function addMemory(entry: Omit<MemoryEntryData, "vector">): void {
  const full: MemoryEntryData = { ...entry, vector: hash(entry.input) };
  memory.push(full);
}

export function searchMemory(input: string, topK = 5): ScoredMemoryEntry[] {
  const h = hash(input);
  return memory
    .map((m) => ({ ...m, score: 1 - Math.abs(m.vector - h) / 1000 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function getAllMemory(): MemoryEntryData[] {
  return [...memory];
}

export function clearAllMemory(): number {
  const count = memory.length;
  memory.splice(0, memory.length);
  return count;
}

export function memorySize(): number {
  return memory.length;
}
