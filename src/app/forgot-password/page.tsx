"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TextInput } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const isValid = email.trim().length > 0;

  return (
    <div className="auth-gradient flex min-h-screen flex-col items-center bg-white">
      <div className="relative z-10 flex w-full max-w-[390px] flex-col px-6">
        {/* Header */}
        <div className="relative flex items-center justify-center py-4 mt-4">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="absolute left-0 flex items-center justify-center"
          >
            <ChevronLeft size={24} className="text-neutral-900" />
          </button>
          <h1 className="font-[family-name:var(--font-work-sans)] text-[20px] font-semibold text-neutral-900">
            Forget Password
          </h1>
        </div>

        {/* Description */}
        <p className="mt-6 font-[family-name:var(--font-work-sans)] text-[14px] leading-relaxed text-neutral-600">
          Please enter your registered email address to receive a link to reset
          your password.
        </p>

        {/* Form */}
        <form
          className="mt-8 flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid) {
              // Handle send email
            }
          }}
        >
          <TextInput
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={!isValid}
            className={`w-full rounded-lg py-3 font-[family-name:var(--font-work-sans)] text-[14px] font-medium transition-colors ${
              isValid
                ? "bg-brand-600 text-white"
                : "bg-neutral-400 text-neutral-500"
            }`}
          >
            Send Email
          </button>
        </form>
      </div>
    </div>
  );
}
