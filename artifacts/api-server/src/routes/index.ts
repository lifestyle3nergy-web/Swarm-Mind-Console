import { Router, type IRouter } from "express";
import healthRouter from "./health";
import runRouter from "./run";
import memoryRouter from "./memory";
import statsRouter from "./statsRoute";

const router: IRouter = Router();

router.use(healthRouter);
router.use(runRouter);
router.use(memoryRouter);
router.use(statsRouter);

export default router;
