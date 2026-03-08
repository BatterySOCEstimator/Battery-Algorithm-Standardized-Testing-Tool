import { Request, Response, NextFunction } from "express";
import { auth } from "@/utils/auth"

export async function requireAuth(req: Request, res: Response, next: NextFunction){
  try {
    const cookieHeader = req.headers.cookie; // Get cookie

    const session = await auth.api.getSession({ headers: { cookie: cookieHeader || "" } }); // Get session from cookie
  
    // If user not logged in
    if (!session?.user) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    // Otherwise attach user to request
    (req as any).user = session.user;
    next();
  } catch (err) {
      return res.status(401).json({ ok: false, message: "Invalid session" });
  }
}

// Check if user is banned
export const checkBanStatus = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.banned == true) return res.status(403).json({ ok: false, message: "Forbidden" });
  next();
};

// Checks whether or not a user has a given role
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) return res.status(403).json({ ok: false, message: "Forbidden" });
    next();
  };
}

// Verifies a user by ID
export const verifyUserById = (id: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.id !== id) return res.status(403).json({ ok: false, message: "Forbidden" });
    next();
  };
}

// Middleware to validate sign-up request
export const validateSignUp = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName, userName, academicAffiliation } = req.body;

  const errors: string[] = [];

  if (!email) errors.push("Email is required");
  if (!password || !meetsRequirements(password)) errors.push("Password must be at least 8 characters");
  if (!firstName) errors.push("First name is required");
  if (!lastName) errors.push("Last name is required");
  if (!userName) errors.push("Username is required");
  if (!academicAffiliation) errors.push("Academic affiliation is required");

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  function meetsRequirements(pass: string): boolean {

    return (pass.length > 8) // Can add more propositinos to check other criteria

  }

  next(); // all good, proceed to the controller
};

// Middleware to validate login request
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, username, password } = req.body;

  const errors: string[] = [];

  if (!password) errors.push("Password is required");

  if (!email && !username) errors.push("Either email or username is required");

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  next(); // all good, proceed to the controller
};