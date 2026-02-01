import { Router } from "express";
import userRoutes from "./user.routes";
import modelRoutes from "./model.routes";
import dataRoutes from "./data.routes";

const router = Router();

// Routes
router.use("/user", userRoutes);
router.use("/model", modelRoutes);
router.use("/data", dataRoutes)

export default router;