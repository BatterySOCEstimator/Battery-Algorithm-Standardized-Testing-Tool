import { Router } from "express"; 
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/utils/auth";
import * as authController from "../controllers/auth.controller";
import { validateSignUp } from "@/middleware/auth";
//import { requireAuth } from "@/middleware/auth";

// import { FUNCTIONS } from "../controllers/users.controller";

const router = Router();


// Add your custom sign-up endpoint
router.post("/signup", 
    validateSignUp,         // Validate requuest
    authController.signUp   // Call signup function
);

export default router;