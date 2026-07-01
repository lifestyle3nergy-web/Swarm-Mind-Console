import { type ScoredMemoryEntry } from "./vectorMemory";

export function updateStrengths(
  entries: ScoredMemoryEntry[],
  success = true,
): void {
  entries.forEach((m) => {
    m.strength += success ? 0.1 : -0.1;
  });
}
