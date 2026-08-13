/**
 * Reset script — drops the `models` table and deletes everything under
 * UPLOAD_DIR. Intended for deploying the storageId schema change to an
 * environment (e.g. prod) where existing rows/files predate it and aren't
 * worth migrating.
 *
 * Usage:
 *   npx tsx src/services/utils/resetModelsAndUploads.ts           # interactive, asks for confirmation
 *   npx tsx src/services/utils/resetModelsAndUploads.ts --dry-run # prints what would happen, changes nothing
 *
 * After this runs, re-apply the schema (e.g. `npx drizzle-kit push` or your
 * migration step) to recreate the `models` table before the app can accept
 * uploads again — this script only tears down, it does not rebuild.
 *
 * DESTRUCTIVE. Uses whatever DATABASE_URL / UPLOAD_DIR are in the current
 * environment, so double-check those are actually pointed at the target you
 * mean to wipe before confirming.
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import readline from "readline/promises";
import { sql } from "drizzle-orm";
import { db } from "@/db/index";

const dryRun = process.argv.includes("--dry-run");

// Mask the password portion of the connection string for display.
function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "****";
    return parsed.toString();
  } catch {
    return url;
  }
}

async function countModelRows(): Promise<number | null> {
  try {
    const result = await db.execute(sql`SELECT COUNT(*)::int AS count FROM "models"`);
    return (result.rows[0] as { count: number } | undefined)?.count ?? 0;
  } catch {
    // Table doesn't exist (already dropped, or never created) — nothing to count.
    return null;
  }
}

async function listUploadEntries(uploadDir: string): Promise<string[]> {
  try {
    return await fs.readdir(uploadDir);
  } catch {
    return [];
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

  const rowCount = await countModelRows();
  const uploadEntries = await listUploadEntries(uploadDir);

  console.log("This will:");
  console.log(`  1. DROP TABLE "models"${rowCount === null ? " (table doesn't currently exist)" : ` — ${rowCount} row(s)`}`);
  console.log(`  2. Delete everything under ${uploadDir} — ${uploadEntries.length} entr${uploadEntries.length === 1 ? "y" : "ies"}`);
  console.log();
  console.log(`Target database: ${maskDatabaseUrl(databaseUrl)}`);
  console.log();
  console.log("You will need to re-apply the schema (drizzle-kit push / migrate) afterward to recreate the models table.");

  if (dryRun) {
    console.log("\n--dry-run: no changes made.");
    process.exit(0);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('\nType "DROP" to confirm, anything else cancels: ');
  rl.close();

  if (answer !== "DROP") {
    console.log("Cancelled. No changes made.");
    process.exit(0);
  }

  console.log("\nDropping models table...");
  await db.execute(sql`DROP TABLE IF EXISTS "models"`);
  console.log("Done.");

  console.log(`Clearing ${uploadDir}...`);
  await fs.mkdir(uploadDir, { recursive: true });
  await Promise.all(
    uploadEntries.map((entry) => fs.rm(path.join(uploadDir, entry), { recursive: true, force: true })),
  );
  console.log("Done.");

  console.log("\nReset complete. Re-run your schema deploy step (e.g. npx drizzle-kit push) to recreate the models table.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
