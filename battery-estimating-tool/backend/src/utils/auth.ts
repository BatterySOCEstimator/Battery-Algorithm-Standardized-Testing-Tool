import { betterAuth } from "better-auth";
import { bearer, admin, username } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"
import { user } from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    user: {
        validate: ({ password }) => {
            const errors: string[] = [];

            if (!password) errors.push("Password is required");
            else {
                if (password.length < 8) errors.push("Password must be at least 8 characters");
                if (!/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
                if (!/[a-z]/.test(password)) errors.push("Must contain a lowercase letter");
                if (!/[0-9]/.test(password)) errors.push("Must contain a number");
                if (!/[!@#$%^&*]/.test(password)) errors.push("Must contain a special character");
            }
            if (errors.length > 0) throw new Error(errors.join(", "));
        },
        additionalFields: {
            firstName: { type: "string", required: true, input: true, fieldName: "first_name" },
            lastName: { type: "string", required: true, input: true, fieldName: "last_name" },
            academicAffiliation: { type: "string", required: true, input: true, fieldName: "academic_affiliation" }
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        bearer(),
        admin(),
        username({
            validationOrder: {
                username: "post-normalization",
            },
            displayUsernameValidator: (displayUsername) => {
                // Allow only alphanumeric characters, underscores, and hyphens
                return /^[a-zA-Z0-9_-]+$/.test(displayUsername)
            },
            usernameValidator: (username) => {
                if (username === "admin") {
                    return false // Don't allow username 'admin'
                }
                return /^[a-z0-9_-]+$/.test(username) // Check if valid symbols used
            },
            minUsernameLength: 5, // Minimum username length
            maxUsernameLength: 20, // Maximum username length
            usernameNormalization: (username) => username.toLowerCase(), // Normalize username
        }),
    ],
    rateLimit: {
        window: 10, // time window in seconds
        max: 100, // max requests in the window
        customRules: {
            "/sign-in/email": {
                window: 10,
                max: 3,
            },
        },
    },
});