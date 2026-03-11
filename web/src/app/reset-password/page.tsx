"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { TextInput } from "@/components/ui/input";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const requirements = useMemo(() => {
    const hasUpperAndLower =
      /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasMinLength = newPassword.length >= 8;
    return { hasUpperAndLower, hasNumbers, hasMinLength };
  }, [newPassword]);

  const allRequirementsMet =
    requirements.hasUpperAndLower &&
    requirements.hasNumbers &&
    requirements.hasMinLength;

  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const isValid = allRequirementsMet && passwordsMatch;

  return (
    <div className="auth-gradient flex min-h-screen flex-col items-center bg-white">
      <div className="relative z-10 flex w-full max-w-[390px] flex-col px-6">
        {/* Header */}
        <div className="relative flex items-center justify-center py-4 mt-4">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="absolute left-0 flex items-center justify-center"
          >
            <ChevronLeft size={24} className="text-neutral-900" />
          </button>
          <h1 className="font-[family-name:var(--font-work-sans)] text-[20px] font-semibold text-neutral-900">
            Reset Password
          </h1>
        </div>

        {/* Description */}
        <p className="mt-6 font-[family-name:var(--font-work-sans)] text-[14px] leading-relaxed text-neutral-600">
          Create a new password for your account.
        </p>

        {/* Form */}
        <form
          className="mt-8 flex flex-col gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            setError("");

            if (!token) {
              setError("Invalid reset link");
              setIsLoading(false);
              return;
            }

            if (newPassword !== confirmPassword) {
              setError("Passwords do not match");
              setIsLoading(false);
              return;
            }

            try {
              const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: newPassword }),
              });

              const data = await res.json();

              if (res.ok) {
                router.push("/login");
              } else {
                setError(data.error || "Something went wrong");
              }
            } catch {
              setError("Something went wrong");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <TextInput
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <TextInput
            label="Confirm Password"
            type="password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {/* Password Requirements */}
          <div className="flex flex-col gap-2 rounded-lg border border-brand-200 bg-neutral-50 px-3 py-3">
            <div className="flex items-start gap-2">
              <Info
                size={14}
                className="mt-0.5 flex-shrink-0 text-brand-600"
              />
              <p className="font-[family-name:var(--font-work-sans)] text-[12px] leading-snug text-brand-600">
                Password <span className="font-bold">must</span> include{" "}
                <span className="font-bold">
                  uppercase and lowercase letters.
                </span>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Info
                size={14}
                className="mt-0.5 flex-shrink-0 text-brand-600"
              />
              <p className="font-[family-name:var(--font-work-sans)] text-[12px] leading-snug text-brand-600">
                Password <span className="font-bold">must</span> include{" "}
                <span className="font-bold">numbers.</span>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Info
                size={14}
                className="mt-0.5 flex-shrink-0 text-brand-600"
              />
              <p className="font-[family-name:var(--font-work-sans)] text-[12px] leading-snug text-brand-600">
                Password <span className="font-bold">must</span> be at{" "}
                <span className="font-bold">least 8 characters</span> long.
              </p>
            </div>
          </div>

          {!token && (
            <p className="text-sm text-red-500">
              Invalid reset link. Please request a new one.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={!isValid || isLoading || !token}
            className={`w-full rounded-lg py-3 font-[family-name:var(--font-work-sans)] text-[14px] font-medium transition-colors ${
              isValid && !isLoading && token
                ? "bg-brand-600 text-white"
                : "bg-neutral-400 text-neutral-500"
            }`}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
