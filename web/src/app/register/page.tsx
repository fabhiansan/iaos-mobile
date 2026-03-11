"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  Check,
} from "lucide-react";

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return year.toString();
});

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [yearOfEntry, setYearOfEntry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
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

  return (
    <div className="auth-gradient relative min-h-dvh bg-white font-[family-name:var(--font-work-sans)]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center px-4 py-3 bg-white/80 backdrop-blur-sm">
        <Link
          href="/login"
          className="flex items-center justify-center w-10 h-10 -ml-2"
          aria-label="Back to login"
        >
          <ChevronLeft className="w-6 h-6 text-neutral-900" />
        </Link>
        <h1 className="flex-1 text-center text-[20px] font-semibold text-neutral-900 pr-10">
          Create Account
        </h1>
      </div>

      {/* Subtitle */}
      <p className="px-4 pb-4 text-[14px] text-neutral-600 font-normal">
        Let&apos;s get started by filling out the form below.
      </p>

      {/* Form */}
      <div className="px-4 pb-8 flex flex-col gap-4 relative z-[1]">
        {/* Full Name */}
        <FormField label="Full Name">
          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="form-input"
          />
        </FormField>

        {/* Student ID (NIM) */}
        <FormField label="Student ID (NIM)">
          <input
            type="text"
            placeholder="Enter your Student ID (NIM)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="form-input"
          />
        </FormField>

        {/* Year of Entry */}
        <FormField label="Year of Entry">
          <div className="relative">
            <select
              value={yearOfEntry}
              onChange={(e) => setYearOfEntry(e.target.value)}
              className="form-input appearance-none pr-10"
              style={{ color: yearOfEntry === "" ? "var(--color-neutral-400)" : "var(--color-neutral-900)" }}
            >
              <option value="" disabled>
                Select your year of entry
              </option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
          </div>
        </FormField>

        {/* Phone Number */}
        <FormField label="Phone Number">
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="form-input"
          />
        </FormField>

        {/* Email */}
        <FormField label="Email">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </FormField>

        {/* Password */}
        <FormField label="Password">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </FormField>

        {/* Password Confirmation */}
        <FormField label="Password Confirmation">
          <div className="relative">
            <input
              type={showPasswordConfirmation ? "text" : "password"}
              placeholder="Enter your password confirmation"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className={`form-input pr-12 ${
                passwordsMatch && isPasswordValid
                  ? "!border-green-500"
                  : ""
              }`}
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswordConfirmation(!showPasswordConfirmation)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
              aria-label={
                showPasswordConfirmation
                  ? "Hide password confirmation"
                  : "Show password confirmation"
              }
            >
              {showPasswordConfirmation ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {passwordsMatch && isPasswordValid && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-[12px] text-green-500 font-medium">
                Password Confirmed
              </span>
            </div>
          )}
        </FormField>

        {/* Password Requirements */}
        <div className="border border-brand-200 bg-neutral-50 rounded-lg p-3 flex flex-col gap-2">
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

        {/* Terms & Conditions */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setTermsAccepted(!termsAccepted)}
            className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border ${
              termsAccepted
                ? "bg-brand-600 border-brand-600"
                : "border-neutral-500 bg-white"
            } flex items-center justify-center transition-colors`}
            aria-label="Accept terms and conditions"
          >
            {termsAccepted && <Check className="w-3 h-3 text-white" />}
          </button>
          <div className="flex flex-col gap-1">
            <Link
              href="#"
              className="text-[14px] font-medium text-brand-600 underline"
            >
              Term &amp; Condition
            </Link>
            <p className="text-[12px] text-neutral-600 font-normal leading-relaxed">
              I have read and agree to the Terms and Conditions of IAOS Connect.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={!isFormValid}
          className={`w-full py-3.5 rounded-xl text-[16px] font-semibold text-white transition-colors ${
            isFormValid
              ? "bg-brand-600 active:bg-brand-700"
              : "bg-neutral-400 cursor-not-allowed"
          }`}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-medium text-neutral-900">{label}</label>
      {children}
    </div>
  );
}

function PasswordRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
      <span className="text-[12px] text-brand-600 leading-relaxed">
        {children}
      </span>
    </div>
  );
}
