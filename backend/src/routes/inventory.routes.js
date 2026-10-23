import { Router } from "express";
import { listInventory, getInventoryForProduct } from "../controllers/inventory.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listInventory);
router.get("/:productId", getInventoryForProduct);

export default router;
