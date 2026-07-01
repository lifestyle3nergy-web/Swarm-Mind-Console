import {
  addMemory,
  searchMemory,
  getAllMemory,
  clearAllMemory,
  memorySize,
  type ScoredMemoryEntry,
  type MemoryEntryData,
} from "./vectorMemory";

export function storeMemory(input: string, output: string): void {
  addMemory({ input, output, timestamp: Date.now(), strength: 1 });
}

export function retrieveMemory(input: string): ScoredMemoryEntry[] {
  return searchMemory(input);
}

export function fetchAllMemory(): MemoryEntryData[] {
  return getAllMemory();
}

export function flushMemory(): number {
  return clearAllMemory();
}

export function getMemorySize(): number {
  return memorySize();
}
