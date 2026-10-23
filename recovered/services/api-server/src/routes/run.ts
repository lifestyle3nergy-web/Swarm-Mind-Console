import { Router, type Request, type Response } from "express";
import { retrieveMemory, storeMemory } from "../core/memoryManager";
import { createPlan, executePlan } from "../core/planner";
import { executeSwarm } from "../core/swarm";
import { isTokenAllowed } from "../core/tokenOptimizer";
import { updateStrengths } from "../core/reinforcement";
import { recordTask } from "../core/stats";

const router = Router();

router.post("/run", (req: Request, res: Response) => {
  const { input } = req.body as { input?: string };

  if (!input || typeof input !== "string") {
    res.status(400).json({ error: "input is required and must be a string" });
    return;
  }

  const startMs = Date.now();
  const memory = retrieveMemory(input);
  const plan = createPlan(input, memory);
  const tokenAllowed = isTokenAllowed(plan);

  let result: string | ReturnType<typeof executeSwarm>;
  if (plan.swarm) {
    result = executeSwarm(plan);
  } else {
    result = executePlan(plan);
  }

  updateStrengths(memory, true);
  storeMemory(input, typeof result === "string" ? result : JSON.stringify(result));
  recordTask(plan.swarm);

  const executionMs = Date.now() - startMs;

  res.json({ input, plan, memory, result, tokenAllowed, executionMs });
});

export default router;
