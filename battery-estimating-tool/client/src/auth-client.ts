import { createAuthClient } from "better-auth/client"
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins"
import { auth } from "../../backend/src/utils/auth"
import { username } from "better-auth/plugins";

// Auth client
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:8000",
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
            onRequest: (ctx) => console.log("Registering..."),
            onSuccess: (ctx) => console.log("Registration successful!"),
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

    if (email) {
        return authClient.signIn.email(
            {
                email,
                password,
                callbackURL: "/leaderboards", // redirect after successful login
            },
            {
                onRequest: () => console.log("Logging in..."),
                onSuccess: () => console.log("Login successful!"),
                onError: (ctx) => alert(ctx.error.message),
            }
        );
    } else if (username) {
        return authClient.signIn.username(
            {
                username,
                password,
                callbackURL: "/leaderboards", 
            },
            {
                onRequest: () => console.log("Logging in..."),
                onSuccess: () => console.log("Login successful!"),
                onError: (ctx) => alert(ctx.error.message),
            }
        );
    } else {
        throw new Error("Either email or username must be provided");
    }
}

// LOGOUT
export async function logout() {
    try {
        const session = await authClient.getSession();

        if (!session) {
            console.log("No user currently logged in.");
            return; // don't call signOut
        }

        await authClient.signOut(); // Clear session
        console.log("Logout successful");

        // Optionally redirect manually
        window.location.href = "/";
    } catch (err: any) {
        console.error("Logout failed:", err);
        alert(err.message);
    }
}

// Get currently logged in user's email
export async function whoAmI(): Promise<string | null> {
  try {
    const session = await authClient.getSession();

    if (!session || !session.data?.user) {
      return null; // no logged-in user
    }

    return session.data.user.email;
  } catch (err: any) {
    console.error("Failed to get current user:", err);
    return null;
  }
}