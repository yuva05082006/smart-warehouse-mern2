import { Router } from "express";
import { listBins, getBinCapacity, createBin, updateBin, deleteBin } from "../controllers/bin.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listBins);
router.get("/:id/capacity", getBinCapacity);
router.post("/", requireRole("MANAGER"), createBin);
router.put("/:id", requireRole("MANAGER"), updateBin);
router.delete("/:id", requireRole("MANAGER"), deleteBin);

export default router;
