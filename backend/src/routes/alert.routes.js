import { Router } from "express";
import { listAlerts } from "../controllers/alert.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, listAlerts);

export default router;
