"use client";

import { Button } from "@/components/ui/button";

export interface Career {
  id: string;
  position: string;
  company: string;
  startYear: number;
  endYear: number | null;
  isCurrent: boolean;
}

interface CareerItemProps {
  career: Career;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CareerItem({ career, onEdit, onDelete }: CareerItemProps) {
  const endDisplay =
    career.isCurrent || career.endYear == null
      ? "Recent"
      : career.endYear;

  return (
    <div className="flex flex-col gap-2 pb-4">
      <h4 className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-neutral-900">
        {career.position}
      </h4>
      <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
        {career.company}
      </p>
      <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
        {career.startYear} - {endDisplay}
      </p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => onDelete(career.id)}
          className="flex-1 !border-red-500 !text-red-500 !py-2 !text-xs"
        >
          Delete
        </Button>
        <Button
          variant="secondary"
          onClick={() => onEdit(career.id)}
          className="flex-1 !py-2 !text-xs"
        >
          Edit
        </Button>
      </div>
    </div>
  );
}
