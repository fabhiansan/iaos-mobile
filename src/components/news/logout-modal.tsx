"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[340px] bg-white rounded-2xl p-3">
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-600 cursor-pointer text-lg leading-none"
          >
            &times;
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 mb-4 px-3">
          <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-800 text-center">
            Are you sure to log out?
          </h3>
          <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500 text-center leading-4">
            Logging out will clear all session data and history for your account.
          </p>
        </div>
        <div className="flex gap-2 px-3 pb-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="flex-1 !bg-red-500"
            icon={<LogOut size={16} />}
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
