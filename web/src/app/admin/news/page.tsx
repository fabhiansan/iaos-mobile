"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminSearchInput,
  AdminFilterChips,
  AdminTable,
  AdminPagination,
  AdminDeleteModal,
  AdminActionButton,
  useDebounce,
} from "@/components/admin/admin-table";

interface Article {
  id: string;
  title: string;
  category: string;
  isFeatured: boolean;
  authorName: string | null;
  publishedAt: string | null;
}

const CATEGORIES = ["All", "Announcement", "Agenda", "News"] as const;

const COLUMNS = [
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "featured", label: "Featured" },
  { key: "author", label: "Author" },
  { key: "published", label: "Published" },
  { key: "actions", label: "Actions", align: "right" as const },
];

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [category, setCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

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
    <div>
      <AdminPageHeader action={{ label: "Create Article", href: "/admin/news/create" }} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search articles..."
        />
        <AdminFilterChips
          options={CATEGORIES}
          value={category}
          onChange={(c) => { setCategory(c); setPage(1); }}
        />
      </div>

      {/* Table */}
      <AdminTable
        columns={COLUMNS}
        loading={loading}
        empty={articles.length === 0}
        emptyMessage="No articles found."
      >
        {articles.map((a) => (
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
                <AdminActionButton
                  variant="edit"
                  href={`/admin/news/${a.id}/edit`}
                />
                <AdminActionButton
                  variant="delete"
                  onClick={() => setDeleteId(a.id)}
                />
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* Delete Confirm Modal */}
      <AdminDeleteModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}
