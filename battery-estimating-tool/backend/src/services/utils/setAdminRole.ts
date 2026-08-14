/**
 * Grants (or revokes) the admin role for a user, identified by email or id.
 *
 * Usage:
 *   npx tsx src/services/utils/setAdminRole.ts <email-or-userId>
 *   npx tsx src/services/utils/setAdminRole.ts <email-or-userId> --revoke
 *
 * This talks to the DB directly rather than better-auth's admin plugin API
 * (`auth.api.setRole`), since that API itself requires an existing admin
 * session to call — this script is how you create the first one.
 *
 * auth.ts has session.cookieCache enabled (5 min JWT cache), so a session
 * that was already active before this runs won't see the new role until
 * that cache expires — log out and back in on the affected account to pick
 * it up immediately.
 */
import "dotenv/config";
import { eq, or } from "drizzle-orm";
import { db } from "@/db/index";
import { user } from "@/db/schema";

const identifier = process.argv[2];
const revoke = process.argv.includes("--revoke");

if (!identifier) {
  console.error("Usage: npx tsx src/services/utils/setAdminRole.ts <email-or-userId> [--revoke]");
  process.exit(1);
}

async function main() {
  const [match] = await db
    .select()
    .from(user)
    .where(or(eq(user.email, identifier), eq(user.id, identifier)))
    .limit(1);

  if (!match) {
    console.error(`No user found with email or id "${identifier}".`);
    process.exit(1);
  }

  const role = revoke ? null : "admin";
  await db.update(user).set({ role }).where(eq(user.id, match.id));

  console.log(
    `${revoke ? "Revoked admin from" : "Granted admin to"} ${match.name} <${match.email}> (id: ${match.id})`,
  );
  console.log("If that account has an active session, log out and back in to pick this up — cookieCache holds the old role for up to 5 minutes otherwise.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to set role:", err);
  process.exit(1);
});
