import { Router, type Request, type Response } from "express";
import { fetchAllMemory, flushMemory } from "../core/memoryManager";

const router = Router();

router.get("/memory", (_req: Request, res: Response) => {
  const entries = fetchAllMemory();
  res.json({ entries, count: entries.length });
});

router.delete("/memory", (_req: Request, res: Response) => {
  const count = flushMemory();
  res.json({ cleared: true, count });
});

export default router;
