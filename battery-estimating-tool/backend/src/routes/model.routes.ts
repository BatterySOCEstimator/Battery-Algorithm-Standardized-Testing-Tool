import { deleteModel, uploadModel } from "@/controllers/model.controller";
import { checkModelNameUnique, uploadMiddleware } from "@/middleware/model.middleware";
import { requireAuth, checkBanStatus } from "@/middleware/auth.middleware";

import { Router } from "express";
const router = Router();


router.post('/upload',
    // requireAuth,         // Require authentication
    // checkBanStatus,      // Check if user is banned
    checkModelNameUnique,   // Check if name is unique 
    uploadMiddleware,       // Check if valid file types 
    uploadModel);   

// router.get("/retrieve", retrieve)
// router.post("/modify", modify)
router.delete("/delete/:id", 
    // requireAuth,         // Require authentication
    // checkBanStatus,      // Check if user is banned
    deleteModel)

export default router;