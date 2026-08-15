import { Response } from 'express';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { logger } from '@/services/logger.service';

type NotificationType = 'success' | 'error' | 'info';

// Per-process registry of open SSE connections (see notification.controller.ts's
// streamNotifications), keyed by userId — a user can have more than one tab/
// device connected at once. This is in-memory and per-process, so it only
// fans out live pushes to clients connected to *this* server instance; the
// DB row is always the source of truth, and a client that reconnects (or
// missed a push because it wasn't connected) just re-fetches the full list.
const sseClients = new Map<string, Set<Response>>();

export const registerSseClient = (userId: string, res: Response) => {
  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId)!.add(res);
};

export const unregisterSseClient = (userId: string, res: Response) => {
  const clients = sseClients.get(userId);
  if (!clients) return;
  clients.delete(res);
  if (clients.size === 0) sseClients.delete(userId);
};

/**
 * Creates a notification for a user and, if they have any live connections
 * (see {@link registerSseClient}), pushes it to them immediately over SSE.
 *
 * Fire-and-forget safe (call with `void`) — errors are logged, not thrown,
 * so a notification failure never breaks the email/DB-update flow it's
 * attached alongside.
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
) => {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({ userId, type, title, message })
      .returning();

    const clients = sseClients.get(userId);
    if (clients) {
      const payload = `data: ${JSON.stringify(notification)}\n\n`;
      for (const client of clients) client.write(payload);
    }

    return notification;
  } catch (err) {
    logger.error('notification.service - Failed to create notification', { err, userId, title });
    return null;
  }
};
