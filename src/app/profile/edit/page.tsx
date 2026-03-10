"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EditProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("Budi Santoso");
  const [studentId, setStudentId] = useState("12908145");
  const [yearOfEntry, setYearOfEntry] = useState("2008");
  const [phone, setPhone] = useState("+62 812 8491 2857");
  const [email, setEmail] = useState("budsans@gmail.com");
  const [password] = useState("**********");

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
          />
          <TextInput
            label="Password"
            type="password"
            value={password}
            onChange={() => {}}
          />

          <Button
            variant="secondary"
            onClick={() => router.push("/profile/change-password")}
          >
            Change Password
          </Button>
        </div>

        <div className="px-4 py-6">
          <Button variant="primary" onClick={() => router.back()}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
