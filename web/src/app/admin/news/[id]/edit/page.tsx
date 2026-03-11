"use client";

import { FormEvent, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const CATEGORIES = ["Announcement", "Agenda", "News"] as const;

export default function AdminNewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("Announcement");
  const [isFeatured, setIsFeatured] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/news/${id}`);
        if (!res.ok) throw new Error("Failed to load article");
        const json = await res.json();
        const a = json.data;
        setTitle(a.title);
        setSummary(a.summary);
        setContent(a.content);
        setCategory(a.category);
        setIsFeatured(a.isFeatured);
        setExistingImageUrl(a.imageUrl);
      } catch {
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      let imageUrl: string | null | undefined = undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("folder", "articles");
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Image upload failed");
        }
        const uploadJson = await uploadRes.json();
        imageUrl = uploadJson.data.key;
      }

      const body: Record<string, unknown> = { title, summary, content, category, isFeatured };
      if (imageUrl !== undefined) {
        body.imageUrl = imageUrl;
      }

      const res = await fetch(`/api/news/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update article");
      }

      router.push("/admin/news");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6 text-center text-sm text-neutral-500">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-lg font-semibold text-neutral-800 mb-6">Edit Article</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Summary</label>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm outline-none focus:border-brand-600 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Content</label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm outline-none focus:border-brand-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Image</label>
            {existingImageUrl && !imageFile && (
              <img
                src={existingImageUrl}
                alt="Current thumbnail"
                className="w-32 h-20 object-cover rounded-md mb-2 border border-neutral-200"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-neutral-100 file:text-neutral-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-neutral-300"
            />
            <label htmlFor="featured" className="text-sm font-medium text-neutral-700">
              Featured article
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href="/admin/news"
              className="border border-neutral-200 text-neutral-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
