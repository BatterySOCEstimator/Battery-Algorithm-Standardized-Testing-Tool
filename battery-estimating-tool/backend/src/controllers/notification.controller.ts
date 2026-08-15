import { Request, Response } from 'express';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { logger } from '@/services/logger.service';
import { registerSseClient, unregisterSseClient } from '@/services/notification.service';

/**
 * Lists the authenticated user's current notifications, newest first.
 * Notifications are deleted (not flagged read) when cleared, so this is
 * always the full set of what's still "visible" to them.
 */
export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;

  try {
    const data = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    logger.info('notifications/list - Query successful', { userId, results: data.length });
    res.json({ notifications: data });
  } catch (err) {
    logger.error('notifications/list - DB query failed', { err, userId, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Dismisses a single notification. Ownership is enforced by filtering the
 * delete on both `id` and `userId` — a user can only ever clear their own.
 */
export const clearNotification = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  const id = parseInt(req.params.id as string, 10);

  if (isNaN(id)) {
    logger.warn('notifications/clear - Invalid notification ID', { id: req.params.id, userId, ip: req.ip });
    res.status(400).json({ error: 'Invalid notification ID.' });
    return;
  }

  try {
    const deleted = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      logger.warn('notifications/clear - Notification not found', { id, userId, ip: req.ip });
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }

    logger.info('notifications/clear - Notification cleared', { id, userId });
    res.status(200).json({ message: 'Notification cleared.' });
  } catch (err) {
    logger.error('notifications/clear - DB delete failed', { err, id, userId, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/** Clears every notification belonging to the authenticated user. */
export const clearAllNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;

  try {
    await db.delete(notifications).where(eq(notifications.userId, userId));
    logger.info('notifications/clearAll - All notifications cleared', { userId });
    res.status(200).json({ message: 'All notifications cleared.' });
  } catch (err) {
    logger.error('notifications/clearAll - DB delete failed', { err, userId, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Server-Sent Events stream of the authenticated user's new notifications,
 * pushed live as they're created (see notification.service.ts's
 * createNotification). The client still fetches the full list via
 * listNotifications on mount/reconnect — this only carries what's created
 * while a connection is actually open.
 */
export const streamNotifications = (req: Request, res: Response): void => {
  const userId = (req as any).user?.id;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(':ok\n\n');

  registerSseClient(userId, res);
  logger.debug('notifications/stream - Client connected', { userId });

  // Keeps idle connections alive through proxies/load balancers that would
  // otherwise time them out.
  const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterSseClient(userId, res);
    logger.debug('notifications/stream - Client disconnected', { userId });
  });
};
