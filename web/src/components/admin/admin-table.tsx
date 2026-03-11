"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  AdminPageHeader                                                    */
/* ------------------------------------------------------------------ */

interface AdminPageHeaderProps {
  action?: { label: string; href: string; icon?: LucideIcon };
}

export function AdminPageHeader({ action }: AdminPageHeaderProps) {
  if (!action) return null;
  const Icon = action.icon ?? Plus;
  return (
    <div className="flex justify-end mb-4">
      <Link
        href={action.href}
        className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-brand-700 transition-colors"
      >
        <Icon size={16} />
        {action.label}
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminSearchInput                                                   */
/* ------------------------------------------------------------------ */

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: AdminSearchInputProps) {
  return (
    <div className="relative flex-1 max-w-xs">
      <Search
        size={16}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-neutral-200 rounded-md pl-8 pr-3 py-2 text-sm outline-none focus:border-brand-600"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminFilterChips                                                   */
/* ------------------------------------------------------------------ */

interface AdminFilterChipsProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

export function AdminFilterChips({ options, value, onChange }: AdminFilterChipsProps) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === opt
              ? "bg-brand-600 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminFilterSelect                                                  */
/* ------------------------------------------------------------------ */

interface AdminFilterSelectProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function AdminFilterSelect({ options, value, onChange }: AdminFilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-neutral-200 rounded-md px-3 py-2 text-sm outline-none focus:border-brand-600"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminTable                                                         */
/* ------------------------------------------------------------------ */

interface AdminTableColumn {
  key: string;
  label: string;
  align?: "left" | "right";
}

interface AdminTableProps {
  columns: AdminTableColumn[];
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
}

export function AdminTable({
  columns,
  children,
  loading,
  empty,
  emptyMessage = "No data found.",
}: AdminTableProps) {
  const colSpan = columns.length;
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="table-auto w-full">
        <thead>
          <tr className="bg-neutral-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${
                  col.align === "right" ? "text-right" : "text-left"
                } text-neutral-600 text-xs uppercase tracking-wider px-3 py-2 font-medium`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="text-center text-sm text-neutral-500 px-3 py-8">
                Loading...
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={colSpan} className="text-center text-sm text-neutral-500 px-3 py-8">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminPagination                                                    */
/* ------------------------------------------------------------------ */

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({ page, totalPages, total, onPageChange }: AdminPaginationProps) {
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-neutral-600">
      <span>
        Page {page} of {totalPages} ({total} total)
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminDeleteModal                                                   */
/* ------------------------------------------------------------------ */

interface AdminDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  loading?: boolean;
}

export function AdminDeleteModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}: AdminDeleteModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-sm font-semibold text-neutral-800 mb-2">{title}</h2>
        <div className="text-sm text-neutral-600 mb-4">{message}</div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-sm border border-neutral-200 rounded-md hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminActionButton                                                  */
/* ------------------------------------------------------------------ */

const ACTION_VARIANTS = {
  edit: { icon: Pencil, hoverColor: "hover:text-brand-600" },
  delete: { icon: Trash2, hoverColor: "hover:text-red-600" },
  view: { icon: Eye, hoverColor: "hover:text-brand-600" },
} as const;

interface AdminActionButtonProps {
  variant: keyof typeof ACTION_VARIANTS;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
}

export function AdminActionButton({ variant, onClick, href, icon }: AdminActionButtonProps) {
  const config = ACTION_VARIANTS[variant];
  const Icon = icon ?? config.icon;
  const className = `p-1.5 text-neutral-500 ${config.hoverColor} rounded hover:bg-neutral-100`;

  if (href) {
    return (
      <Link href={href} className={className}>
        <Icon size={14} />
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      <Icon size={14} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  useDebounce hook (used by pages for search)                        */
/* ------------------------------------------------------------------ */

export function useDebounce(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
