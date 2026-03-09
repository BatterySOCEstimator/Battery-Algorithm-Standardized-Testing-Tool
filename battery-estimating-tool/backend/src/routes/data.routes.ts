import { Router } from "express"; 
import { fetchLeaderboardData } from "@/controllers/data.controller";
import { requireAuth, checkBanStatus } from "@/middleware/auth";

const router = Router();

router.get("/fetchLeaderboardData", requireAuth, checkBanStatus, fetchLeaderboardData)
// router.post("/fetchVisualizerData", fetchVisualizerData)

export default router;