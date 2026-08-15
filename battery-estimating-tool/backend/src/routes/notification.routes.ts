import { Router } from "express";
import {
  clearAllNotifications,
  clearNotification,
  listNotifications,
  streamNotifications,
} from "@/controllers/notification.controller";
import { requireAuth, checkBanStatus } from "@/middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, checkBanStatus, listNotifications);
router.get("/stream", requireAuth, checkBanStatus, streamNotifications);
router.delete("/:id", requireAuth, checkBanStatus, clearNotification);
router.delete("/", requireAuth, checkBanStatus, clearAllNotifications);

export default router;
