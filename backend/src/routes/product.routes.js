import { Router } from "express";
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from "../controllers/product.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", requireRole("MANAGER"), deleteProduct);

export default router;
