"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  isFeatured: boolean;
  authorName: string | null;
  publishedAt: string | null;
}

const CATEGORIES = ["All", "Announcement", "Agenda", "News"] as const;

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category !== "All") params.set("category", category);

      const res = await fetch(`/api/news?${params}`);
      if (res.ok) {
        const json = await res.json();
        setArticles(json.data);
        setTotal(json.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/news/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchArticles();
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-neutral-800">Articles</h1>
        <Link
          href="/admin/news/create"
          className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Create Article
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-neutral-200 rounded-md pl-8 pr-3 py-2 text-sm outline-none focus:border-brand-600"
          />
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                category === c
                  ? "bg-brand-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="table-auto w-full">
          <thead>
            <tr className="bg-neutral-100">
              <th className="text-left text-neutral-600 text-xs uppercase tracking-wider px-3 py-2 font-medium">Title</th>
              <th className="text-left text-neutral-600 text-xs uppercase tracking-wider px-3 py-2 font-medium">Category</th>
              <th className="text-left text-neutral-600 text-xs uppercase tracking-wider px-3 py-2 font-medium">Featured</th>
              <th className="text-left text-neutral-600 text-xs uppercase tracking-wider px-3 py-2 font-medium">Author</th>
              <th className="text-left text-neutral-600 text-xs uppercase tracking-wider px-3 py-2 font-medium">Published</th>
              <th className="text-right text-neutral-600 text-xs uppercase tracking-wider px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-sm text-neutral-500 px-3 py-8">
                  Loading...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-sm text-neutral-500 px-3 py-8">
                  No articles found.
                </td>
              </tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="text-sm px-3 py-2 max-w-xs truncate">{a.title}</td>
                  <td className="text-sm px-3 py-2">{a.category}</td>
                  <td className="text-sm px-3 py-2">{a.isFeatured ? "Yes" : "No"}</td>
                  <td className="text-sm px-3 py-2">{a.authorName || "-"}</td>
                  <td className="text-sm px-3 py-2">
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="text-sm px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Link
                        href={`/admin/news/${a.id}/edit`}
                        className="p-1.5 text-neutral-500 hover:text-brand-600 rounded hover:bg-neutral-100"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => setDeleteId(a.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-600 rounded hover:bg-neutral-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-neutral-600">
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-sm font-semibold text-neutral-800 mb-2">Delete Article</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Are you sure you want to delete this article? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-3 py-1.5 text-sm border border-neutral-200 rounded-md hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
