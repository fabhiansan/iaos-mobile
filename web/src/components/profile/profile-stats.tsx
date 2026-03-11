interface ProfileStatsProps {
  yearOfEntry: number;
  jobPosted: number;
  totalDonated: string;
}

export function ProfileStats({ yearOfEntry, jobPosted, totalDonated }: ProfileStatsProps) {
  return (
    <div className="flex items-center bg-white rounded-xl shadow-sm border border-neutral-100 mx-4">
      <div className="flex-1 flex flex-col items-center py-4">
        <span className="font-[family-name:var(--font-work-sans)] text-lg font-semibold text-neutral-900">
          {yearOfEntry}
        </span>
        <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
          Year of Entry
        </span>
      </div>
      <div className="w-px h-10 bg-neutral-100" />
      <div className="flex-1 flex flex-col items-center py-4">
        <span className="font-[family-name:var(--font-work-sans)] text-lg font-semibold text-neutral-900">
          {jobPosted}
        </span>
        <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
          Job Posted
        </span>
      </div>
      <div className="w-px h-10 bg-neutral-100" />
      <div className="flex-1 flex flex-col items-center py-4">
        <span className="font-[family-name:var(--font-work-sans)] text-lg font-semibold text-neutral-900">
          {totalDonated}
        </span>
        <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
          Total Donated
        </span>
      </div>
    </div>
  );
}
