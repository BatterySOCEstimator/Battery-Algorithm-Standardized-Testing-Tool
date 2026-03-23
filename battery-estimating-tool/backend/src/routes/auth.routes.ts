import { Router } from "express"; 
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/services/auth";

const router = Router();

// Mount betterauth handler to these endpoints
router.use("/", toNodeHandler(auth));

export default router;