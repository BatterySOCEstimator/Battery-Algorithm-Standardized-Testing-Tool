import { Router } from "express"; 
import { fetchLeaderboardData, fetchModelData, fetchUserModelJoin } from "@/controllers/data.controller";
import { requireAuth, checkBanStatus } from "@/middleware/auth.middleware";

const router = Router();

// Fetch many models 
router.get("/fetchLeaderboardData", requireAuth, checkBanStatus, fetchLeaderboardData)
router.get("/fetchUserModelJoin", requireAuth, checkBanStatus, fetchUserModelJoin)
// Fetch one model by ID
router.get("/fetchModelData/:id", requireAuth, checkBanStatus, fetchModelData)

// router.post("/fetchVisualizerData", fetchVisualizerData)

export default router;