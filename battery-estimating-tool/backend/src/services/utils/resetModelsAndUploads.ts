/**
 * Reset script — drops the `models` table, deletes everything under
 * UPLOAD_DIR, then runs `drizzle-kit push --force` to recreate the table
 * from the current schema (storageId included). Intended for deploying the
 * storageId schema change to an environment (e.g. prod) where existing
 * rows/files predate it and aren't worth migrating.
 *
 * Usage:
 *   npx tsx src/services/utils/resetModelsAndUploads.ts           # interactive, asks for confirmation
 *   npx tsx src/services/utils/resetModelsAndUploads.ts --dry-run # prints what would happen, changes nothing
 *
 * DESTRUCTIVE. Uses whatever DATABASE_URL / UPLOAD_DIR are in the current
 * environment, so double-check those are actually pointed at the target you
 * mean to wipe before confirming. --force is passed to drizzle-kit push
 * since this script's own "DROP" prompt is already the confirmation for
 * that data loss — without it, push would stop and wait for a second,
 * separate interactive confirmation of its own.
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import readline from "readline/promises";
import { spawn } from "child_process";
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

function runDrizzlePush(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["drizzle-kit", "push", "--force"], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`drizzle-kit push exited with code ${code}`));
    });
  });
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
  console.log("  3. Run `drizzle-kit push --force` to recreate models from the current schema");
  console.log();
  console.log(`Target database: ${maskDatabaseUrl(databaseUrl)}`);

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

  console.log("\nRunning drizzle-kit push...");
  await runDrizzlePush();

  console.log("\nReset complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
