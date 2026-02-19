import { betterAuth } from "better-auth";
import { bearer, admin, username } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"
import { user } from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
        user: {
            additionalFields: {
                firstName: {type: "string", required: true },
                lastName: {type: "string", required: true },
                academicAffiliation: {type: "string", required: true }
            },
        },
    },
    plugins: [ 
        bearer(),
        admin(),
        username(),
    ], 
});