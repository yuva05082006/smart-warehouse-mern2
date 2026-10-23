import { Router } from "express";
import { listOrders, getOrder, createOrder, updateOrderStatus } from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/", createOrder);
router.put("/:id/status", updateOrderStatus);

export default router;
