import { Request, Response, NextFunction } from "express";

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