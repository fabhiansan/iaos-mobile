"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hasUpperAndLower = /(?=.*[a-z])(?=.*[A-Z])/.test(newPassword);
  const hasNumbers = /\d/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";
  const isValid = hasUpperAndLower && hasNumbers && hasMinLength && passwordsMatch && currentPassword !== "";

  const handleChangePassword = async () => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative overflow-hidden">
      {/* Gradient blob */}
      <div
        className="absolute -top-[142px] left-1/2 -translate-x-1/2 w-[493px] h-[474px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(101,119,159,0.4) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <AuthHeader title="Change Password" onBack={() => router.back()} />

        <div className="px-4 pt-2 pb-4">
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500 leading-5">
            Update your password for your IAOS Connect account.
          </p>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-4">
          <TextInput
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextInput
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextInput
            label="Password Confirmation"
            type="password"
            placeholder="Enter your password confirmation"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {/* Password Requirements */}
          <div className="bg-neutral-50 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-neutral-500 mt-0.5 flex-shrink-0" />
              <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-600 leading-4">
                Password <span className="font-semibold">must</span> include{" "}
                <span className="font-semibold">uppercase</span> and{" "}
                <span className="font-semibold">lowercase letters</span>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Info size={16} className="text-neutral-500 mt-0.5 flex-shrink-0" />
              <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-600 leading-4">
                Password <span className="font-semibold">must</span> include{" "}
                <span className="font-semibold">numbers</span>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Info size={16} className="text-neutral-500 mt-0.5 flex-shrink-0" />
              <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-600 leading-4">
                Password <span className="font-semibold">must</span> be at{" "}
                <span className="font-semibold">least 8 characters</span> long.
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 flex flex-col gap-3">
          {success && (
            <p className="text-sm text-green-600">Password changed successfully.</p>
          )}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button
            variant={isValid && !isLoading ? "primary" : "disabled"}
            disabled={!isValid || isLoading}
            onClick={handleChangePassword}
          >
            {isLoading ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
