import { Router } from "express";
import {
  fetchLeaderboardData,
  fetchModelData,
  fetchUserModelJoin,
} from "@/controllers/data.controller";
import { requireAuth, checkBanStatus, attachUserIfPresent } from "@/middleware/auth.middleware";

const router = Router();

// Fetch many models
router.get(
  "/fetchLeaderboardData",
  // Stays reachable by anonymous users, but attaches req.user when a
  // session exists so the controller can also include the caller's own
  // private models alongside the public ones.
  attachUserIfPresent,
  fetchLeaderboardData,
);
// Fetch one model by ID
router.get("/fetchModelData/:id", requireAuth, checkBanStatus, fetchModelData);
router.get(
  "/fetchUserModelJoin",
  //requireAuth,
  //checkBanStatus,
  fetchUserModelJoin,
);

// router.post("/fetchVisualizerData", fetchVisualizerData)

export default router;
