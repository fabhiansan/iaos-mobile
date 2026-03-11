"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Newspaper,
  Briefcase,
  Heart,
  Clock,
  DollarSign,
} from "lucide-react";

interface Stats {
  users: number;
  articles: number;
  jobs: number;
  campaigns: number;
  pendingTransactions: number;
  totalDonated: number;
}

const statCards = [
  { key: "users" as const, label: "Users", icon: Users },
  { key: "articles" as const, label: "Articles", icon: Newspaper },
  { key: "jobs" as const, label: "Published Jobs", icon: Briefcase },
  { key: "campaigns" as const, label: "Campaigns", icon: Heart },
  { key: "pendingTransactions" as const, label: "Pending Verifications", icon: Clock },
  { key: "totalDonated" as const, label: "Total Donated", icon: DollarSign, isCurrency: true },
];

function formatNumber(value: number, isCurrency?: boolean) {
  if (isCurrency) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  }
  return value.toLocaleString("id-ID");
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setStats(json.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-white shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-sm text-neutral-500">Failed to load dashboard stats.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {statCards.map(({ key, label, icon: Icon, isCurrency }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10">
            <Icon size={20} className="text-brand-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">
              {formatNumber(stats[key], isCurrency)}
            </p>
            <p className="text-sm text-neutral-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
