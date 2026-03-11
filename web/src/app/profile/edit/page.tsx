"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EditProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [yearOfEntry, setYearOfEntry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password] = useState("**********");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          return;
        }
        const { data } = await res.json();
        setFullName(data.name || "");
        setStudentId(data.nim || "");
        setYearOfEntry(String(data.yearOfEntry || ""));
        setPhone(data.phone || "");
        setEmail(data.email || "");
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          phone,
          yearOfEntry: parseInt(yearOfEntry),
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setErrorMessage(error || "Failed to save changes");
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setErrorMessage("Something went wrong");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500">
          Loading profile...
        </p>
      </div>
    );
  }

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
        <AuthHeader title="Edit Profile" onBack={() => router.back()} />

        <div className="px-4 pt-2 pb-4">
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500 leading-5">
            Edit properties field below to update or edit your profile
          </p>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-4">
          <TextInput
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <TextInput
            label="Student ID (NIM)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled
          />
          <TextInput
            label="Year of Entry"
            type="select"
            value={yearOfEntry}
            onChange={(e) => setYearOfEntry(e.target.value as string)}
          >
            {Array.from({ length: 30 }, (_, i) => 2025 - i).map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </TextInput>
          <TextInput
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled
          />
          <TextInput
            label="Password"
            type="password"
            value={password}
            onChange={() => {}}
            disabled
          />

          <Button
            variant="secondary"
            onClick={() => router.push("/profile/change-password")}
          >
            Change Password
          </Button>
        </div>

        {status === "success" && (
          <div className="px-4 pb-2">
            <p className="font-[family-name:var(--font-work-sans)] text-sm text-green-600">
              Profile updated successfully!
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="px-4 pb-2">
            <p className="font-[family-name:var(--font-work-sans)] text-sm text-red-500">
              {errorMessage}
            </p>
          </div>
        )}

        <div className="px-4 py-6">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
