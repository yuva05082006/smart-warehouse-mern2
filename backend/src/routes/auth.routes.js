import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, me);

export default router;
