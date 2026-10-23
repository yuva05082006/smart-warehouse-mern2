import { Router } from "express";
import { listReceipts, createReceipt } from "../controllers/receiving.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listReceipts);
router.post("/", createReceipt);

export default router;
