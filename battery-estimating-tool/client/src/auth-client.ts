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
export async function signUp(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
    academicAffiliation: string;
}) {
    const { email, password, firstName, lastName, username, academicAffiliation } = data;
    return authClient.signUp.email(
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
            onError: (ctx) => alert(ctx.error.message),
        }
    );
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
            onError: (ctx: any) => {
                if (ctx.error.status === 403) {
                    authClient.signOut();
                    resendVerificationEmail(email ?? "");
                    reject(
                        new Error(
                            "Please verify your email before signing in. Check your inbox."
                        )
                    );
                } else {
                    reject(new Error(ctx.error.message ?? "Login failed. Please try again."));
                }
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