interface BadgeProps {
  label: string;
  variant?: "primary" | "secondary";
}

export function Badge({ label, variant = "primary" }: BadgeProps) {
  const styles =
    variant === "primary"
      ? "bg-brand-800 border-brand-600 text-white"
      : "bg-brand-100 border-brand-50 text-brand-700";

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-medium font-[family-name:var(--font-work-sans)] border ${styles}`}
    >
      {label}
    </span>
  );
}
