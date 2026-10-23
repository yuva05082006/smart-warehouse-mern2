import { Router } from "express";
import { listWarehouses, getWarehouseCapacity, createWarehouse, updateWarehouse, deleteWarehouse } from "../controllers/warehouse.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listWarehouses);
router.get("/:id/capacity", getWarehouseCapacity);
router.post("/", requireRole("MANAGER"), createWarehouse);
router.put("/:id", requireRole("MANAGER"), updateWarehouse);
router.delete("/:id", requireRole("MANAGER"), deleteWarehouse);

export default router;
