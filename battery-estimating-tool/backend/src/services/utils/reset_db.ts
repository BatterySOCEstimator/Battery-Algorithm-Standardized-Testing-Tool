/**
 * Database reset script — wipes the entire public schema and recreates it empty.
 *
 * Usage: npx tsx src/services/utils/reset_db.ts
 *
 * @remarks
 * Drops and recreates the public schema, permanently deleting all tables,
 * enums, indexes, and data. After running, regenerate and push the schema:
 *
 * ```bash
 * npx drizzle-kit generate
 * npx drizzle-kit push
 * ```
 *
 * @warning This is destructive and irreversible. Do not run in production.
 */
import 'dotenv/config';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
;

async function reset() {
    console.log("Dropping schema...");
    await db.execute(sql`DROP SCHEMA public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);
    console.log("Done. Run drizzle-kit generate && drizzle-kit push to recreate schema.");
    process.exit(0);
}

reset().catch((err) => {
    console.error("Reset failed:", err);
    process.exit(1);
});