import { deleteModel, downloadFile, test, uploadModel } from "@/controllers/model.controller";
import { checkModelNameUnique, uploadMiddleware } from "@/middleware/model.middleware";
import { requireAuth, checkBanStatus } from "@/middleware/auth.middleware";

import { Router } from "express";
const router = Router();


router.post('/upload',
    requireAuth,            // Require authentication -- may need to comment out for testing
    checkBanStatus,         // Check if user is banned -- may need to comment out for testing
    checkModelNameUnique,   // Check if name is unique 
    uploadMiddleware,       // Check if valid file types 
    uploadModel             // Actual controller function
);

router.delete("/delete/:id", 
    requireAuth,         // Require authentication -- may need to comment out for testing
    checkBanStatus,      // Check if user is banned -- may need to comment out for testing
    deleteModel          // Actual controller function
);

router.get("/download/:token", 
    //requireAuth,        // Enforce auth
    //checkBanStatus,     // Checks if user is banned
    downloadFile)       // Downloads the file 

router.get("/test", requireAuth, checkBanStatus, test)

export default router;