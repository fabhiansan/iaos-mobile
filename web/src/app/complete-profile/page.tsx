"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthLayout } from "@/components/ui/auth-layout";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return year.toString();
});

export default function CompleteProfilePage() {
  const router = useRouter();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [yearOfEntry, setYearOfEntry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const isFormValid =
    studentId.trim() !== "" &&
    yearOfEntry !== "" &&
    phoneNumber.trim() !== "";

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nim: studentId,
          yearOfEntry: parseInt(yearOfEntry),
          phone: phoneNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to complete profile");
        return;
      }

      // Refresh the session so JWT picks up profileComplete: true
      await update();

      router.push("/news");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
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

        {error && (
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-red-500">
            {error}
          </p>
        )}

        <Button
          variant={isFormValid && !isLoading ? "primary" : "disabled"}
          disabled={!isFormValid || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </AuthLayout>
  );
}
