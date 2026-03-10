"use client";

import { useRouter, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/news/badge";
import { Calendar } from "lucide-react";

const ARTICLE_DETAIL = {
  id: "1",
  title: "Rapat Koordinasi Alumni Oseanografi ITB",
  category: "Announcement" as const,
  timestamp: "20 January 2025 - 09:00",
  imageUrl: "/images/news-placeholder-1.jpg",
  content: `Rapat Koordinasi Alumni Oseanografi ITB merupakan pertemuan rutin yang bertujuan untuk memperkuat kelembagaan, mengevaluasi program yang telah dijalankan, serta merumuskan langkah-langkah strategis ke depan. Kegiatan ini mengumpulkan perwakilan dari berbagai angkatan sebagai bentuk partisipasi aktif dalam mendukung kemajuan organisasi alumni.

Dalam rapat ini, berbagai topik penting dibahas, termasuk update keanggotaan, evaluasi kegiatan sebelumnya, dan rencana program mendatang. Kegiatan ini juga menjadi wadah bagi alumni untuk menyampaikan ide, masukan, serta kontribusi langsung bagi pengembangan organisasi dan komunitas.

Agenda utama mencakup pembahasan kegiatan akademik, sosialisasi program kerja, dan diskusi tentang kolaborasi lintas angkatan untuk memperkuat jaringan alumni serta kontribusi bagi civitas akademika Oseanografi ITB.`,
};

export default function NewsDetailPage() {
  const router = useRouter();
  const params = useParams();

  // In a real app, fetch article by params.id
  const article = ARTICLE_DETAIL;

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 h-11">
        <button type="button" onClick={() => router.back()} className="shrink-0 cursor-pointer">
          <ChevronLeft size={16} className="text-neutral-900" />
        </button>
        <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
          Tidal News
        </h1>
      </div>

      {/* Featured Image */}
      <div className="relative w-full h-[240px] bg-neutral-100 overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-4">
          <Badge
            label={article.category}
            variant={article.category === "Announcement" ? "primary" : "secondary"}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-800 leading-7">
            {article.title}
          </h2>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-neutral-600" />
            <span className="font-[family-name:var(--font-work-sans)] text-[10px] text-neutral-600 leading-4">
              {article.timestamp}
            </span>
          </div>
        </div>

        <div className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-600 leading-6 whitespace-pre-line">
          {article.content}
        </div>
      </div>
    </div>
  );
}
