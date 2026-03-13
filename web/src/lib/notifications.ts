import { EventEmitter } from "events";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";

type NotificationType = "article" | "donation" | "job" | "announcement";

export interface NotificationPayload {
  id: string;
  userId: string;
  title: string;
  message: string | null;
  type: NotificationType;
  resourceId: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

interface Writer {
  write(chunk: string): void;
}

class NotificationEmitter {
  private emitter = new EventEmitter();
  private connections = new Map<string, Set<Writer>>();

  constructor() {
    this.emitter.setMaxListeners(0);
  }

  addConnection(userId: string, writer: Writer) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(writer);
  }

  removeConnection(userId: string, writer: Writer) {
    const writers = this.connections.get(userId);
    if (writers) {
      writers.delete(writer);
      if (writers.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  send(userId: string, notification: NotificationPayload) {
    const writers = this.connections.get(userId);
    if (writers) {
      const data = `data: ${JSON.stringify(notification)}\n\n`;
      for (const writer of writers) {
        try {
          writer.write(data);
        } catch {
          // Writer closed, will be cleaned up
        }
      }
    }
  }

  broadcast(notification: NotificationPayload, userIds: string[]) {
    for (const userId of userIds) {
      this.send(userId, { ...notification, userId });
    }
  }

  sendKeepalive() {
    for (const [, writers] of this.connections) {
      for (const writer of writers) {
        try {
          writer.write(": keepalive\n\n");
        } catch {
          // Writer closed
        }
      }
    }
  }
}

// Singleton pattern (survives HMR)
const globalForNotifications = globalThis as unknown as {
  notificationEmitter: NotificationEmitter | undefined;
};

export const notificationEmitter =
  globalForNotifications.notificationEmitter ?? new NotificationEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForNotifications.notificationEmitter = notificationEmitter;
}

export function buildNotificationLink(type: NotificationType, resourceId?: string): string {
  switch (type) {
    case "article":
      return resourceId ? `/news/${resourceId}` : "/news";
    case "donation":
      return resourceId ? `/donation/${resourceId}` : "/donation";
    case "job":
      return "/career";
    case "announcement":
      return "/news";
  }
}

export async function createNotification(params: {
  userId: string;
  title: string;
  message?: string;
  type: NotificationType;
  resourceId?: string;
  link?: string;
}): Promise<NotificationPayload> {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      title: params.title,
      message: params.message ?? null,
      type: params.type,
      resourceId: params.resourceId ?? null,
      link: params.link ?? null,
    })
    .returning();

  const payload: NotificationPayload = {
    id: row.id,
    userId: row.userId,
    title: row.title,
    message: row.message,
    type: row.type,
    resourceId: row.resourceId,
    link: row.link,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };

  notificationEmitter.send(params.userId, payload);
  return payload;
}

export async function createBroadcastNotification(params: {
  title: string;
  message?: string;
  type: NotificationType;
  resourceId?: string;
  link?: string;
}): Promise<void> {
  const allUsers = await db
    .select({ id: users.id })
    .from(users);

  if (allUsers.length === 0) return;

  const values = allUsers.map((u) => ({
    userId: u.id,
    title: params.title,
    message: params.message ?? null,
    type: params.type as NotificationType,
    resourceId: params.resourceId ?? null,
    link: params.link ?? null,
  }));

  const rows = await db.insert(notifications).values(values).returning();

  const payloads = rows.map((row): NotificationPayload => ({
    id: row.id,
    userId: row.userId,
    title: row.title,
    message: row.message,
    type: row.type,
    resourceId: row.resourceId,
    link: row.link,
    isRead: row.isRead,
    createdAt: row.createdAt,
  }));

  for (const payload of payloads) {
    notificationEmitter.send(payload.userId, payload);
  }
}
