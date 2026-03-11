"use client";

import { X, Camera, Image } from "lucide-react";

interface ChangePhotoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
}

export function ChangePhotoSheet({
  isOpen,
  onClose,
  onTakePhoto,
  onChooseLibrary,
}: ChangePhotoSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[390px] bg-white rounded-t-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-[family-name:var(--font-work-sans)] text-lg font-semibold text-neutral-900">
            Change Profile Picture
          </h3>
          <button type="button" onClick={onClose} className="cursor-pointer">
            <X size={20} className="text-neutral-600" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={onTakePhoto}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Camera size={24} className="text-neutral-800" />
            <span className="font-[family-name:var(--font-work-sans)] text-base text-neutral-800">
              Take Photo
            </span>
          </button>
          <button
            type="button"
            onClick={onChooseLibrary}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Image size={24} className="text-neutral-800" />
            <span className="font-[family-name:var(--font-work-sans)] text-base text-neutral-800">
              Choose from Library
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
