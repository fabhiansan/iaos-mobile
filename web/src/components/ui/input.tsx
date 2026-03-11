"use client";

import { useState } from "react";
import { Eye, EyeOff, ChevronDown, Check } from "lucide-react";

interface TextInputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "select";
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  error?: string;
  success?: string;
  name?: string;
  children?: React.ReactNode;
}

export function TextInput({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  icon,
  error,
  success,
  name,
  children,
}: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type === "select" ? "text" : type;

  const borderColor = error
    ? "border-red-500"
    : success
      ? "border-green-500"
      : "border-brand-200";

  return (
    <div className="w-full">
      <div
        className={`relative flex items-center h-[56px] bg-neutral-50 border ${borderColor} rounded-lg px-3 py-2`}
      >
        {icon && <span className="mr-2 flex-shrink-0 text-neutral-500">{icon}</span>}

        <div className="flex flex-col justify-center flex-1 min-w-0">
          {label && (
            <label
              className="font-[family-name:var(--font-work-sans)] text-[10px] leading-tight text-neutral-500"
            >
              {label}
            </label>
          )}
          {type === "select" ? (
            <div className="relative">
              <select
                name={name}
                value={value}
                onChange={onChange as unknown as React.ChangeEventHandler<HTMLSelectElement>}
                className="w-full bg-transparent font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 outline-none appearance-none cursor-pointer"
              >
                {children}
              </select>
            </div>
          ) : (
            <input
              type={inputType}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className="w-full bg-transparent font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 outline-none placeholder:text-neutral-500"
            />
          )}
        </div>

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-2 flex-shrink-0 text-neutral-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}

        {type === "select" && (
          <span className="ml-2 flex-shrink-0 text-neutral-500 pointer-events-none">
            <ChevronDown size={20} />
          </span>
        )}
      </div>

      {error && (
        <p className="mt-1 font-[family-name:var(--font-work-sans)] text-xs text-red-500">
          {error}
        </p>
      )}

      {success && !error && (
        <div className="mt-1 flex items-center gap-1">
          <Check size={14} className="text-green-500" />
          <p className="font-[family-name:var(--font-work-sans)] text-xs text-green-500">
            {success}
          </p>
        </div>
      )}
    </div>
  );
}
