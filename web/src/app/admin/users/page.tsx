"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  nim: string;
  yearOfEntry: number;
  phone: string;
  role: "admin" | "user";
  emailVerified: boolean;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (yearFilter) params.set("yearOfEntry", yearFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      setUsers(json.data);
      setTotal(json.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, yearFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.id) setCurrentUserId(json.data.id);
      })
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);

  async function toggleRole(user: User) {
    const newRole = user.role === "admin" ? "user" : "admin";
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      fetchUsers();
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteTarget(null);
      fetchUsers();
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">
          Users ({total})
        </h1>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <input
          type="text"
          placeholder="Search name, email, or NIM..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded border border-neutral-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded border border-neutral-300 px-2 py-1 text-sm"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <input
          type="text"
          placeholder="Year"
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setPage(1);
          }}
          className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm"
        />
      </form>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-neutral-500">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full table-auto text-sm">
            <thead className="bg-neutral-100 text-left text-xs text-neutral-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">NIM</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="px-3 py-2">{user.name}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">{user.nim}</td>
                  <td className="px-3 py-2">{user.yearOfEntry}</td>
                  <td className="px-3 py-2">{user.phone}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        user.role === "admin"
                          ? "bg-brand-100 text-brand-800"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {user.id !== currentUserId && (
                        <>
                          <button
                            onClick={() => toggleRole(user)}
                            className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700 hover:bg-brand-100"
                          >
                            {user.role === "admin"
                              ? "Demote"
                              : "Promote"}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-neutral-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-sm font-semibold text-neutral-900">
              Confirm Delete
            </h2>
            <p className="mb-4 text-sm text-neutral-600">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget.name}</span> (
              {deleteTarget.email})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
