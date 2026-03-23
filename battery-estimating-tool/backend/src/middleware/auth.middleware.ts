import { Request, Response, NextFunction } from "express";
import { auth } from "@/services/auth"

/**
 * Middleware that enforces authentication by validating the session from the request headers.
 *
 * Retrieves the current session using the auth API and attaches the authenticated
 * user to `req.user` for downstream middleware and route handlers. If no valid
 * session is found, or if session retrieval throws, the request is terminated.
 *
 * Should be applied before any middleware or route handler that depends on `req.user`,
 * such as {@link checkBanStatus}.
 *
 * @param req - Express request object. Headers are forwarded to the auth API for session lookup.
 * @param res - Express response object used to return errors if authentication fails.
 * @param next - Express next function, called if the session is valid and `req.user` is set.
 *
 * @throws {401} If no valid session is found (`session.user` is missing).
 * @throws {401} If the auth API throws (e.g. malformed or expired session).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {

    // Retrieves current session
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as Record<string, string>)
    });
    // If no valid session
    if (!session?.user) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    // Attaches user
    (req as any).user = session.user;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Invalid session" });
  }
}

/**
 * Middleware that blocks requests from banned or unauthenticated users.
 *
 * Expects `req.user` to be populated — apply {@link requireAuth} before this middleware.
 * 
 * If the user is missing or banned, the request is terminated
 * with a 403. Otherwise, passes control to the next middleware.
 *
 * @param req - Express request object. Expects `req.user` to be set by auth middleware.
 * @param res - Express response object used to return a 403 if the user is banned.
 * @param next - Express next function, called if the user is authenticated and not banned.
 *
 * @throws {403} If `req.user` is missing or `req.user.banned` is `true`.
 */
export const checkBanStatus = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.banned === true) return res.status(403).json({ ok: false, message: "Forbidden" });
  next();
};

/**
 * Middleware factory that restricts access to users with a specific role.
 *
 * Returns a middleware function that compares `req.user.role` against the
 * provided `role`. If the user is missing or does not have the required role,
 * the request is terminated with a 403. Otherwise, passes control to the next middleware.
 *
 * Expects `req.user` to be populated — apply {@link requireAuth} before this middleware.
 *
 * @param role - The role required to proceed (e.g. `"admin"`, `"moderator"`).
 * @returns An Express middleware function that allows the request if `req.user.role === role`,
 *          or responds with 403 otherwise.
 *
 * @throws {403} If `req.user` is missing or `req.user.role` does not match `role`.
 *
 * @example
 * router.get('/admin/users', requireAuth, requireRole('admin'), handler);
 */
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) return res.status(403).json({ ok: false, message: "Forbidden" });
    next();
  };
}

/**
 * Middleware factory that restricts access to a specific user by ID.
 *
 * Returns a middleware function that compares `req.user.id` against the
 * provided `id`. Useful for protecting routes that should only be accessible
 * by a specific user, such as admin-only endpoints.
 *
 * Expects `req.user` to be populated — apply {@link requireAuth} before this middleware.
 *
 * @param id - The user ID that is permitted to proceed.
 * @returns An Express middleware function that allows the request if `req.user.id === id`,
 *          or responds with 403 otherwise.
 *
 * @throws {403} If `req.user` is missing or `req.user.id` does not match `id`.
 */
export const verifyUserById = (id: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.id !== id) return res.status(403).json({ ok: false, message: "Forbidden" });
    next();
  };
}