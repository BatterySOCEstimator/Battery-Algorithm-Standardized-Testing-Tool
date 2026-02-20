import { Router } from "express"; 
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/utils/auth";
//import { loginController, signupController } from "../controllers/auth.controller";
//import { validateSignUp, validateLogin } from "@/middleware/auth";
//import { requireAuth } from "@/middleware/auth";

// import { FUNCTIONS } from "../controllers/users.controller";

const router = Router();

router.use("/", toNodeHandler(auth));

export default router;