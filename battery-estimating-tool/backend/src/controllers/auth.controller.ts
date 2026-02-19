import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { auth } from "@/utils/auth"
import { db } from "@/db"; // your Drizzle instance
import { user } from "@/db/schema";

// Sign up
export const signUp = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, username, academicAffiliation } = req.body;

  try {
    // Step 1: Create user via Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: `${firstName} ${lastName}`, // Better Auth requires 'name'
        username,
      },
      asResponse: false,
    });


    const userId = result.user.id;

    // Step 2: Update custom fields in your user table
    await db.update(user)
      .set({
        firstName,
        lastName,
        academicAffiliation,
      })
      .where(eq(user.id, userId));

    res.status(201).json({ ok: true, userId });
  } catch (error: any) {
    console.error("Sign-up error:", error);
    res.status(400).json({ ok: false, message: error.message || "Sign-up failed" });
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

