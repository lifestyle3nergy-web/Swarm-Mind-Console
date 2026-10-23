const startTime = Date.now();

interface StatCounters {
  totalTasks: number;
  swarmTasks: number;
  singleTasks: number;
}

const counters: StatCounters = {
  totalTasks: 0,
  swarmTasks: 0,
  singleTasks: 0,
};

export function recordTask(wasSwarm: boolean): void {
  counters.totalTasks++;
  if (wasSwarm) {
    counters.swarmTasks++;
  } else {
    counters.singleTasks++;
  }
}

export function getSystemStats(memorySize: number) {
  return {
    totalTasks: counters.totalTasks,
    swarmTasks: counters.swarmTasks,
    singleTasks: counters.singleTasks,
    swarmRatio:
      counters.totalTasks === 0
        ? 0
        : counters.swarmTasks / counters.totalTasks,
    memorySize,
    uptimeMs: Date.now() - startTime,
  };
}
