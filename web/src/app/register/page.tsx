"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Info, Check } from "lucide-react";
import { AuthLayout } from "@/components/ui/auth-layout";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return year.toString();
});

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [yearOfEntry, setYearOfEntry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      hasUpperAndLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasMinLength: password.length >= 8,
    }),
    [password]
  );

  const isPasswordValid =
    passwordChecks.hasUpperAndLower &&
    passwordChecks.hasNumbers &&
    passwordChecks.hasMinLength;

  const passwordsMatch =
    password.length > 0 &&
    passwordConfirmation.length > 0 &&
    password === passwordConfirmation;

  const isFormValid =
    fullName.trim() !== "" &&
    studentId.trim() !== "" &&
    yearOfEntry !== "" &&
    phoneNumber.trim() !== "" &&
    email.trim() !== "" &&
    isPasswordValid &&
    passwordsMatch &&
    termsAccepted;

  const handleRegister = async () => {
    setIsLoading(true);
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          nim: studentId,
          yearOfEntry: parseInt(yearOfEntry),
          phone: phoneNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Auto-login after successful registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
      } else {
        router.push("/news");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Header */}
      <AuthHeader title="Create Account" onBack={() => router.push("/login")} />

      {/* Subtitle */}
      <div className="px-4">
        <p className="font-[family-name:var(--font-work-sans)] text-[14px] leading-[20px] text-neutral-600">
          Let&apos;s get started by filling out the form below
        </p>
      </div>

      {/* Form */}
      <div className="px-4 pt-4 pb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-4 overflow-y-auto">
          <TextInput
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <TextInput
            label="Student ID (NIM)"
            placeholder="Enter your Student ID (NIM)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />

          <TextInput
            label="Year of Entry"
            type="select"
            value={yearOfEntry}
            onChange={
              ((e: React.ChangeEvent<HTMLSelectElement>) =>
                setYearOfEntry(e.target.value)) as unknown as React.ChangeEventHandler<HTMLInputElement>
            }
          >
            <option value="" disabled>
              Select your year of entry
            </option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </TextInput>

          <TextInput
            label="Phone Number"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <TextInput
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <TextInput
            label="Password Confirmation"
            type="password"
            placeholder="Enter your password confirmation"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            success={
              passwordsMatch && isPasswordValid
                ? "Password Confirmed"
                : undefined
            }
          />

          {/* Password Requirements */}
          <div className="border border-brand-200 bg-neutral-50 rounded-lg p-2 flex flex-col gap-1">
            <PasswordRule>
              Password <strong>must</strong> include{" "}
              <strong>uppercase</strong> and{" "}
              <strong>lowercase letters.</strong>
            </PasswordRule>
            <PasswordRule>
              Password <strong>must</strong> include{" "}
              <strong>numbers.</strong>
            </PasswordRule>
            <PasswordRule>
              Password <strong>must</strong> be at{" "}
              <strong>least 8 characters</strong> long.
            </PasswordRule>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTermsAccepted(!termsAccepted)}
              className={`flex-shrink-0 w-4 h-4 rounded border ${
                termsAccepted
                  ? "bg-brand-600 border-brand-600"
                  : "border-neutral-500 bg-white"
              } flex items-center justify-center transition-colors cursor-pointer`}
              aria-label="Accept terms and conditions"
            >
              {termsAccepted && <Check className="w-3 h-3 text-white" />}
            </button>
            <Link
              href="#"
              className="font-[family-name:var(--font-work-sans)] text-[14px] font-medium text-brand-600 underline"
            >
              Term &amp; Condition
            </Link>
          </div>
          <div className="pl-[24px] mt-0.5">
            <p className="font-[family-name:var(--font-work-sans)] text-[12px] leading-[18px] text-neutral-600">
              I have read and agree to the Terms and Conditions of IAOS
              Connect.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-red-500">
            {error}
          </p>
        )}

        {/* Submit Button */}
        <Button
          variant={isFormValid && !isLoading ? "primary" : "disabled"}
          disabled={!isFormValid || isLoading}
          onClick={handleRegister}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </div>
    </AuthLayout>
  );
}

function PasswordRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 h-[36px]">
      <Info className="w-4 h-4 text-brand-600 flex-shrink-0" />
      <span className="font-[family-name:var(--font-work-sans)] text-[12px] leading-[18px] text-brand-600">
        {children}
      </span>
    </div>
  );
}
