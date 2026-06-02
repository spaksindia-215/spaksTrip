"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import { ApiError } from "@/lib/api";
import { agentClient, type AgentProfile } from "@/lib/agentClient";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-soft py-3 last:border-0">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className="text-[14px] font-medium text-ink">{value}</span>
    </div>
  );
}

function inr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function AgentProfilePage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await agentClient.profile();
        if (active) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Unable to load profile.");
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
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border-soft bg-white p-5">
        <h2 className="mb-2 text-[16px] font-bold text-ink">Account</h2>
        <Row label="Name" value={profile.name} />
        <Row label="Phone" value={profile.phone} />
        <Row label="Email" value={profile.email} />
        <Row label="Status" value={profile.status} />
      </div>

      <div className="rounded-xl border border-border-soft bg-white p-5">
        <h2 className="mb-2 text-[16px] font-bold text-ink">KYC</h2>
        <div className="flex items-center justify-between border-b border-border-soft py-3">
          <span className="text-[13px] text-ink-muted">Aadhaar</span>
          <Badge tone={profile.kyc.aadharProvided ? "success" : "warn"} size="sm">
            {profile.kyc.aadharProvided ? "Provided" : "Missing"}
          </Badge>
        </div>
        <Row label="GST" value={profile.kyc.gst ?? "—"} />
        <Row label="PAN" value={profile.kyc.pan ?? "—"} />
      </div>

      <div className="rounded-xl border border-border-soft bg-white p-5 sm:col-span-2">
        <h2 className="mb-2 text-[16px] font-bold text-ink">Credit &amp; Wallet</h2>
        <Row label="Credit Limit" value={profile.creditLimit != null ? inr(profile.creditLimit) : "Not set"} />
        <Row label="Credit Used" value={inr(profile.creditUsed)} />
        <Row
          label="Credit Available"
          value={profile.creditAvailable != null ? inr(profile.creditAvailable) : "—"}
        />
        <Row label="Wallet Balance" value={inr(profile.walletBalance)} />
      </div>
    </div>
  );
}
