"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { sleep } from "@/services/delay";
import InsuranceCredentials from "./InsuranceCredentials";
import InsuranceReviews from "./InsuranceReviews";

type RenewType = "car" | "health" | "two-wheeler" | null;

const RENEW_TYPES = [
  {
    id: "car" as const,
    label: "Car Insurance",
    icon: (
      <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="#14b8a6" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
        <path d="M5 11l1.5-4.5h11L19 11" />
        <rect x="2" y="11" width="20" height="6" rx="2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    id: "health" as const,
    label: "Health Insurance",
    icon: (
      <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="#14b8a6" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
        <path d="M12 21C12 21 4 14.5 4 9a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 5.5-8 12-8 12z" />
        <path d="M9 10h6M12 7v6" />
      </svg>
    ),
  },
  {
    id: "two-wheeler" as const,
    label: "2 Wheeler Insurance",
    icon: (
      <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="#14b8a6" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
        <circle cx="5.5" cy="16" r="3" />
        <circle cx="18.5" cy="16" r="3" />
        <path d="M8.5 16l3-7h4l2 7" />
        <path d="M15 9l1.5-3H19" />
        <path d="M8.5 16h10" />
      </svg>
    ),
  },
];

function RenewForm({ type, onSuccess }: { type: RenewType; onSuccess: () => void }) {
  const toast = useToast();
  const [policyNo, setPolicyNo] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const label = RENEW_TYPES.find((t) => t.id === type)?.label ?? "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyNo.trim()) { toast.push({ title: "Enter your policy number", tone: "warn" }); return; }
    if (!name.trim()) { toast.push({ title: "Enter your full name", tone: "warn" }); return; }
    if (!phone.trim()) { toast.push({ title: "Enter your phone number", tone: "warn" }); return; }
    if (!email.trim() || !email.includes("@")) { toast.push({ title: "Enter a valid email", tone: "warn" }); return; }
    setSubmitting(true);
    await sleep(1300);
    const ref = `RNW${Math.floor(Math.random() * 900000 + 100000)}`;
    toast.push({
      title: "Renewal request submitted!",
      description: `Reference ID: ${ref}. Our team will contact you within 24 hours.`,
      tone: "success",
    });
    setPolicyNo(""); setName(""); setPhone(""); setEmail("");
    setSubmitting(false);
    onSuccess();
  };

  return (
    <div className="mt-8 mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#0E1E3A] mb-1">Renew {label}</h3>
      <p className="text-sm text-zinc-500 mb-5">Enter your existing policy details to get a renewal quote.</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Policy Number *"
          value={policyNo}
          onChange={(e) => setPolicyNo(e.target.value)}
          placeholder="e.g. POL-2024-XXXXXX"
        />
        <Input
          label="Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="As on existing policy"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone *"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
          <Input
            label="Email *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="rounded-lg bg-[#fefce8] border border-yellow-200 text-yellow-700 text-[12px] font-medium px-3 py-2.5 flex items-start gap-2">
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Renewal will be confirmed after verification by our insurance partner.
        </div>
        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          Submit Renewal Request
        </Button>
      </form>
    </div>
  );
}

export default function InsuranceRenewContent() {
  const [selected, setSelected] = useState<RenewType>(null);

  const handleSelect = (id: RenewType) => {
    setSelected((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {/* BUY / RENEW tab bar — mirrors InsuranceBuy styling */}
      <section className="bg-[#F4F6F9] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-center text-3xl font-extrabold text-[#0E1E3A] mb-8">Insurance Renew</h1>

          <div className="relative flex h-12 rounded-sm overflow-hidden bg-[#16a34a]">
            <Link
              href="/insurance"
              className="relative flex-1 flex items-center justify-center text-base font-bold transition-colors text-white hover:bg-white/10"
            >
              BUY
            </Link>
            <div
              className="relative flex-1 flex items-center justify-center text-base font-bold"
              style={{ background: "#E8A020", color: "#0E1E3A" }}
            >
              RENEW
              <span
                aria-hidden="true"
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent"
                style={{ borderTopColor: "#E8A020" }}
              />
            </div>
          </div>

          {/* 3 renewal type circles */}
          <div className="mt-12 flex flex-wrap justify-center gap-10">
            {RENEW_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t.id)}
                className="flex flex-col items-center gap-3 group"
              >
                <span
                  className={`flex h-20 w-20 items-center justify-center rounded-full border-2 transition-colors ${
                    selected === t.id
                      ? "border-[#14b8a6] bg-teal-50 ring-2 ring-[#14b8a6] ring-offset-2"
                      : "border-[#14b8a6] bg-white group-hover:bg-teal-50"
                  }`}
                >
                  {t.icon}
                </span>
                <span className="text-sm font-medium text-[#0E1E3A] text-center max-w-[90px]">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Inline renewal form — appears below icons when a type is selected */}
          {selected && (
            <RenewForm
              type={selected}
              onSuccess={() => setSelected(null)}
            />
          )}
        </div>
      </section>

      <InsuranceCredentials />
      <InsuranceReviews />
    </>
  );
}
