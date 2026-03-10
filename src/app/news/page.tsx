"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NewsHeader } from "@/components/news/news-header";
import { FeaturedCarousel } from "@/components/news/featured-carousel";
import { ArticleCard } from "@/components/news/article-card";
import { CategoryChips } from "@/components/news/category-chips";
import { SortSheet } from "@/components/news/sort-sheet";
import { SideDrawer } from "@/components/news/side-drawer";
import { LogoutModal } from "@/components/news/logout-modal";
import type { Article } from "@/components/news/featured-carousel";

const CATEGORIES = ["All News", "Announcement", "Agenda"];

const FEATURED_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Hasil Rapat Tahunan Ikatan Alumni 2025",
    summary:
      "Rangkuman keputusan strategis mengenai beasiswa baru, restrukturisasi organisasi, dan rangkaian agenda kegiatan ikatan alumni",
    timestamp: "20 January 2025 - 09:00",
    category: "Announcement",
    imageUrl: "/images/news-placeholder-1.jpg",
  },
  {
    id: "2",
    title: "Webinar dan Sharing Alumni–Mahasiswa Oseanografi ITB",
    summary:
      "Pengumuman kegiatan kolaboratif antara alumni dan mahasiswa Oseanografi ITB dalam bentuk webinar dan sesi berbagi pengalaman di dunia riset dan industri kelautan.",
    timestamp: "20 January 2025 - 09:00",
    category: "Agenda",
    imageUrl: "/images/news-placeholder-2.jpg",
  },
  {
    id: "3",
    title: "Kuliah Tamu, Praktikum Lapangan, dan Forum Diskusi",
    summary:
      "Rangkaian agenda mahasiswa Oseanografi ITB yang mencakup kegiatan akademik, organisasi kemahasiswaan, praktikum lapangan, serta aktivitas pengembangan diri.",
    timestamp: "20 January 2025 - 09:00",
    category: "Agenda",
    imageUrl: "/images/news-placeholder-3.jpg",
  },
  {
    id: "4",
    title: "Reuni Akbar Semua Angkatan Alumni Oseanografi ITB",
    summary:
      "Agenda pertemuan alumni Oseanografi ITB yang dikemas dalam kegiatan silaturahmi, refleksi perjalanan institusi, serta kontribusi alumni bagi mahasiswa.",
    timestamp: "20 January 2025 - 09:00",
    category: "Announcement",
    imageUrl: "/images/news-placeholder-4.jpg",
  },
];

const LIST_ARTICLES: Article[] = [
  {
    id: "5",
    title: "Seminar Oseanografi: Tantangan Iklim Global",
    summary:
      "Mengundang alumni sebagai narasumber tamu untuk berbagi…",
    timestamp: "20 January 2025 - 09:00",
    category: "Agenda",
    imageUrl: "/images/news-placeholder-5.jpg",
  },
  {
    id: "6",
    title: "Rapat Koordinasi Alumni Oseanografi ITB",
    summary:
      "Agenda rapat alumni yang membahas program kerja, penguatan jaringan alumni, serta rencana kegiatan kolaboratif ke depan.",
    timestamp: "20 January 2025 - 09:00",
    category: "Announcement",
    imageUrl: "/images/news-placeholder-6.jpg",
  },
  {
    id: "7",
    title: "Temu Alumni Oseanografi ITB",
    summary:
      "Kegiatan silaturahmi alumni lintas angkatan untuk mempererat hubungan dan membuka ruang kolaborasi dengan civitas akademika.",
    timestamp: "20 January 2025 - 09:00",
    category: "Announcement",
    imageUrl: "/images/news-placeholder-7.jpg",
  },
  {
    id: "8",
    title: "Diskusi Ilmiah Oseanografi ITB",
    summary:
      "Kegiatan diskusi ilmiah yang membahas topik khusus oseanografi, metodologi penelitian, dan isu strategis kelautan.",
    timestamp: "20 January 2025 - 09:00",
    category: "Agenda",
    imageUrl: "/images/news-placeholder-8.jpg",
  },
];

export default function NewsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All News");
  const [sortOpen, setSortOpen] = useState(false);
  const [activeSort, setActiveSort] = useState<"date-ascending" | "date-descending" | "a-z" | "importance-high">("date-descending");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const filteredArticles =
    activeCategory === "All News"
      ? LIST_ARTICLES
      : LIST_ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative overflow-hidden">
      {/* Gradient blob */}
      <div
        className="absolute -top-[142px] left-1/2 -translate-x-1/2 w-[493px] h-[474px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(101,119,159,0.4) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="relative z-10">
        <NewsHeader
          onMenuOpen={() => setDrawerOpen(true)}
          onSearchOpen={() => router.push("/news/search")}
          onNotificationsOpen={() => router.push("/news/notifications")}
          hasUnread
        />

        <div className="flex flex-col gap-6 pt-2 pb-8">
          <FeaturedCarousel
            articles={FEATURED_ARTICLES}
            onReadMore={(id) => router.push(`/news/${id}`)}
          />

          <CategoryChips
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onSortOpen={() => setSortOpen(true)}
          />

          <div className="flex flex-col gap-3 px-4">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={(id) => router.push(`/news/${id}`)}
              />
            ))}
          </div>
        </div>
      </div>

      <SortSheet
        isOpen={sortOpen}
        onClose={() => setSortOpen(false)}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="news"
        onNavigate={(item) => {
          setDrawerOpen(false);
          if (item !== "news") router.push(`/${item}`);
        }}
        onLogout={() => {
          setDrawerOpen(false);
          setLogoutOpen(true);
        }}
      />

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          router.push("/login");
        }}
      />
    </div>
  );
}
