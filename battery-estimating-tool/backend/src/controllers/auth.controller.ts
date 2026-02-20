import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { auth } from "@/utils/auth"
import { db } from "@/db"; // your Drizzle instance
import { user } from "@/db/schema";

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

