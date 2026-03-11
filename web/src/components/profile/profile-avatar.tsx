"use client";

import { Pencil } from "lucide-react";

interface ProfileAvatarProps {
  name: string;
  imageUrl?: string | null;
  onEditPhoto?: () => void;
}

export function ProfileAvatar({ name, imageUrl, onEditPhoto }: ProfileAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative inline-block">
      <div className="w-[120px] h-[120px] rounded-full bg-brand-800 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-[family-name:var(--font-work-sans)] text-4xl font-bold text-white">
            {initials}
          </span>
        )}
      </div>
      {onEditPhoto && (
        <button
          type="button"
          onClick={onEditPhoto}
          className="absolute bottom-1 right-1 w-8 h-8 bg-brand-800 rounded-full flex items-center justify-center border-2 border-white cursor-pointer"
        >
          <Pencil size={14} className="text-white" />
        </button>
      )}
    </div>
  );
}
