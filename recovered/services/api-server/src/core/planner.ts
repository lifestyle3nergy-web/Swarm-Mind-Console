import { type ScoredMemoryEntry } from "./vectorMemory";

export interface Plan {
  input: string;
  complexity: number;
  swarm: boolean;
  memoryCount: number;
}

export function createPlan(
  input: string,
  memory: ScoredMemoryEntry[],
): Plan {
  const complexity = input.length / 120;
  return {
    input,
    complexity,
    swarm: complexity > 0.7,
    memoryCount: memory.length,
  };
}

export function executePlan(plan: Plan): string {
  return `EXECUTED: ${plan.input}`;
}
