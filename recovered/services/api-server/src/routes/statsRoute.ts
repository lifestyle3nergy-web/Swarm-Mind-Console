import { Router, type Request, type Response } from "express";
import { getSystemStats } from "../core/stats";
import { getMemorySize } from "../core/memoryManager";

const router = Router();

router.get("/stats", (_req: Request, res: Response) => {
  res.json(getSystemStats(getMemorySize()));
});

export default router;
