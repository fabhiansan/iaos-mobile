"use client";

import { useState, useTransition } from "react";
import { AuthLayout } from "@/components/ui/auth-layout";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { completeProfileSchema } from "@/lib/validations";
import { completeProfile } from "./actions";

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return year.toString();
});

export function CompleteProfileForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [studentId, setStudentId] = useState("");
  const [yearOfEntry, setYearOfEntry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const isFormValid =
    studentId.trim() !== "" &&
    yearOfEntry !== "" &&
    phoneNumber.trim() !== "";

  const handleSubmit = () => {
    setError("");
    setFieldErrors({});

    const result = completeProfileSchema.safeParse({
      nim: studentId,
      yearOfEntry: yearOfEntry ? parseInt(yearOfEntry) : undefined,
      phone: phoneNumber,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const response = await completeProfile(result.data);
      // If we get here, there was an error (redirect throws on success)
      if (response?.error) {
        setError(response.error);
      }
    });
  };

  return (
    <AuthLayout>
      <AuthHeader title="Complete Your Profile" />

      <div className="px-4">
        <p className="font-[family-name:var(--font-work-sans)] text-[14px] leading-[20px] text-neutral-600">
          Please fill in your details to continue using IAOS Connect
        </p>
      </div>

      <div className="px-4 pt-4 pb-8 flex flex-col gap-4">
        <div>
          <TextInput
            label="Student ID (NIM)"
            placeholder="129 YY XXX"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            maxLength={8}
          />
          {fieldErrors.nim && (
            <p className="font-[family-name:var(--font-work-sans)] text-xs text-red-500 mt-1">{fieldErrors.nim}</p>
          )}
        </div>

        <div>
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
          {fieldErrors.yearOfEntry && (
            <p className="font-[family-name:var(--font-work-sans)] text-xs text-red-500 mt-1">{fieldErrors.yearOfEntry}</p>
          )}
        </div>

        <div>
          <TextInput
            label="Phone Number"
            placeholder="08XXXXXXXXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            maxLength={13}
          />
          {fieldErrors.phone && (
            <p className="font-[family-name:var(--font-work-sans)] text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
          )}
        </div>

        {error && (
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-red-500">
            {error}
          </p>
        )}

        <Button
          variant={isFormValid && !isPending ? "primary" : "disabled"}
          disabled={!isFormValid || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Saving..." : "Continue"}
        </Button>
      </div>
    </AuthLayout>
  );
}
