"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { sleep } from "@/services/delay";

export default function PANDeclarationContent() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.push({ title: "Please select a PAN document", tone: "warn" }); return; }
    setSubmitting(true);
    await sleep(1200);
    toast.push({
      title: "PAN Declaration uploaded!",
      description: "Your PAN document has been submitted for verification.",
      tone: "success",
    });
    setFile(null);
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">Agency PAN Declaration</h2>
      </div>
      <form onSubmit={onSubmit} className="p-5 flex flex-col gap-5">
        <p className="text-sm text-ink-muted">
          Upload your agency&apos;s PAN card document for KYC verification. Accepted formats: JPG, PNG, PDF.
        </p>
        <div>
          <label className="mb-1 block text-[13px] font-semibold text-ink">PAN Document *</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink file:mr-3 file:rounded file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-[12px] file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
          {file && (
            <p className="mt-1.5 text-[12px] text-ink-muted">Selected: {file.name}</p>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            Upload PAN Document
          </Button>
        </div>
      </form>
    </div>
  );
}
