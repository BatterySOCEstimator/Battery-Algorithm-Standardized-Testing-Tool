import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/services/auth";

const router = Router();


// Pre-validate sign-up fields before Better Auth handles the request
router.post("/sign-up/email", (req, res, next) => {
    const { email, password, username, firstName, lastName, academicAffiliation } = req.body;

    const missing: string[] = [];
    if (!email) missing.push("email");
    if (!password) missing.push("password");
    if (!username) missing.push("username");
    if (!firstName) missing.push("firstName");
    if (!lastName) missing.push("lastName");
    if (!academicAffiliation) missing.push("academicAffiliation");

    if (missing.length > 0) {
        return res.status(400).json({
            message: `Missing required fields: ${missing.join(", ")}`,
        });
    }

    next();
});

// Mount betterauth handler to these endpoints
router.use("/", toNodeHandler(auth));

export default router;