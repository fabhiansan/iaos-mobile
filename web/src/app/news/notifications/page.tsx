"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Circle } from "lucide-react";
import { formatTimestamp } from "@/lib/articles";

interface Notification {
  id: string;
  title: string;
  articleId: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setNotifications(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 h-11">
        <button type="button" onClick={() => router.back()} className="shrink-0 cursor-pointer">
          <ChevronLeft size={16} className="text-neutral-900" />
        </button>
        <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
          Notification
        </h1>
        {unread.length > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="font-[family-name:var(--font-work-sans)] text-xs text-brand-600 cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-20">
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500">
            Loading...
          </p>
        </div>
      ) : (
        <div className="flex flex-col px-4 pt-4 gap-6">
          {/* Unread section */}
          {unread.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-neutral-800">
                {unread.length} Unread Notification
              </h2>
              {unread.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  timestamp={formatTimestamp(notif.createdAt)}
                  onMarkRead={() => markAsRead(notif.id)}
                />
              ))}
            </div>
          )}

          {/* All section */}
          <div className="flex flex-col gap-3">
            <h2 className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-neutral-800">
              All Notifications
            </h2>
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                timestamp={formatTimestamp(notif.createdAt)}
                onMarkRead={() => markAsRead(notif.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  timestamp,
  onMarkRead,
}: {
  notification: Notification;
  timestamp: string;
  onMarkRead: () => void;
}) {
  return (
    <button
      type="button"
      onClick={!notification.isRead ? onMarkRead : undefined}
      className="flex gap-3 items-start py-2 text-left w-full cursor-pointer"
    >
      {notification.isRead ? (
        <div className="w-2 shrink-0" />
      ) : (
        <Circle size={8} className="text-brand-600 fill-brand-600 mt-1.5 shrink-0" />
      )}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 leading-5">
          {notification.title}
        </p>
        <span className="font-[family-name:var(--font-work-sans)] text-[10px] text-neutral-500 leading-4">
          {timestamp}
        </span>
      </div>
    </button>
  );
}
