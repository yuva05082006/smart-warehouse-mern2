import { Router } from "express";
import { listDispatches, createDispatch } from "../controllers/dispatch.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listDispatches);
router.post("/", createDispatch);

export default router;
