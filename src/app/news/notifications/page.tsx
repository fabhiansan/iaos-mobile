"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Circle } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  timestamp: string;
  isUnread: boolean;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "New Announcement published!",
    timestamp: "20 January 2025 - 09:00",
    isUnread: true,
  },
  {
    id: "2",
    title: 'Announcement: Rapat Koordinasi Alumni ITB telah diperbarui. Perbaikan informasi waktu dan lokasi. Silakan cek kembali untuk detail terbaru.',
    timestamp: "19 January 2025 - 17:00",
    isUnread: true,
  },
  {
    id: "3",
    title: "New reports published!",
    timestamp: "18 January 2025 - 10:00",
    isUnread: true,
  },
  {
    id: "4",
    title: "New Announcement published!",
    timestamp: "17 January 2025 - 09:00",
    isUnread: false,
  },
  {
    id: "5",
    title: "New Agenda published!",
    timestamp: "16 January 2025 - 14:00",
    isUnread: false,
  },
  {
    id: "6",
    title: "New Announcement published!",
    timestamp: "15 January 2025 - 09:00",
    isUnread: false,
  },
  {
    id: "7",
    title: "New Announcement published!",
    timestamp: "14 January 2025 - 09:00",
    isUnread: false,
  },
];

export default function NotificationsPage() {
  const router = useRouter();

  const unread = NOTIFICATIONS.filter((n) => n.isUnread);
  const all = NOTIFICATIONS;

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
      </div>

      <div className="flex flex-col px-4 pt-4 gap-6">
        {/* Unread section */}
        {unread.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-neutral-800">
              {unread.length} Unread Notification
            </h2>
            {unread.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} />
            ))}
          </div>
        )}

        {/* All section */}
        <div className="flex flex-col gap-3">
          <h2 className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-neutral-800">
            All Notifications
          </h2>
          {all.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div className="flex gap-3 items-start py-2">
      {notification.isUnread && (
        <Circle size={8} className="text-brand-600 fill-brand-600 mt-1.5 shrink-0" />
      )}
      {!notification.isUnread && <div className="w-2 shrink-0" />}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 leading-5">
          {notification.title}
        </p>
        <span className="font-[family-name:var(--font-work-sans)] text-[10px] text-neutral-500 leading-4">
          {notification.timestamp}
        </span>
      </div>
    </div>
  );
}
