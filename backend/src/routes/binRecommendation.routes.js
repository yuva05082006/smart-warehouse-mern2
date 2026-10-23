import { Router } from "express";
import { getBinRecommendation } from "../controllers/binRecommendation.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, getBinRecommendation);

export default router;
