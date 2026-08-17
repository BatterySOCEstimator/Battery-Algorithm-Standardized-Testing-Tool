import { createAuthClient } from "better-auth/client"
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins"
import { auth } from "../../backend/src/services/auth"

// Auth client
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    // baseURL: "http://localhost:8000", // Comment out in PROD
    plugins: [inferAdditionalFields<typeof auth>(), usernameClient()],
    fetchOptions: {
        onError: async (context) => {
            const { response } = context;
            if (response.status === 429) {
                const retryAfter = response.headers.get("X-Retry-After");
                console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
            }
        },
    },
})


// SIGN UP
// Resolves only on an actual server-confirmed success and rejects with the
// real error message otherwise (email already registered, invalid
// username, etc.) — same shape as login() below, so callers can just
// `await` it instead of assuming success once the request is fired off.
export async function signUp(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
    academicAffiliation: string;
}) {
    const { email, password, firstName, lastName, username, academicAffiliation } = data;
    return new Promise<void>((resolve, reject) => {
        authClient.signUp.email(
            {
                email, // user email address
                username,
                password, // user password -> min 8 characters by default
                name: `${firstName} ${lastName}`, // user display name
                firstName,
                lastName,
                academicAffiliation,
            },
            {
                onSuccess: () => resolve(),
                onError: (ctx) =>
                    reject(new Error(ctx.error.message ?? "Registration failed. Please try again.")),
            }
        );
    });
}

// LOGIN -- HANDLES BOTH USERNAME AND EMAIL
export async function login(options: {
    email?: string;
    username?: string;
    password: string;
}) {
    const { email, username, password } = options;
    if (!email && !username) {
        throw new Error("Either email or username must be provided.");
    }

    const isEmail = (value: string) => value.includes("@");
    const identifier = email ?? username!;

    return new Promise<void>((resolve, reject) => {
        const callbacks = {
            onSuccess: () => resolve(),
            // Routes on the actual error *code*, not just the HTTP status — a
            // banned account and an unverified email both come back as 403,
            // so checking status alone (the old behavior) misrouted every
            // banned login into the "please verify your email" message.
            onError: async (ctx: any) => {
                const code = ctx.error.code;

                if (code === "BANNED_USER") {
                    let message =
                        "Your account has been banned. Please contact support if you believe this is an error.";
                    // /api/auth/ban-reason independently re-verifies the password
                    // before ever revealing the reason (see its backend
                    // implementation) — this sign-in attempt already proved these
                    // credentials are valid, so it's safe to ask for it here.
                    // Whichever identifier was actually used to sign in (email or
                    // username) is what gets sent — the login form accepts either.
                    try {
                        const res = await fetch("/api/auth/ban-reason", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(
                                email ? { email, password } : { username, password }
                            ),
                        });
                        const data = await res.json();
                        if (data?.banned && data?.reason) {
                            message = `Your account has been banned. Reason: ${data.reason}`;
                        }
                    } catch {
                        // Falls back to the generic message above.
                    }
                    reject(new Error(message));
                    return;
                }

                if (code === "EMAIL_NOT_VERIFIED") {
                    authClient.signOut();
                    resendVerificationEmail(email ?? "");
                    reject(
                        new Error(
                            "Please verify your email before signing in. Check your inbox."
                        )
                    );
                    return;
                }

                reject(new Error(ctx.error.message ?? "Login failed. Please try again."));
            },
        };

        if (isEmail(identifier)) {
            authClient.signIn.email(
                { email: identifier, password },
                callbacks
            );
        } else {
            authClient.signIn.username(
                { username: identifier, password },
                callbacks
            );
        }
    });
}

// LOGOUT
export async function logout() {
    try {
        const session = await authClient.getSession();

        if (!session?.data?.user) {
            return; // don't call signOut
        }

        await authClient.signOut(); // Clear session

        // Redirect manually
        window.location.href = "/";
    } catch (err: any) {
        console.error("Logout failed:", err);
        alert(err.message);
    }
}

// Get currently logged in user's email
type AuthUser = Awaited<
    ReturnType<typeof authClient.getSession>
>["data"] extends { user: infer U } ? U : never;

export async function getUserInfo(): Promise<AuthUser | null> {
    try {
        const session = await authClient.getSession();
        return session?.data?.user ?? null;
    } catch {
        return null;
    }
}

export async function resendVerificationEmail(email: string) {
    const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/leaderboards",
    });
    return result;
}