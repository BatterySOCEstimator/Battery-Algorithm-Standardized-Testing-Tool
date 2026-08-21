import { Request, Response } from 'express';
import { db } from '../db';
import { user, session } from '../db/schema';
import { eq, asc, desc, sql, count, ilike, or, SQL } from 'drizzle-orm';
import { logger } from '@/services/logger.service';

const BAN_REASON_MAX_LENGTH = 500;
const SEARCH_MAX_LENGTH = 100;

// Columns the users table can be sorted by — an allowlist, not a raw
// client-supplied column name, so `sortBy` can never reach the query as
// arbitrary SQL. `lastLogin` isn't a real column on `user` (it comes from
// the session subquery below) and is handled as a special case.
const SORTABLE_COLUMNS = ['name', 'email', 'username', 'role', 'banned', 'createdAt', 'lastLogin'] as const;
type SortableColumn = typeof SORTABLE_COLUMNS[number];

/**
 * Lists registered users for the admin users table, paginated and sorted at
 * the database level — this is expected to scale to a large user base, so
 * it never pulls the whole table into memory just to sort/slice it in JS.
 *
 * Admin-only!! enforced by `requireRole('admin')` on the route, not by
 * anything in this controller. Never selects password/session token data
 * (better-auth keeps those in separate tables the query doesn't touch
 * beyond a read-only aggregate on `session.createdAt` for "last login").
 *
 * @queryParam limit - Max rows to return (default "25", clamped 1-100).
 * @queryParam offset - Rows to skip (default "0").
 * @queryParam sortBy - One of {@link SORTABLE_COLUMNS} (default "createdAt").
 * @queryParam order - "asc" or "desc" (default "desc").
 * @queryParam search - Optional case-insensitive partial match against name, email, or username.
 *
 * @returns `{ users: {...}[], total: number, limit, offset }`.
 * @throws {400} If limit/offset aren't valid numbers, sortBy/order aren't recognized, or search is too long.
 * @throws {500} If the database query fails.
 */
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as any).user?.id;
  const {
    limit = '25',
    offset = '0',
    sortBy = 'createdAt',
    order = 'desc',
    search,
  } = req.query as Record<string, string>;

  const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 100);
  const parsedOffset = Math.max(parseInt(offset), 0);
  if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
    logger.warn('admin/users - Invalid pagination params', { limit, offset, adminId, ip: req.ip });
    res.status(400).json({ error: 'limit and offset must be valid numbers' });
    return;
  }
  if (order !== 'asc' && order !== 'desc') {
    logger.warn('admin/users - Invalid order param', { order, adminId, ip: req.ip });
    res.status(400).json({ error: 'order must be asc or desc' });
    return;
  }
  if (!SORTABLE_COLUMNS.includes(sortBy as SortableColumn)) {
    logger.warn('admin/users - Invalid sortBy param', { sortBy, adminId, ip: req.ip });
    res.status(400).json({ error: `sortBy must be one of: ${SORTABLE_COLUMNS.join(', ')}` });
    return;
  }
  if (search !== undefined && search.length > SEARCH_MAX_LENGTH) {
    logger.warn('admin/users - Search term too long', { searchLength: search.length, adminId, ip: req.ip });
    res.status(400).json({ error: `search must be ${SEARCH_MAX_LENGTH} characters or fewer.` });
    return;
  }

  const orderFn = order === 'asc' ? asc : desc;

  // Filters at the database level, not after fetching, applies to both the page query and the count query below so pagination stays consistent
  const trimmedSearch = search?.trim();
  const searchFilter: SQL | undefined = trimmedSearch
    ? or(
        ilike(user.name, `%${trimmedSearch}%`),
        ilike(user.email, `%${trimmedSearch}%`),
        ilike(user.username, `%${trimmedSearch}%`),
      )
    : undefined;

  try {
    // Aggregated once as a subquery . "last login" stays a single indexed join instead of N extra queries.
    const lastLoginSub = db
      .select({
        userId: session.userId,
        lastLogin: sql<Date>`max(${session.createdAt})`.as('last_login'),
      })
      .from(session)
      .groupBy(session.userId)
      .as('last_login_sub');

    const sortColumn = sortBy === 'lastLogin' ? lastLoginSub.lastLogin : user[sortBy as Exclude<SortableColumn, 'lastLogin'>];

    const [data, [{ total }]] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          banned: user.banned,
          banReason: user.banReason,
          banExpires: user.banExpires,
          createdAt: user.createdAt,
          lastLogin: lastLoginSub.lastLogin,
        })
        .from(user)
        .leftJoin(lastLoginSub, eq(user.id, lastLoginSub.userId))
        .where(searchFilter)
        .orderBy(orderFn(sortColumn))
        .limit(parsedLimit)
        .offset(parsedOffset),
      db.select({ total: count() }).from(user).where(searchFilter),
    ]);

    logger.info('admin/users - Query successful', { adminId, results: data.length, total, sortBy, order, limit: parsedLimit, offset: parsedOffset, search: trimmedSearch });
    res.json({ users: data, total, limit: parsedLimit, offset: parsedOffset });
  } catch (err) {
    logger.error('admin/users - DB query failed', { err, adminId, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Bans a user, blocking them from authenticated requests going forward
 * (enforced by {@link checkBanStatus}) and immediately revoking their
 * existing sessions.
 *
 * Admin-only! enforced by `requireRole('admin')` on the route. Refuses to
 * let an admin ban their own account. `req.body.reason` is optional and
 * capped at {@link BAN_REASON_MAX_LENGTH} characters.
 *
 * @throws {400} If `id` is not a valid user id, the reason is too long, or the admin targets themselves.
 * @throws {404} If no user exists with the given id.
 * @throws {500} If the database update fails.
 */
export const banUser = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as any).user?.id;
  const targetId = req.params.id as string;
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : undefined;

  if (!targetId) {
    res.status(400).json({ error: 'Invalid user id.' });
    return;
  }
  if (reason !== undefined && reason.length > BAN_REASON_MAX_LENGTH) {
    res.status(400).json({ error: `reason must be ${BAN_REASON_MAX_LENGTH} characters or fewer.` });
    return;
  }
  if (targetId === adminId) {
    logger.warn('admin/ban - Admin attempted to ban their own account', { adminId, ip: req.ip });
    res.status(400).json({ error: 'You cannot ban your own account.' });
    return;
  }

  try {
    const [target] = await db.select().from(user).where(eq(user.id, targetId)).limit(1);
    if (!target) {
      logger.warn('admin/ban - Target user not found', { adminId, targetId, ip: req.ip });
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const [updated] = await db
      .update(user)
      .set({ banned: true, banReason: reason || null })
      .where(eq(user.id, targetId))
      .returning();

    // Revoking sessions makes the ban take effect server-side immediately rather than waiting for their existing session to expire.
    await db.delete(session).where(eq(session.userId, targetId));

    logger.info('admin/ban - User banned', { adminId, targetId, reason });
    res.status(200).json({
      message: `${target.name} has been banned.`,
      user: { id: updated.id, banned: updated.banned, banReason: updated.banReason },
    });
  } catch (err) {
    logger.error('admin/ban - Failed to ban user', { err, adminId, targetId, ip: req.ip });
    res.status(500).json({ error: 'Failed to ban user.' });
  }
};

/**
 * Reverses a ban, restoring the user's ability to authenticate.
 *
 * Admin-only, enforced by `requireRole('admin')` on the route.
 *
 * @throws {400} If `id` is not a valid user id.
 * @throws {404} If no user exists with the given id.
 * @throws {500} If the database update fails.
 */
export const unbanUser = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as any).user?.id;
  const targetId = req.params.id as string;

  if (!targetId) {
    res.status(400).json({ error: 'Invalid user id.' });
    return;
  }

  try {
    const [target] = await db.select().from(user).where(eq(user.id, targetId)).limit(1);
    if (!target) {
      logger.warn('admin/unban - Target user not found', { adminId, targetId, ip: req.ip });
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const [updated] = await db
      .update(user)
      .set({ banned: false, banReason: null, banExpires: null })
      .where(eq(user.id, targetId))
      .returning();

    logger.info('admin/unban - User unbanned', { adminId, targetId });
    res.status(200).json({
      message: `${target.name} has been unbanned.`,
      user: { id: updated.id, banned: updated.banned },
    });
  } catch (err) {
    logger.error('admin/unban - Failed to unban user', { err, adminId, targetId, ip: req.ip });
    res.status(500).json({ error: 'Failed to unban user.' });
  }
};

/**
 * Force-signs a user out everywhere by deleting every row in `session` for
 * their account — the same mechanism {@link banUser} already uses to make a
 * ban take effect immediately, exposed here on its own so an admin can log
 * a user out (e.g. a suspected compromised session) without banning them.
 *
 * Admin-only, enforced by `requireRole('admin')` on the route. Unlike
 * {@link banUser}, an admin targeting their own account is allowed — it
 * just signs out their other sessions rather than locking them out of
 * admin capabilities the way a self-ban would.
 *
 * @throws {400} If `id` is not a valid user id.
 * @throws {404} If no user exists with the given id.
 * @throws {500} If the database delete fails.
 */
export const revokeSessions = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as any).user?.id;
  const targetId = req.params.id as string;

  if (!targetId) {
    res.status(400).json({ error: 'Invalid user id.' });
    return;
  }

  try {
    const [target] = await db.select().from(user).where(eq(user.id, targetId)).limit(1);
    if (!target) {
      logger.warn('admin/revoke-sessions - Target user not found', { adminId, targetId, ip: req.ip });
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const revoked = await db.delete(session).where(eq(session.userId, targetId)).returning({ id: session.id });

    logger.info('admin/revoke-sessions - Sessions revoked', { adminId, targetId, count: revoked.length });
    res.status(200).json({
      message: revoked.length > 0
        ? `Revoked ${revoked.length} active session${revoked.length === 1 ? '' : 's'} for ${target.name}.`
        : `${target.name} has no active sessions.`,
      revokedCount: revoked.length,
    });
  } catch (err) {
    logger.error('admin/revoke-sessions - Failed to revoke sessions', { err, adminId, targetId, ip: req.ip });
    res.status(500).json({ error: 'Failed to revoke sessions.' });
  }
};
