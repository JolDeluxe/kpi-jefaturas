import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { getKpiSyncStatus, runKpiSyncNow } from "../modules/kpi-sync/service.js";

const router = Router();

router.get("/status", authenticate, authorize("ADMIN"), async (_req, res, next) => {
  try {
    res.json(await getKpiSyncStatus());
  } catch (error) {
    next(error);
  }
});

router.post("/run", authenticate, authorize("ADMIN"), async (_req, res, next) => {
  try {
    const result = await runKpiSyncNow();
    res.status(result.status === "ERROR" ? 502 : 200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
