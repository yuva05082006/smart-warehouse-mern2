import { Router } from "express";
import { startPicking, listPickingTasks, recordPick } from "../controllers/picking.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.post("/start/:orderId", startPicking);
router.get("/tasks", listPickingTasks);
router.put("/tasks/:id/pick", recordPick);

export default router;
