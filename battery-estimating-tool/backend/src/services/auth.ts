import { betterAuth } from "better-auth";
import { bearer, admin, username } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"
import { user } from "@/db/schema";
import { sendEmail } from "./email.service";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.REACT_APP_FRONTEND_URL!],
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            console.log("Sending verification email to", user.email, url); // keep until confirmed working
            void sendEmail(
                user.email,
                "Verify your email address",
                `<p><a href="${url}">Click here to verify</a></p>`
            );
        },
    },
    user: {
        validate: ({ email, username, firstName, lastName, academicAffiliation, password }) => {
            const errors: string[] = [];

            // BLOCK DISPOSABLE EMAILS
            const blocked = ["mailinator.com", "10minutemail.com"]; // TODO: ADD MORE?
            const domain = email.split("@")[1];

            if (blocked.includes(domain)) {
                errors.push("Disposable emails not allowed");
            }

            // NAME
            const nameRegex = /^[a-zA-ZÀ-ÿ' -]{1,50}$/;
            if (!firstName || !nameRegex.test(firstName)) {
                errors.push("Invalid first name");
            }
            if (!lastName || !nameRegex.test(lastName)) {
                errors.push("Invalid last name");
            }

            // USERNAME
            if (!username) errors.push("Username is required");

            // PASSWORD
            if (!password) errors.push("Password is required");
            else {
                if (password.length < 8) errors.push("Password must be at least 8 characters");
                if (!/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
                if (!/[a-z]/.test(password)) errors.push("Must contain a lowercase letter");
                if (!/[0-9]/.test(password)) errors.push("Must contain a number");
                if (!/[!@#$%^&*]/.test(password)) errors.push("Must contain a special character");
            }

            // ACADEMIC AFFILIATION 
            const affiliationRegex = /^[a-zA-Z0-9 .,'&()-]{1,100}$/;
            if (!academicAffiliation || !affiliationRegex.test(academicAffiliation)) {
                errors.push("Invalid academic affiliation");
            }

            if (errors.length > 0) throw new Error(errors.join(", "));
        },
        additionalFields: { // ALLOWS US TO PASS CUSTOM FIELDS INTO USER CREATION
            firstName: { type: "string", required: true, input: true, fieldName: "first_name" },
            lastName: { type: "string", required: true, input: true, fieldName: "last_name" },
            academicAffiliation: { type: "string", required: true, input: true, fieldName: "academic_affiliation" },
            username: { type: "string", required: true, input: true, fieldName: "username" },
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        // Notify existing users when someone tries to re-register with their email
        onExistingUserSignUp: async ({ user }) => {
            void sendEmail(
                user.email,
                "Sign-up attempt with your email",
                `<p>Someone tried to register with your email. If this wasn't you, ignore this. If it was, <a href="http://localhost:3000/login">sign in here</a>.</p>`
            );
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    console.log("db hook user:", user); // check what fields are here
                    if (!user.username) {
                        throw new Error("Username is required");
                    }
                },
            },
        },
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
            strategy: "jwt"
        }
    },
    plugins: [
        bearer(),
        admin(),
        username({ // USERNAME SETTINGS FOR VALIDATION AND NORMALIZATION
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
    rateLimit: { // RATE LIMITING
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