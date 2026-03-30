import { betterAuth } from "better-auth";
import { bearer, admin, username } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"
import { sendEmail } from "./email.service";
import { logger } from "@/services/logger.service";

if (!process.env.BETTER_AUTH_URL) throw new Error("BETTER_AUTH_URL is not set");
if (!process.env.REACT_APP_FRONTEND_URL) throw new Error("REACT_APP_FRONTEND_URL is not set");

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.REACT_APP_FRONTEND_URL],
    database: drizzleAdapter(db, {
        provider: "pg",
    }),

    emailVerification: {
        /**
         * Sends a verification email to the user after registration.
         * The email contains a link to verify their address before they can sign in.
         */
        callbackURL: `${process.env.REACT_APP_FRONTEND_URL}/leaderboards`,
        sendVerificationEmail: async ({ user, url }) => {
            // Use token provided by better-auth to build our own link (redirect wasn't working otherwise)
            const token = new URL(url).searchParams.get('token');
            const callbackURL = encodeURIComponent(`${process.env.REACT_APP_FRONTEND_URL}/leaderboards`);
            const verifyUrl = `${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${callbackURL}`;

            logger.info('auth - Sending verification email', { email: user.email, verifyUrl });
            void sendEmail(
                user.email,
                "Verify your email address",
                `<p><a href="${verifyUrl}">Click here to verify</a></p>`
            );
        },
    },
    user: {
        /**
         * Validates user fields on registration before the record is created.
         * Collects all validation errors and throws them together as a single error.
         *
         * Rules:
         * - Email: must not be from a known disposable domain
         * - First/last name: 1–50 chars, letters only (including accented)
         * - Username: required (further validated by the username plugin)
         * - Password: min 8 chars, must include upper, lower, number, special char
         * - Academic affiliation: 1–100 chars, alphanumeric + common punctuation
         */
        validate: ({ email, username, firstName, lastName, academicAffiliation, password }) => {
            const errors: string[] = [];

            // Block known disposable email providers
            const BLOCKED_EMAIL_DOMAINS = ["mailinator.com", "10minutemail.com"];
            const domain = email.split("@")[1];
            if (BLOCKED_EMAIL_DOMAINS.includes(domain)) {
                errors.push("Disposable emails are not allowed");
            }

            // First and last name: letters only, including accented characters
            const nameRegex = /^[a-zA-ZÀ-ÿ' -]{1,50}$/;
            if (!firstName || !nameRegex.test(firstName)) errors.push("Invalid first name");
            if (!lastName || !nameRegex.test(lastName)) errors.push("Invalid last name");

            // Username presence check — format is enforced by the username plugin below
            if (!username) errors.push("Username is required");

            // Password strength rules
            if (!password) {
                errors.push("Password is required");
            } else {
                if (password.length < 8) errors.push("Password must be at least 8 characters");
                if (!/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
                if (!/[a-z]/.test(password)) errors.push("Must contain a lowercase letter");
                if (!/[0-9]/.test(password)) errors.push("Must contain a number");
                if (!/[!@#$%^&*]/.test(password)) errors.push("Must contain a special character");
            }

            // Academic affiliation: alphanumeric + common punctuation, max 50 chars
            const affiliationRegex = /^[a-zA-Z0-9 .,'&()-]{1,50}$/;
            if (!academicAffiliation || !affiliationRegex.test(academicAffiliation)) {
                errors.push("Invalid academic affiliation");
            }

            if (errors.length > 0) {
                logger.warn('auth - User validation failed', { email, errors });
                throw new Error(errors.join(", "));
            }
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

        /**
        * Fires when a registration attempt is made with an email that already exists.
        * Notifies the existing user so they're aware of the attempt.
        * Does NOT reveal whether the email is registered to the person attempting sign-up.
        */
        onExistingUserSignUp: async ({ user }) => {
            logger.warn('auth - Sign-up attempt with existing email', { email: user.email });
            void sendEmail(
                user.email,
                "Sign-up attempt with your email",
                `<p>Someone tried to register with your email. If this wasn't you, ignore this. If it was, <a href="${process.env.REACT_APP_FRONTEND_URL}/login">sign in here</a>.</p>`
            );
        },
    },
    databaseHooks: {
        user: {
            create: {
                /**
                 * Runs before a user record is inserted.
                 * Double-checks that username is present as a safety net,
                 * in case the username plugin or validate() didn't catch it.
                 */
                before: async (user) => {
                    logger.debug('auth - User pre-insert hook', { username: user.username, email: user.email });
                    if (!user.username) {
                        throw new Error("Username is required");
                    }
                },
            },
        },
    },

    session: {
        // Cache sessions in a JWT cookie to reduce DB lookups on every request
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 mins
            strategy: "jwt"
        }
    },

    plugins: [
        // Enables Bearer token auth (Authorization: Bearer <token>) alongside cookies
        bearer(),
        // Enables admin role and user management endpoints
        admin(),

        // USERNAME SETTINGS FOR VALIDATION AND NORMALIZATION
        username({

            validationOrder: {
                // Validate after normalization so casing doesn't affect checks
                username: "post-normalization",
            },

            // Display username allows alphanumeric, underscores, hyphens
            displayUsernameValidator: (displayUsername) => {
                // Allow only alphanumeric characters, underscores, and hyphens
                return /^[a-zA-Z0-9_-]+$/.test(displayUsername)
            },

            // Stored username (normalized): lowercase alphanumeric, underscores, hyphens
            // 'admin' is explicitly blocked to prevent impersonation
            usernameValidator: (username) => {
                if (username === "admin") return false;
                return /^[a-z0-9_-]+$/.test(username);
            },
            minUsernameLength: 5, // Minimum username length
            maxUsernameLength: 20, // Maximum username length
            // Normalize to lowercase before storage and validation
            usernameNormalization: (username) => username.toLowerCase(),
        }),
    ],

    logger: {
        disabled: false,
        level: "debug", // "debug" | "info" | "warn" | "error"
        log: (level, message, ...args) => {
            logger[level](`[Better Auth] ${message}`, ...args);
        },
    },

    // RATE LIMITING
    rateLimit: {
        window: 10, // time in seconds
        max: 100, // max requests in the window 
        customRules: {
            // Stricter limit on sign-in to slow brute force attempts
            "/sign-in/email": {
                window: 60,
                max: 5,
            },
        },
    },


});