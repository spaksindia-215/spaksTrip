"use client";

import { useState } from "react";

type VehicleType = "mini" | "sedan" | "suv" | "van" | "luxury";

const VEHICLE_TYPES: { value: VehicleType; label: string; seats: string }[] = [
  { value: "mini", label: "Mini / Hatchback", seats: "4 seats" },
  { value: "sedan", label: "Sedan", seats: "4 seats" },
  { value: "suv", label: "SUV / MUV", seats: "6–7 seats" },
  { value: "van", label: "Van / Traveller", seats: "9–14 seats" },
  { value: "luxury", label: "Luxury", seats: "4 seats" },
];

const SERVICE_TYPES = ["Outstation", "Airport Transfer", "Sightseeing", "Local"];

type FormState = {
  operatorName: string;
  contactName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType | "";
  vehicleModel: string;
  vehicleNumber: string;
  ratePerKm: string;
  minFare: string;
  services: string[];
  coverageCities: string;
  description: string;
};

const INITIAL: FormState = {
  operatorName: "",
  contactName: "",
  phone: "",
  email: "",
  vehicleType: "",
  vehicleModel: "",
  vehicleNumber: "",
  ratePerKm: "",
  minFare: "",
  services: [],
  coverageCities: "",
  description: "",
};

export default function AddYourTaxiForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleService(s: string) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(s)
        ? prev.services.filter((x) => x !== s)
        : [...prev.services, s],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-10 text-center shadow-[var(--shadow-md)]">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "var(--success-50)" }}
          >
            <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="var(--success-600)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-extrabold text-[var(--ink)]">Application Received!</h2>
          <p className="mb-6 text-[14px] text-[var(--ink-muted)]">
            Thank you, <strong>{form.contactName || form.operatorName}</strong>. Our partner team will review your submission and reach out within 2–3 business days.
          </p>
          <button
            type="button"
            onClick={() => { setForm(INITIAL); setSubmitted(false); }}
            className="rounded-xl border border-[var(--border-soft)] px-5 py-2.5 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            Submit another vehicle
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[var(--ink)] sm:text-3xl">List Your Cab on SpaksTrip</h1>
        <p className="mt-1.5 text-[14px] text-[var(--ink-muted)]">
          Fill in your vehicle and operator details. Our team will verify and onboard you within 48 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Operator info */}
        <section className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 shadow-[var(--shadow-xs)]">
          <h2 className="mb-5 text-[15px] font-bold text-[var(--ink)]">Operator Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company / Operator Name" required>
              <input
                type="text"
                value={form.operatorName}
                onChange={(e) => set("operatorName", e.target.value)}
                placeholder="e.g. RoyalDrive India"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Contact Person Name" required>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder="Your full name"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Phone Number" required>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Email Address" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                required
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        {/* Vehicle info */}
        <section className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 shadow-[var(--shadow-xs)]">
          <h2 className="mb-5 text-[15px] font-bold text-[var(--ink)]">Vehicle Details</h2>

          {/* Vehicle type tiles */}
          <div className="mb-4">
            <p className="mb-2 text-[12px] font-semibold text-[var(--ink-muted)]">Vehicle Type <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {VEHICLE_TYPES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => set("vehicleType", v.value)}
                  className={[
                    "rounded-xl border p-3 text-left transition-all",
                    form.vehicleType === v.value
                      ? "border-[var(--brand-500)] bg-[var(--brand-50)] ring-2 ring-[var(--brand-200)]"
                      : "border-[var(--border-soft)] bg-white hover:border-[var(--brand-300)]",
                  ].join(" ")}
                >
                  <p className="text-[13px] font-semibold text-[var(--ink)]">{v.label}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">{v.seats}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Vehicle Model" required>
              <input
                type="text"
                value={form.vehicleModel}
                onChange={(e) => set("vehicleModel", e.target.value)}
                placeholder="e.g. Toyota Innova Crysta"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Vehicle Registration Number" required>
              <input
                type="text"
                value={form.vehicleNumber}
                onChange={(e) => set("vehicleNumber", e.target.value.toUpperCase())}
                placeholder="e.g. MH-01 AB 1234"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Rate per km (₹)" required>
              <input
                type="number"
                value={form.ratePerKm}
                onChange={(e) => set("ratePerKm", e.target.value)}
                min={5}
                max={100}
                placeholder="e.g. 14"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Minimum Fare (₹)" required>
              <input
                type="number"
                value={form.minFare}
                onChange={(e) => set("minFare", e.target.value)}
                min={100}
                placeholder="e.g. 500"
                required
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        {/* Services & Coverage */}
        <section className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 shadow-[var(--shadow-xs)]">
          <h2 className="mb-5 text-[15px] font-bold text-[var(--ink)]">Services & Coverage</h2>

          <div className="mb-4">
            <p className="mb-2 text-[12px] font-semibold text-[var(--ink-muted)]">
              Service Types Offered <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={[
                    "rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                    form.services.includes(s)
                      ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white"
                      : "border-[var(--border-soft)] bg-white text-[var(--ink-soft)] hover:border-[var(--brand-400)]",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Field label="Coverage Cities / Routes">
            <input
              type="text"
              value={form.coverageCities}
              onChange={(e) => set("coverageCities", e.target.value)}
              placeholder="e.g. Delhi, Agra, Jaipur, Mathura"
              className={inputCls}
            />
          </Field>

          <div className="mt-4">
            <Field label="Additional Notes">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                placeholder="Anything else you'd like us to know about your service…"
                className={inputCls + " resize-none"}
              />
            </Field>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting || !form.vehicleType || form.services.length === 0}
          className="w-full rounded-xl bg-[var(--brand-600)] py-3.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-[var(--ink-muted)]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
