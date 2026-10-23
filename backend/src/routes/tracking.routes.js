import { Router } from "express";
import { trackProduct } from "../controllers/tracking.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.get("/:idOrSku", protect, trackProduct);

export default router;
