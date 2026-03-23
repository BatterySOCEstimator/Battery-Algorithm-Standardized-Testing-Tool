import { deleteModel, test, uploadModel } from "@/controllers/model.controller";
import { checkModelNameUnique, uploadMiddleware } from "@/middleware/model.middleware";
import { requireAuth, checkBanStatus } from "@/middleware/auth.middleware";

import { Router } from "express";
const router = Router();


router.post('/upload',
    requireAuth,         // Require authentication -- may need to comment out for testing
    checkBanStatus,      // Check if user is banned -- may need to comment out for testing
    checkModelNameUnique,   // Check if name is unique 
    uploadMiddleware,       // Check if valid file types 
    uploadModel);   

// router.get("/retrieve", retrieve)
// router.post("/modify", modify)
router.delete("/delete/:id", 
    requireAuth,         // Require authentication -- may need to comment out for testing
    checkBanStatus,      // Check if user is banned -- may need to comment out for testing
    deleteModel)

router.get("/test", requireAuth, checkBanStatus, test)

export default router;