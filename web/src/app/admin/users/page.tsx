"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminSearchInput,
  AdminFilterSelect,
  AdminTable,
  AdminPagination,
  AdminDeleteModal,
  useDebounce,
} from "@/components/admin/admin-table";

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

const ROLE_OPTIONS = [
  { label: "All Roles", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "User", value: "user" },
];

const TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "nim", label: "NIM" },
  { key: "year", label: "Year" },
  { key: "phone", label: "Phone" },
  { key: "role", label: "Role" },
  { key: "joined", label: "Joined" },
  { key: "actions", label: "Actions" },
];

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

  const debouncedSearch = useDebounce(search);
  const totalPages = Math.ceil(total / limit);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
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
  }, [debouncedSearch, roleFilter, yearFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.id) setCurrentUserId(json.data.id);
      })
      .catch(() => {});
  }, []);

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <AdminSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
          }}
          placeholder="Search name, email, or NIM..."
        />
        <AdminFilterSelect
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
        />
        <input
          type="text"
          placeholder="Year"
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setPage(1);
          }}
          className="border border-neutral-200 rounded-md px-3 py-2 text-sm outline-none focus:border-brand-600 w-20"
        />
      </div>

      <AdminTable
        columns={TABLE_COLUMNS}
        loading={loading}
        empty={users.length === 0}
        emptyMessage="No users found."
      >
        {users.map((user) => (
          <tr
            key={user.id}
            className="border-b border-neutral-100 hover:bg-neutral-50"
          >
            <td className="text-sm px-3 py-2">{user.name}</td>
            <td className="text-sm px-3 py-2">{user.email}</td>
            <td className="text-sm px-3 py-2">{user.nim}</td>
            <td className="text-sm px-3 py-2">{user.yearOfEntry}</td>
            <td className="text-sm px-3 py-2">{user.phone}</td>
            <td className="text-sm px-3 py-2">
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
            <td className="text-sm px-3 py-2">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td className="text-sm px-3 py-2">
              <div className="flex gap-1">
                {user.id !== currentUserId && (
                  <>
                    <button
                      onClick={() => toggleRole(user)}
                      className="rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-700 hover:bg-brand-100"
                    >
                      {user.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        page={page}
        totalPages={Math.max(1, totalPages)}
        total={total}
        onPageChange={setPage}
      />

      <AdminDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message={
          deleteTarget ? (
            <>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget.name}</span> (
              {deleteTarget.email})? This action cannot be undone.
            </>
          ) : null
        }
      />
    </div>
  );
}
