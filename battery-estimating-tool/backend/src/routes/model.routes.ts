import { deleteModel, downloadFile, downloadTrainingData, listSubmittableUsers, test, updateModel, uploadModel } from "@/controllers/model.controller";
import { checkModelNameUnique, resolveSubmissionOwner, uploadMiddleware, packageModelSubmission } from "@/middleware/model.middleware";
import { requireAuth, checkBanStatus, requireRole } from "@/middleware/auth.middleware";

import { Router } from "express";
const router = Router();


router.post('/upload',
    requireAuth,            // Require authentication -- may need to comment out for testing
    checkBanStatus,         // Check if user is banned -- may need to comment out for testing
    resolveSubmissionOwner, // Resolve who the model is attributed to (self, or an admin's ?onBehalfOfUserId=)
    checkModelNameUnique,   // Check if name is unique (scoped to the resolved owner)
    uploadMiddleware,       // Check if valid file types
    packageModelSubmission, // Standardize on-disk shape: model/ ends up with exactly one .zip
    uploadModel             // Actual controller function
);

// Admin-only: list users an admin can submit a model on behalf of.
router.get("/users", requireAuth, checkBanStatus, requireRole("admin"), listSubmittableUsers);

router.delete("/delete/:id",
    requireAuth,         // Require authentication -- may need to comment out for testing
    checkBanStatus,      // Check if user is banned -- may need to comment out for testing
    deleteModel          // Actual controller function
);

router.patch("/update/:id",
    requireAuth,         // Require authentication -- may need to comment out for testing
    checkBanStatus,      // Check if user is banned -- may need to comment out for testing
    updateModel          // Actual controller function
);

router.get("/download/:token", 
    //requireAuth,        // Enforce auth
    //checkBanStatus,     // Checks if user is banned
    downloadFile)       // Downloads the file 


router.get( "/downloadTrainingData", 
    requireAuth,
    checkBanStatus,
    downloadTrainingData
);


router.get("/test", requireAuth, checkBanStatus, requireRole("admin"), test)

export default router;