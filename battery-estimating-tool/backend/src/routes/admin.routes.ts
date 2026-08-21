import { Router } from "express";
import { listUsers, banUser, unbanUser, revokeSessions } from "@/controllers/admin.controller";
import { requireAuth, checkBanStatus, requireRole } from "@/middleware/auth.middleware";

const router = Router();

// Every route here is admin-only.. requireRole re-derives the role from the authenticated session on every request, never from anything client-supplied.
router.get("/users", requireAuth, checkBanStatus, requireRole("admin"), listUsers);
router.post("/users/:id/ban", requireAuth, checkBanStatus, requireRole("admin"), banUser);
router.post("/users/:id/unban", requireAuth, checkBanStatus, requireRole("admin"), unbanUser);
router.post("/users/:id/revoke-sessions", requireAuth, checkBanStatus, requireRole("admin"), revokeSessions);

export default router;
