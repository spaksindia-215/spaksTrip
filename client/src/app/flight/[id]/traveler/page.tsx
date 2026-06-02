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
import type { Traveler, TravelerType, GSTInfo, TravelerSSR } from "@/state/bookingStore";
import { fetchSSR } from "@/services/flights";
import type { SSRResult } from "@/services/flights";

type FormTraveler = Omit<Traveler, "id"> & { id: string };

// SSR pick state — one entry per traveler id
type SSRPick = { baggageCode: string; mealCode: string };

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
  const { current, setTravelers, setContact, setAddOns, setGST, setSSRSelections, advanceStatus } = useBookingStore();

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
  const [gst, setLocalGST] = useState<GSTInfo>({
    companyName: "", gstNumber: "", companyAddress: "",
    companyContactNumber: "", companyEmail: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // SSR state
  const [ssrData, setSsrData] = useState<SSRResult | null>(null);
  const [ssrLoading, setSsrLoading] = useState(false);
  // Per-traveler SSR picks: { [travelerId]: { baggageCode, mealCode } }
  const [ssrPicks, setSsrPicks] = useState<Record<string, SSRPick>>({});

  useEffect(() => {
    if (!current) {
      router.replace("/flight");
      return;
    }
    if (travelers.length === 0) setLocalTravelers(initial);
  }, [current, initial, router, travelers.length]);

  // Fetch SSR once after mount, using FareQuote traceId for serverless correctness.
  useEffect(() => {
    if (!current) return;
    setSsrLoading(true);
    fetchSSR(current.offer.id, current.fareQuoteTraceId)
      .then((data) => setSsrData(data))
      .catch(() => {
        // SSR is optional — silently degrade; the ticket request will still work without SSR.
      })
      .finally(() => setSsrLoading(false));
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!current) return null;

  const isLCC = current.isLCC;

  // Available baggage options for LCC — first segment (index 0)
  const baggageOptions = isLCC ? (ssrData?.baggage?.[0] ?? []) : [];
  // Available meal options — first segment for LCC, full list for Non-LCC
  const mealDynamicOptions = isLCC ? (ssrData?.mealDynamic?.[0] ?? []) : [];
  const nonLCCMealOptions = !isLCC ? (ssrData?.meals ?? []) : [];

  const getPick = (id: string): SSRPick =>
    ssrPicks[id] ?? { baggageCode: "", mealCode: "" };

  const setPick = (id: string, patch: Partial<SSRPick>) =>
    setSsrPicks((prev) => ({ ...prev, [id]: { ...getPick(id), ...patch } }));

  const update = (id: string, patch: Partial<FormTraveler>) =>
    setLocalTravelers((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));

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
    if (current.isGSTMandatory) setGST(gst);

    // Build TravelerSSR[] from ssrPicks + ssrData for book/ticket request.
    const selections: TravelerSSR[] = travelers.map((t) => {
      const pick = getPick(t.id);
      const sel: TravelerSSR = { travelerId: t.id };

      // Guideline §6: baggage not available for infants.
      if (t.type !== "INF" && pick.baggageCode && isLCC) {
        const opt = baggageOptions.find((b) => b.code === pick.baggageCode);
        if (opt) {
          sel.baggage = {
            code: opt.code,
            weight: opt.weight,
            price: opt.price,
            origin: opt.origin,
            destination: opt.destination,
            airlineCode: opt.airlineCode,
            flightNumber: opt.flightNumber,
            wayType: opt.wayType,
          };
        }
      }

      if (pick.mealCode) {
        if (isLCC) {
          const opt = mealDynamicOptions.find((m) => m.code === pick.mealCode);
          if (opt) sel.meal = {
            code: opt.code, description: opt.description, price: opt.price,
            origin: opt.origin, destination: opt.destination,
            airlineCode: opt.airlineCode, flightNumber: opt.flightNumber,
          };
        } else {
          const opt = nonLCCMealOptions.find((m) => m.code === pick.mealCode);
          if (opt) sel.meal = { code: opt.code, description: opt.description, price: 0 };
        }
      }

      return sel;
    });
    setSSRSelections(selections);

    // Tally SSR add-on costs for the price summary.
    const ssrBaggageCost = selections.reduce((sum, s) => sum + (s.baggage?.price ?? 0), 0);
    const ssrMealCost = selections.reduce((sum, s) => sum + (s.meal?.price ?? 0), 0);
    setAddOns({
      insurance: addInsurance ? 199 * travelers.length : 0,
      baggage: ssrBaggageCost,
      meals: ssrMealCost,
      seats: 0,
    });

    advanceStatus("PAYMENT");
    router.push(`/flight/${encodeURIComponent(current.offer.id)}/payment?${sp.toString()}`);
  };

  const hasSsrOptions =
    baggageOptions.length > 0 || mealDynamicOptions.length > 0 || nonLCCMealOptions.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <BookingStepper active="traveler" />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6">
          <div className="grid md:grid-cols-[1fr_340px] gap-5">
            <div className="flex flex-col gap-4">
              <ItinerarySummary offer={current.offer} compact />

              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
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
                        <DobPicker
                          value={t.dob}
                          onChange={(v) => update(t.id, { dob: v })}
                          error={errors[`${t.id}.dob`]}
                        />
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

              {/* SSR section — shown only when options are available */}
              {(hasSsrOptions || ssrLoading) && (
                <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-[16px] font-bold text-ink">Meals & extras</h2>
                    {ssrLoading && (
                      <span className="text-[12px] text-ink-muted animate-pulse">Loading options…</span>
                    )}
                  </div>
                  <p className="text-[12px] text-ink-muted mb-4">
                    {isLCC
                      ? "Select extra baggage or a meal for each passenger. Charges are added at booking."
                      : "Meal preference is indicative — subject to airline availability."}
                  </p>

                  <div className="flex flex-col gap-5">
                    {travelers.map((t) => {
                      const pick = getPick(t.id);
                      const canHaveBaggage = isLCC && t.type !== "INF" && baggageOptions.length > 0;
                      // Guideline §6: only Meal is available for infants.
                      const canHaveMeal =
                        (isLCC && mealDynamicOptions.length > 0) ||
                        (!isLCC && nonLCCMealOptions.length > 0);
                      if (!canHaveBaggage && !canHaveMeal) return null;

                      return (
                        <div key={t.id} className="pb-4 border-b last:border-b-0 border-border-soft">
                          <div className="text-[13px] font-semibold text-ink mb-3">
                            {t.type === "ADT" ? "Adult" : t.type === "CHD" ? "Child" : "Infant"}{" "}
                            — {t.firstName || "Passenger"} {t.lastName}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {canHaveBaggage && (
                              <SSRSelect
                                label="Extra baggage"
                                value={pick.baggageCode}
                                onChange={(v) => setPick(t.id, { baggageCode: v })}
                                options={baggageOptions.map((b) => ({
                                  value: b.code,
                                  label: b.weight === 0
                                    ? "No extra baggage"
                                    : `+${b.weight} kg${b.price > 0 ? ` — ₹${b.price.toLocaleString("en-IN")}` : " (Included)"}`,
                                }))}
                              />
                            )}
                            {canHaveMeal && isLCC && (
                              <SSRSelect
                                label="Meal"
                                value={pick.mealCode}
                                onChange={(v) => setPick(t.id, { mealCode: v })}
                                options={mealDynamicOptions.map((m) => ({
                                  value: m.code,
                                  label: m.code === "NoMeal"
                                    ? "No meal"
                                    : `${m.description}${m.price > 0 ? ` — ₹${m.price.toLocaleString("en-IN")}` : ""}`,
                                }))}
                              />
                            )}
                            {canHaveMeal && !isLCC && (
                              <SSRSelect
                                label="Meal preference"
                                value={pick.mealCode}
                                onChange={(v) => setPick(t.id, { mealCode: v })}
                                options={[
                                  { value: "", label: "No preference" },
                                  ...nonLCCMealOptions.map((m) => ({ value: m.code, label: m.description })),
                                ]}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
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

              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[16px] font-bold text-ink mb-3">Add-ons</h2>
                <div className="flex flex-col gap-3">
                  <AddOnRow
                    title="Travel insurance"
                    price="₹199 / traveller"
                    desc="COVID coverage, loss of baggage, trip cancellation."
                    checked={addInsurance}
                    onChange={setAddInsurance}
                  />
                </div>
              </section>

              {current.isGSTMandatory && (
                <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
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

function SSRSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-medium text-ink-soft">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-md border border-border bg-white px-3 text-[14px] font-medium text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        {!options.some((o) => o.value === "") && (
          <option value="">— Select —</option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

function DobPicker({
  value,
  onChange,
  error,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  error?: string;
}) {
  // Local state holds each part independently so partial selections survive re-renders
  const [day, setDay] = useState<number>(0);
  const [month, setMonth] = useState<number>(0);
  const [year, setYear] = useState<number>(0);

  // Sync inward only when the external value changes (pre-fill / reset)
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      setYear(y ?? 0);
      setMonth(m ?? 0);
      setDay(d ?? 0);
    } else {
      setYear(0); setMonth(0); setDay(0);
    }
  }, [value]);

  const currentYear = new Date().getFullYear();
  const maxDays = month ? new Date(year || 2000, month, 0).getDate() : 31;

  const emit = (d: number, m: number, y: number) => {
    const clampedDay = m ? Math.min(d, new Date(y || 2000, m, 0).getDate()) : d;
    if (clampedDay && m && y) {
      onChange(`${y}-${String(m).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`);
    } else {
      onChange(null);
    }
  };

  const sel = (hasError: boolean) =>
    `h-11 w-full rounded-md border bg-white px-2 text-[14px] font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500/20 ${
      hasError ? "border-danger-500 focus:border-danger-500" : "border-border focus:border-brand-500"
    }`;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-medium text-ink-soft">Date of birth</label>
      <div className="grid grid-cols-[2fr_3fr_3fr] gap-2">
        <select
          aria-label="Day"
          value={day || ""}
          onChange={(e) => {
            const d = Number(e.target.value);
            setDay(d);
            emit(d, month, year);
          }}
          className={sel(Boolean(error))}
        >
          <option value="">DD</option>
          {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          aria-label="Month"
          value={month || ""}
          onChange={(e) => {
            const m = Number(e.target.value);
            const clampedDay = m ? Math.min(day, new Date(year || 2000, m, 0).getDate()) : day;
            setMonth(m);
            if (clampedDay !== day) setDay(clampedDay);
            emit(clampedDay, m, year);
          }}
          className={sel(Boolean(error))}
        >
          <option value="">MMM</option>
          {MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </select>

        <select
          aria-label="Year"
          value={year || ""}
          onChange={(e) => {
            const y = Number(e.target.value);
            const clampedDay = month ? Math.min(day, new Date(y, month, 0).getDate()) : day;
            setYear(y);
            if (clampedDay !== day) setDay(clampedDay);
            emit(clampedDay, month, y);
          }}
          className={sel(Boolean(error))}
        >
          <option value="">YYYY</option>
          {Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i).map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-[12px] font-medium text-danger-600">{error}</p>}
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
