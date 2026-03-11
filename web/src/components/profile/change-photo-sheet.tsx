"use client";

import { useRef, useState } from "react";
import { X, Camera, Image } from "lucide-react";

interface ChangePhotoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoUploaded: () => void;
}

export function ChangePhotoSheet({
  isOpen,
  onClose,
  onPhotoUploaded,
}: ChangePhotoSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileSelected = async (file: File) => {
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const { error: errMsg } = await res.json();
        setError(errMsg || "Failed to upload photo");
        return;
      }

      onPhotoUploaded();
    } catch {
      setError("Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

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

        {error && (
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-red-500 mb-4">
            {error}
          </p>
        )}

        {uploading ? (
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500 text-center py-4">
            Uploading...
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Camera size={24} className="text-neutral-800" />
              <span className="font-[family-name:var(--font-work-sans)] text-base text-neutral-800">
                Take Photo
              </span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Image size={24} className="text-neutral-800" />
              <span className="font-[family-name:var(--font-work-sans)] text-base text-neutral-800">
                Choose from Library
              </span>
            </button>
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleInputChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
