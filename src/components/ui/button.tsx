import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "disabled";
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = variant === "disabled" || disabled;

  const base = "w-full text-center rounded-lg text-sm font-medium transition-colors cursor-pointer";

  const variants: Record<string, string> = {
    primary:
      "bg-brand-600 text-brand-50 py-3 font-[family-name:var(--font-work-sans)]",
    secondary:
      "bg-transparent border border-neutral-800 text-neutral-800 py-3 font-[family-name:var(--font-inter)]",
    tertiary:
      "bg-transparent text-brand-600 font-[family-name:var(--font-work-sans)]",
    disabled:
      "bg-neutral-400 text-neutral-500 py-3 font-[family-name:var(--font-work-sans)] cursor-not-allowed",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    </button>
  );
}
