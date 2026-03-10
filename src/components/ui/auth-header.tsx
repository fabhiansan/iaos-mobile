"use client";

import { ChevronLeft } from "lucide-react";

interface AuthHeaderProps {
  title: string;
  onBack?: () => void;
}

export function AuthHeader({ title, onBack }: AuthHeaderProps) {
  return (
    <div className="relative flex items-center justify-center py-4 px-4">
      <button
        type="button"
        onClick={onBack}
        className="absolute left-4 flex items-center justify-center w-10 h-10 cursor-pointer"
      >
        <ChevronLeft size={24} className="text-neutral-900" />
      </button>
      <h1 className="font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
        {title}
      </h1>
    </div>
  );
}
