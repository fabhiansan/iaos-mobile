"use client";

import { useRef, useEffect } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useEscapeKey } from "@/hooks/use-escape-key";

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);
}

export function DialogOverlay({ isOpen, onClose, title, children }: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, isOpen);
  useEscapeKey(onClose, isOpen);
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
}

export function SheetOverlay({ isOpen, onClose, title, children }: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, isOpen);
  useEscapeKey(onClose, isOpen);
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[390px]"
      >
        {children}
      </div>
    </div>
  );
}
