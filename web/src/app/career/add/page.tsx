"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ImagePlus, Loader2 } from "lucide-react";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DraftJobCard } from "@/components/career/draft-job-card";
import type { Job } from "@/components/career/job-card";
import { type ApiJob, mapDraftToJob } from "@/lib/jobs";

export default function AddJobPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"new" | "draft">("new");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [companyPictureFile, setCompanyPictureFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [contractType, setContractType] = useState("");
  const [workingType, setWorkingType] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Draft state
  const [drafts, setDrafts] = useState<Job[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);

  const isFormComplete =
    position.trim() !== "" &&
    company.trim() !== "" &&
    location.trim() !== "" &&
    contractType !== "" &&
    workingType !== "" &&
    contactName.trim() !== "" &&
    contactPhone.trim() !== "";

  const fetchDrafts = useCallback(async () => {
    setDraftsLoading(true);
    try {
      const res = await fetch("/api/jobs/drafts");
      if (!res.ok) throw new Error("Failed to fetch drafts");
      const json = await res.json();
      setDrafts((json.data as ApiJob[]).map(mapDraftToJob));
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
      setDrafts([]);
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "draft") {
      fetchDrafts();
    }
  }, [activeTab, fetchDrafts]);

  const handleSubmit = async (status: "published" | "draft") => {
    if (!isFormComplete && status === "published") return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("title", position);
      formData.set("company", company);
      formData.set("location", location);
      formData.set("contractType", contractType);
      formData.set("workingType", workingType);
      formData.set("contactName", contactName);
      formData.set("contactPhone", contactPhone);
      formData.set("status", status);
      if (companyPictureFile) {
        formData.set("companyImage", companyPictureFile);
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create job");
        return;
      }

      router.push("/career");
    } catch (err) {
      console.error("Submit error:", err);
      alert("An error occurred while saving the job.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete draft");
        return;
      }
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Delete draft error:", err);
    }
  };

  const handlePublishDraft = async (id: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}/publish`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to publish draft");
        return;
      }
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Publish draft error:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyPictureFile(file);
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
        <AuthHeader title="Add Job" onBack={() => router.push("/career")} />

        {/* Description */}
        <p className="px-4 mt-1 font-[family-name:var(--font-work-sans)] text-sm text-neutral-600">
          Complete the field to post a job or continue from your draft
        </p>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`rounded-lg py-2 px-4 font-[family-name:var(--font-inter)] text-sm font-medium cursor-pointer ${
              activeTab === "new"
                ? "bg-brand-800 text-white"
                : "bg-white border border-brand-800 text-brand-800"
            }`}
          >
            New Job
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            className={`rounded-lg py-2 px-4 font-[family-name:var(--font-inter)] text-sm font-medium cursor-pointer ${
              activeTab === "draft"
                ? "bg-brand-800 text-white"
                : "bg-white border border-brand-800 text-brand-800"
            }`}
          >
            Draft ({drafts.length})
          </button>
        </div>

        {activeTab === "new" ? (
          <div className="flex flex-col gap-3 px-4 mt-4 pb-8 flex-1">
            <TextInput
              label="Position"
              placeholder="Input Job Position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              name="position"
            />

            <TextInput
              label="Company"
              placeholder="Input Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              name="company"
            />

            {/* Add Company Picture (Optional) */}
            <div className="w-full">
              <div className="relative flex items-center h-[56px] bg-neutral-50 border border-brand-200 rounded-lg px-3 py-2">
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <label className="font-[family-name:var(--font-work-sans)] text-[10px] leading-tight text-neutral-500">
                    Add Company Picture (Optional)
                  </label>
                  <span className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500 truncate">
                    {companyPictureFile?.name || "Upload image"}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-2 flex-shrink-0 text-neutral-500 cursor-pointer"
                >
                  <ImagePlus size={20} />
                </button>
              </div>
            </div>

            <TextInput
              label="Location"
              placeholder="Input Job Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              name="location"
              icon={<MapPin size={20} />}
            />

            {/* Contract Type & Working Type side by side */}
            <div className="flex gap-3">
              <div className="flex-1">
                <TextInput
                  type="select"
                  label="Contract Type"
                  value={contractType}
                  onChange={(e) => setContractType((e.target as unknown as HTMLSelectElement).value)}
                  name="contractType"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Project Based">Project Based</option>
                  <option value="Internship">Internship</option>
                </TextInput>
              </div>
              <div className="flex-1">
                <TextInput
                  type="select"
                  label="Working Type"
                  value={workingType}
                  onChange={(e) => setWorkingType((e.target as unknown as HTMLSelectElement).value)}
                  name="workingType"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </TextInput>
              </div>
            </div>

            <TextInput
              label="Contact Name"
              placeholder="Input Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              name="contactName"
            />

            <TextInput
              label="Contact Phone Number"
              placeholder="Input Contact Phone Number"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              name="contactPhone"
            />

            {/* Bottom buttons */}
            <div className="flex flex-col gap-3 mt-4">
              <Button
                variant={isFormComplete && !submitting ? "primary" : "disabled"}
                disabled={!isFormComplete || submitting}
                onClick={() => handleSubmit("published")}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Posting...
                  </span>
                ) : (
                  "Post Job"
                )}
              </Button>
              <Button
                variant="secondary"
                disabled={submitting}
                onClick={() => handleSubmit("draft")}
              >
                Save Draft
              </Button>
            </div>
          </div>
        ) : (
          /* Draft tab */
          <div className="flex flex-col gap-3 px-4 mt-4 pb-8 flex-1">
            {draftsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} className="text-brand-600 animate-spin" />
              </div>
            ) : (
              <>
                {drafts.map((job) => (
                  <DraftJobCard
                    key={job.id}
                    job={job}
                    onDelete={(id) => handleDeleteDraft(id)}
                    onEdit={(id) => console.log("Edit draft", id)}
                    onPost={(id) => handlePublishDraft(id)}
                  />
                ))}

                {drafts.length === 0 && (
                  <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500 text-center py-8">
                    No drafts saved yet.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
