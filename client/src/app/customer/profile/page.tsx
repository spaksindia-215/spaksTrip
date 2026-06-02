"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import { ApiError } from "@/lib/api";
import { customerClient, type CustomerProfile } from "@/lib/customerClient";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-soft py-3 last:border-0">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className="text-[14px] font-medium text-ink">{value}</span>
    </div>
  );
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await customerClient.profile();
        if (active) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Unable to load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-muted">Loading profile…</p>;
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-600">
        {error ?? "Profile unavailable."}
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="rounded-xl border border-border-soft bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-ink">Account Details</h2>
          <Badge tone="success" size="sm">{profile.status}</Badge>
        </div>
        <Row label="Name" value={profile.name} />
        <Row label="Phone" value={profile.phone} />
        <Row label="Email" value={profile.email} />
        <Row label="Aadhaar" value={profile.aadharMasked} />
      </div>
      <p className="mt-3 text-[12px] text-ink-subtle">
        Your Aadhaar is stored securely and shown masked for your protection.
      </p>
    </div>
  );
}
