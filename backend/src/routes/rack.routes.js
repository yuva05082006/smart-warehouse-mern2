import { Router } from "express";
import { listRacks, getRackCapacity, createRack, updateRack, deleteRack } from "../controllers/rack.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listRacks);
router.get("/:id/capacity", getRackCapacity);
router.post("/", requireRole("MANAGER"), createRack);
router.put("/:id", requireRole("MANAGER"), updateRack);
router.delete("/:id", requireRole("MANAGER"), deleteRack);

export default router;
