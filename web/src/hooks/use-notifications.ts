"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string | null;
  type: "article" | "donation" | "job" | "announcement";
  resourceId: string | null;
  link: string | null;
  articleId: string | null;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef(new Set<string>());

  // Fetch initial notifications
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          const data = json.data as Notification[];
          setNotifications(data);
          for (const n of data) {
            seenIds.current.add(n.id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        if (seenIds.current.has(notification.id)) return;
        seenIds.current.add(notification.id);
        setNotifications((prev) => [notification, ...prev]);
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
