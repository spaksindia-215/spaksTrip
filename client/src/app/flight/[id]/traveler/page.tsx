"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BookingStepper from "@/components/flight/BookingStepper";
import ItinerarySummary from "@/components/flight/ItinerarySummary";
import PriceBreakdown from "@/components/flight/PriceBreakdown";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Radio from "@/components/ui/Radio";
import { useBookingStore } from "@/state/bookingStore";
import { useToast } from "@/components/ui/Toast";
import type { Traveler, TravelerType, GSTInfo } from "@/state/bookingStore";

type FormTraveler = Omit<Traveler, "id"> & { id: string };

const TITLES_ADULT = ["Mr", "Ms", "Mrs"] as const;
const TITLES_CHILD = ["Mstr", "Miss"] as const;

function emptyFor(type: TravelerType, idx: number): FormTraveler {
  return {
    id: `${type}-${idx}`,
    type,
    title: type === "ADT" ? "Mr" : "Mstr",
    firstName: "",
    lastName: "",
    gender: "M",
    dob: null,
    nationality: "IN",
  };
}

export default function FlightTravelerPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <TravelerInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <BookingStepper active="traveler" />
      <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">
        Loading…
      </main>
      <Footer />
    </div>
  );
}

function TravelerInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const { current, setTravelers, setContact, setAddOns, setGST, advanceStatus } = useBookingStore();

  const initial = useMemo(() => {
    if (!current) return [];
    const list: FormTraveler[] = [];
    for (let i = 0; i < current.pax.adults; i++) list.push(emptyFor("ADT", i));
    for (let i = 0; i < current.pax.children; i++) list.push(emptyFor("CHD", i));
    for (let i = 0; i < current.pax.infants; i++) list.push(emptyFor("INF", i));
    return list;
  }, [current]);

  const [travelers, setLocalTravelers] = useState<FormTraveler[]>(initial);
  const [email, setEmail] = useState(current?.contact.email ?? "");
  const [phone, setPhone] = useState(current?.contact.phone ?? "");
  const [addInsurance, setAddInsurance] = useState(false);
  const [addSeats, setAddSeats] = useState(false);
  const [gst, setLocalGST] = useState<GSTInfo>({
    companyName: "", gstNumber: "", companyAddress: "",
    companyContactNumber: "", companyEmail: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!current) {
      router.replace("/flight");
    } else if (travelers.length === 0) {
      setLocalTravelers(initial);
    }
  }, [current, initial, router, travelers.length]);

  if (!current) return null;

  const update = (id: string, patch: Partial<FormTraveler>) => {
    setLocalTravelers((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    for (const t of travelers) {
      if (!t.firstName.trim()) e[`${t.id}.firstName`] = "First name required";
      if (!t.lastName.trim()) e[`${t.id}.lastName`] = "Last name required";
      if (!t.dob) e[`${t.id}.dob`] = "Date of birth required";
    }
    if (!/.+@.+\..+/.test(email)) e.email = "Enter a valid email";
    if (phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid phone";
    // Guideline §14: when GST is mandatory, all 5 fields are required.
    if (current.isGSTMandatory) {
      if (!gst.companyName.trim()) e["gst.companyName"] = "Company name required";
      if (!gst.gstNumber.trim()) e["gst.gstNumber"] = "GST number required";
      if (!gst.companyAddress.trim()) e["gst.companyAddress"] = "Company address required";
      if (!gst.companyContactNumber.trim()) e["gst.companyContactNumber"] = "Contact number required";
      if (!/.+@.+\..+/.test(gst.companyEmail)) e["gst.companyEmail"] = "Enter a valid company email";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onContinue = () => {
    if (!validate()) {
      toast.push({ title: "Please fix the highlighted fields", tone: "warn" });
      return;
    }
    setTravelers(travelers);
    setContact({ email, phone, countryCode: "+91" });
    // Guideline §14: persist GST only when mandatory.
    if (current.isGSTMandatory) setGST(gst);
    // Guideline §6: baggage and seat cannot be taken for infant passengers.
    const eligibleForSeat = travelers.filter((t) => t.type !== "INF").length;
    setAddOns({
      insurance: addInsurance ? 199 * travelers.length : 0,
      seats: addSeats ? 349 * eligibleForSeat : 0,
    });
    advanceStatus("PAYMENT");
    router.push(`/flight/${encodeURIComponent(current.offer.id)}/payment?${sp.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <BookingStepper active="traveler" />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6">
          <div className="grid md:grid-cols-[1fr_340px] gap-5">
            <div className="flex flex-col gap-4">
              <ItinerarySummary offer={current.offer} compact />

              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-[var(--shadow-xs)]">
                <h2 className="text-[16px] font-bold text-ink mb-1">Traveller details</h2>
                <p className="text-[12px] text-ink-muted mb-4">
                  Names must match government-issued ID exactly.
                </p>

                <div className="flex flex-col gap-5">
                  {travelers.map((t, i) => (
                    <div key={t.id} className="pb-5 border-b last:border-b-0 border-border-soft">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[14px] font-bold text-ink">
                          {t.type === "ADT" ? "Adult" : t.type === "CHD" ? "Child" : "Infant"}{" "}
                          {i + 1}
                        </h3>
                        {t.type === "INF" && (
                          <span className="text-[11px] text-ink-muted">
                            Infant must travel with an adult
                          </span>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-[120px_1fr_1fr] gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[13px] font-medium text-ink-soft">Title</label>
                          <select
                            value={t.title}
                            onChange={(e) => update(t.id, { title: e.target.value as Traveler["title"] })}
                            className="h-11 rounded-md border border-border bg-white px-3 text-[14px] font-medium text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                          >
                            {(t.type === "ADT" ? TITLES_ADULT : TITLES_CHILD).map((tt) => (
                              <option key={tt} value={tt}>{tt}</option>
                            ))}
                          </select>
                        </div>
                        <Input
                          label="First & middle name"
                          value={t.firstName}
                          onChange={(e) => update(t.id, { firstName: e.target.value })}
                          error={errors[`${t.id}.firstName`]}
                        />
                        <Input
                          label="Last name"
                          value={t.lastName}
                          onChange={(e) => update(t.id, { lastName: e.target.value })}
                          error={errors[`${t.id}.lastName`]}
                        />
                      </div>

                      <div className="mt-3 grid sm:grid-cols-[1fr_1fr] gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[13px] font-medium text-ink-soft">Date of birth</label>
                          <input
                            type="date"
                            value={t.dob ?? ""}
                            onChange={(e) => update(t.id, { dob: e.target.value || null })}
                            className="h-11 rounded-md border border-border bg-white px-3 text-[14px] font-medium text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            aria-invalid={Boolean(errors[`${t.id}.dob`]) || undefined}
                          />
                          {errors[`${t.id}.dob`] && (
                            <p className="text-[12px] font-medium text-danger-600">
                              {errors[`${t.id}.dob`]}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[13px] font-medium text-ink-soft">Gender</label>
                          <div className="flex items-center gap-4 h-11">
                            <Radio
                              id={`${t.id}-m`}
                              name={`gender-${t.id}`}
                              label="Male"
                              checked={t.gender === "M"}
                              onChange={() => update(t.id, { gender: "M" })}
                            />
                            <Radio
                              id={`${t.id}-f`}
                              name={`gender-${t.id}`}
                              label="Female"
                              checked={t.gender === "F"}
                              onChange={() => update(t.id, { gender: "F" })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-[var(--shadow-xs)]">
                <h2 className="text-[16px] font-bold text-ink mb-1">Contact information</h2>
                <p className="text-[12px] text-ink-muted mb-4">
                  Your booking confirmation will be sent here.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    placeholder="you@example.com"
                  />
                  <Input
                    label="Mobile number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={errors.phone}
                    placeholder="+91 98xxxxxxxx"
                  />
                </div>
              </section>

              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-[var(--shadow-xs)]">
                <h2 className="text-[16px] font-bold text-ink mb-3">Add-ons</h2>
                <div className="flex flex-col gap-3">
                  <AddOnRow
                    title="Travel insurance"
                    price="₹199 / traveller"
                    desc="COVID coverage, loss of baggage, trip cancellation."
                    checked={addInsurance}
                    onChange={setAddInsurance}
                  />
                  <AddOnRow
                    title="Preferred seat selection"
                    price="₹349 / adult & child"
                    desc="Choose your exact seat across legs. Not applicable for infants."
                    checked={addSeats}
                    onChange={setAddSeats}
                  />
                </div>
              </section>

              {current.isGSTMandatory && (
                <section className="rounded-xl bg-white border border-border-soft p-5 shadow-[var(--shadow-xs)]">
                  <h2 className="text-[16px] font-bold text-ink mb-1">GST details</h2>
                  <p className="text-[12px] text-ink-muted mb-4">
                    Required by the airline for this fare. Enter your company GST information.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input
                        label="Company name"
                        value={gst.companyName}
                        onChange={(e) => setLocalGST((g) => ({ ...g, companyName: e.target.value }))}
                        error={errors["gst.companyName"]}
                        placeholder="Acme Pvt Ltd"
                      />
                      <Input
                        label="GST number"
                        value={gst.gstNumber}
                        onChange={(e) => setLocalGST((g) => ({ ...g, gstNumber: e.target.value.toUpperCase() }))}
                        error={errors["gst.gstNumber"]}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <Input
                      label="Company address"
                      value={gst.companyAddress}
                      onChange={(e) => setLocalGST((g) => ({ ...g, companyAddress: e.target.value }))}
                      error={errors["gst.companyAddress"]}
                      placeholder="123, MG Road, Bengaluru"
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input
                        label="Company contact number"
                        type="tel"
                        value={gst.companyContactNumber}
                        onChange={(e) => setLocalGST((g) => ({ ...g, companyContactNumber: e.target.value }))}
                        error={errors["gst.companyContactNumber"]}
                        placeholder="+91 80xxxxxxxx"
                      />
                      <Input
                        label="Company email"
                        type="email"
                        value={gst.companyEmail}
                        onChange={(e) => setLocalGST((g) => ({ ...g, companyEmail: e.target.value }))}
                        error={errors["gst.companyEmail"]}
                        placeholder="accounts@acme.com"
                      />
                    </div>
                  </div>
                </section>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <PriceBreakdown booking={current} />
              <Button variant="accent" size="lg" onClick={onContinue} fullWidth>
                Continue to payment
              </Button>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AddOnRow({
  title,
  price,
  desc,
  checked,
  onChange,
}: {
  title: string;
  price: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-lg border border-border-soft p-4 cursor-pointer hover:border-border">
      <div className="flex gap-3">
        <Checkbox
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div>
          <div className="text-[14px] font-semibold text-ink">{title}</div>
          <div className="text-[12px] text-ink-muted">{desc}</div>
        </div>
      </div>
      <div className="text-[13px] font-bold text-brand-700">{price}</div>
    </label>
  );
}
