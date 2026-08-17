import { Request, Response } from "express";
import { auth } from "@/services/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/services/logger.service";

/**
 * Returns why a banned account was banned, so the login screen can show the
 * real reason instead of a generic message. Accepts either `email` or
 * `username` — the login form takes either, so this has to match.
 *
 * Re-runs the same sign-in better-auth would do (reusing its own password
 * verification rather than re-implementing it) so the reason is only ever
 * revealed to someone who has already proven they know the account's
 * password — a wrong password gets a generic response either way, the same
 * as it would from the normal sign-in endpoint, so this adds no new way to
 * probe whether an email/username is registered.
 *
 * @throws {400} If password is missing, or neither email nor username is provided.
 */
export const getBanReason = async (req: Request, res: Response): Promise<void> => {
  const { email, username, password } = req.body ?? {};
  if ((!email && !username) || !password) {
    res.status(400).json({ error: "email or username, and password, are required." });
    return;
  }

  try {
    if (email) {
      await auth.api.signInEmail({ body: { email, password }, headers: req.headers as any });
    } else {
      await auth.api.signInUsername({ body: { username, password }, headers: req.headers as any });
    }
    // Credentials were valid and the account isn't banned — nothing to report.
    res.status(200).json({ banned: false });
  } catch (err: any) {
    const code = err?.body?.code ?? err?.code;
    if (code !== "BANNED_USER") {
      // Wrong password, unverified email, etc. — same generic shape either way.
      res.status(200).json({ banned: false });
      return;
    }

    const identifierFilter = email ? eq(user.email, email) : eq(user.username, username);
    const [target] = await db.select({ banReason: user.banReason }).from(user).where(identifierFilter).limit(1);
    logger.info("auth/ban-reason - Revealed ban reason to verified credential holder", { email, username });
    res.status(200).json({ banned: true, reason: target?.banReason ?? null });
  }
};

/**
 * Dummy controller: return fake user info
 */
export const getMe = async (_req: Request, res: Response) => {
  res.json({ user: { id: 1, email: "test@example.com", name: "Test User" } });
};

/**
 * Dummy controller: pretend to update settings
 */
export const updateSettings = async (_req: Request, res: Response) => {
  res.json({ ok: true, message: "Settings updated (dummy)" });
};

