import { Router } from "express";
import authRoutes from "./auth.routes";
import modelRoutes from "./model.routes";
import dataRoutes from "./data.routes";
import { checkBanStatus, requireAuth, requireRole } from "@/middleware/auth.middleware"

const router = Router();

// Routes
router.use("/user", authRoutes);
router.use("/model", requireAuth, checkBanStatus, modelRoutes);
router.use("/data", requireAuth, checkBanStatus, dataRoutes)

export default router;