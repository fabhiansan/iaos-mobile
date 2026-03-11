"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between py-3 cursor-pointer"
      >
        <h3 className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800">
          {title}
        </h3>
        {isOpen ? (
          <ChevronUp size={16} className="text-neutral-600" />
        ) : (
          <ChevronDown size={16} className="text-neutral-600" />
        )}
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  );
}
