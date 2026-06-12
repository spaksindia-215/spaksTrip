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
import type { Traveler, TravelerType, Gender, GSTInfo, TravelerSSR } from "@/state/bookingStore";
import { fetchSSR } from "@/services/flights";
import type { SSRResult } from "@/services/flights";

type FormTraveler = Omit<Traveler, "id"> & { id: string };

// SSR pick state — one entry per traveler id
type SSRPick = { baggageCode: string; mealCode: string };

// Title options per pax type / gender. TBO requires these for ALL airlines:
// Male: MR | Female: MRS/MS | Child: MR/MS | Infant: MSTR (only).
function titlesFor(type: TravelerType, gender: Gender): Traveler["title"][] {
  if (type === "ADT") return gender === "F" ? ["Ms", "Mrs"] : ["Mr"];
  if (type === "CHD") return ["Mr", "Ms"];
  return ["Mstr"]; // INF — MSTR only
}

function emptyFor(type: TravelerType, idx: number): FormTraveler {
  return {
    id: `${type}-${idx}`,
    type,
    title: titlesFor(type, "M")[0],
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
  // LCC lead-pax address + AirAsia country (mandatory on LCC).
  const [addressLine1, setAddressLine1] = useState(current?.contact.addressLine1 ?? "");
  const [city, setCity] = useState(current?.contact.city ?? "");
  const [countryName, setCountryName] = useState(current?.contact.countryName ?? "India");
  const [isoCountryCode, setIsoCountryCode] = useState(current?.contact.isoCountryCode ?? "IN");
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
  // FareQuote-driven requirement flags (CLAUDE.md PAN/Passport/Special-fare).
  const panRequired = Boolean(current.panRequiredAtBook || current.panRequiredAtTicket);
  const passportRequired = Boolean(
    current.passportRequiredAtBook || current.passportRequiredAtTicket || current.passportFullDetailRequiredAtBook,
  );
  const passportFullDetail = Boolean(current.passportFullDetailRequiredAtBook);
  const NAME_BAD = /[.,/]/;
  // Strict email: no whitespace, single @, a dot-separated domain with a 2+ char TLD.
  // The previous loose check (/.+@.+\..+/) accepted spaces/malformed addresses that
  // passed this page but were rejected by TBO later at Book/Ticket.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Available baggage options for LCC — first segment (index 0).
  // KNOWN GAP (intl multi-leg): paid baggage is only collected for segment 0.
  // Free baggage for all segments is added server-side (ticket.ts applyMandatorySSR);
  // per-segment *paid* baggage UI is a future enhancement for international multi-leg.
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

  const airlineCode = (current.airlineCode ?? current.offer.segments[0]?.airlineCode ?? "").toUpperCase();

  // Keep the current title if still valid for the pax type/gender, else fall back
  // to the first valid option (prevents sending a title TBO rejects, e.g. infant ≠ MSTR).
  const normTitle = (type: TravelerType, gender: Gender, currentTitle: Traveler["title"]): Traveler["title"] => {
    const opts = titlesFor(type, gender);
    return opts.includes(currentTitle) ? currentTitle : opts[0];
  };

  const validate = () => {
    const e: Record<string, string> = {};
    travelers.forEach((t, idx) => {
      if (!t.firstName.trim()) e[`${t.id}.firstName`] = "First name required";
      if (!t.lastName.trim()) e[`${t.id}.lastName`] = "Last name required";
      // No special characters (. , /) in names — Navitaire/SpiceJet rule.
      if (NAME_BAD.test(t.firstName) || NAME_BAD.test(t.lastName)) {
        e[`${t.id}.firstName`] = "Name cannot contain . , or /";
      }
      // SpiceJet requires the first and last name to be distinct.
      if (airlineCode === "SG" && t.firstName.trim() && t.firstName.trim().toUpperCase() === t.lastName.trim().toUpperCase()) {
        e[`${t.id}.lastName`] = "First and last name must be different";
      }
      // DOB mandatory for everyone (Child/Infant always; AirAsia adults too).
      if (!t.dob) e[`${t.id}.dob`] = "Date of birth required";

      // PAN: Adult own PAN; Child/Infant guardian PAN + name.
      if (panRequired) {
        if (t.type === "ADT") {
          if (!t.pan?.trim()) e[`${t.id}.pan`] = "PAN required (passenger's own PAN)";
        } else {
          if (!t.guardian?.firstName?.trim()) e[`${t.id}.gFirst`] = "Guardian first name required";
          if (!t.guardian?.lastName?.trim()) e[`${t.id}.gLast`] = "Guardian last name required";
          if (!t.guardian?.pan?.trim()) e[`${t.id}.gPan`] = "Guardian PAN required";
        }
      }

      // Passport when required by FareQuote flags.
      if (passportRequired) {
        if (!t.passport?.trim()) e[`${t.id}.passport`] = "Passport number required";
        if (!t.passportExpiry) e[`${t.id}.passportExpiry`] = "Passport expiry required";
        if (passportFullDetail) {
          if (!t.passportIssueDate) e[`${t.id}.passportIssueDate`] = "Issue date required";
          if (!t.passportIssueCountry?.trim()) e[`${t.id}.passportIssueCountry`] = "Issuing country required";
        }
      }

      // LCC lead passenger: address mandatory (email/phone validated below).
      if (isLCC && idx === 0 && !addressLine1.trim()) {
        e["lead.address"] = "Address required for the lead passenger on this airline";
      }
    });

    // No two passengers may share an identical full name — TBO rejects duplicates
    // on a single booking. Flag every passenger in a duplicate group so the user
    // can fix them here rather than at payment.
    const byName = new Map<string, string[]>();
    travelers.forEach((t) => {
      const first = t.firstName.trim().toUpperCase();
      const last = t.lastName.trim().toUpperCase();
      if (!first || !last) return; // missing names already flagged as required
      const key = `${first} ${last}`;
      byName.set(key, [...(byName.get(key) ?? []), t.id]);
    });
    for (const ids of byName.values()) {
      if (ids.length > 1) {
        for (const id of ids) {
          if (!e[`${id}.firstName`]) e[`${id}.firstName`] = "Each passenger must have a distinct name";
        }
      }
    }

    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email";
    if (phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid phone";
    // Guideline §14: when GST is mandatory, all 5 fields are required.
    if (current.isGSTMandatory) {
      if (!gst.companyName.trim()) e["gst.companyName"] = "Company name required";
      if (!gst.gstNumber.trim()) e["gst.gstNumber"] = "GST number required";
      if (!gst.companyAddress.trim()) e["gst.companyAddress"] = "Company address required";
      if (!gst.companyContactNumber.trim()) e["gst.companyContactNumber"] = "Contact number required";
      if (!EMAIL_RE.test(gst.companyEmail.trim())) e["gst.companyEmail"] = "Enter a valid company email";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onContinue = () => {
    if (!validate()) {
      toast.push({ title: "Please fix the highlighted fields", tone: "warn" });
      return;
    }
    // Safety net: ensure every title is valid for its pax type/gender/airline.
    const normalizedTravelers = travelers.map((t) => ({
      ...t,
      title: normTitle(t.type, t.gender, t.title),
    }));
    setTravelers(normalizedTravelers);
    setContact({
      email: email.trim(), phone: phone.trim(), countryCode: "+91",
      addressLine1, city, countryName, isoCountryCode,
    });
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
                            value={normTitle(t.type, t.gender, t.title)}
                            onChange={(e) => update(t.id, { title: e.target.value as Traveler["title"] })}
                            className="h-11 rounded-md border border-border bg-white px-3 text-[14px] font-medium text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                          >
                            {titlesFor(t.type, t.gender).map((tt) => (
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
                              onChange={() => update(t.id, { gender: "M", title: normTitle(t.type, "M", t.title) })}
                            />
                            <Radio
                              id={`${t.id}-f`}
                              name={`gender-${t.id}`}
                              label="Female"
                              checked={t.gender === "F"}
                              onChange={() => update(t.id, { gender: "F", title: normTitle(t.type, "F", t.title) })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* PAN — Adult own PAN; Child/Infant guardian PAN + name. */}
                      {panRequired && t.type === "ADT" && (
                        <div className="mt-3">
                          <Input
                            label="PAN (as per PAN card)"
                            value={t.pan ?? ""}
                            onChange={(e) => update(t.id, { pan: e.target.value.toUpperCase() })}
                            error={errors[`${t.id}.pan`]}
                            placeholder="ABCDE1234F"
                          />
                        </div>
                      )}
                      {panRequired && t.type !== "ADT" && (
                        <div className="mt-3">
                          <p className="text-[12px] text-ink-muted mb-2">
                            Parent/guardian details (name &amp; PAN as on PAN card)
                          </p>
                          <div className="grid sm:grid-cols-3 gap-3">
                            <Input
                              label="Guardian first name"
                              value={t.guardian?.firstName ?? ""}
                              onChange={(e) => update(t.id, { guardian: { ...t.guardian, firstName: e.target.value, lastName: t.guardian?.lastName ?? "" } })}
                              error={errors[`${t.id}.gFirst`]}
                            />
                            <Input
                              label="Guardian last name"
                              value={t.guardian?.lastName ?? ""}
                              onChange={(e) => update(t.id, { guardian: { ...t.guardian, firstName: t.guardian?.firstName ?? "", lastName: e.target.value } })}
                              error={errors[`${t.id}.gLast`]}
                            />
                            <Input
                              label="Guardian PAN"
                              value={t.guardian?.pan ?? ""}
                              onChange={(e) => update(t.id, { guardian: { ...t.guardian, firstName: t.guardian?.firstName ?? "", lastName: t.guardian?.lastName ?? "", pan: e.target.value.toUpperCase() } })}
                              error={errors[`${t.id}.gPan`]}
                              placeholder="ABCDE1234F"
                            />
                          </div>
                        </div>
                      )}

                      {/* Passport — when required by FareQuote flags. */}
                      {passportRequired && (
                        <div className="mt-3 grid sm:grid-cols-2 gap-3">
                          <Input
                            label="Passport number"
                            value={t.passport ?? ""}
                            onChange={(e) => update(t.id, { passport: e.target.value.toUpperCase() })}
                            error={errors[`${t.id}.passport`]}
                          />
                          <Input
                            label="Passport expiry"
                            type="date"
                            value={t.passportExpiry ?? ""}
                            onChange={(e) => update(t.id, { passportExpiry: e.target.value })}
                            error={errors[`${t.id}.passportExpiry`]}
                          />
                          {passportFullDetail && (
                            <>
                              <Input
                                label="Passport issue date"
                                type="date"
                                value={t.passportIssueDate ?? ""}
                                onChange={(e) => update(t.id, { passportIssueDate: e.target.value })}
                                error={errors[`${t.id}.passportIssueDate`]}
                              />
                              <Input
                                label="Issuing country (ISO-2)"
                                value={t.passportIssueCountry ?? ""}
                                onChange={(e) => update(t.id, { passportIssueCountry: e.target.value.toUpperCase().slice(0, 2) })}
                                error={errors[`${t.id}.passportIssueCountry`]}
                                placeholder="IN"
                              />
                            </>
                          )}
                        </div>
                      )}
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

              {/* LCC lead-passenger billing address — mandatory on LCC; AirAsia also needs country. */}
              {isLCC && (
                <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                  <h2 className="text-[16px] font-bold text-ink mb-1">Billing address</h2>
                  <p className="text-[12px] text-ink-muted mb-4">
                    Required by low-cost carriers for the lead passenger.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Address"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      error={errors["lead.address"]}
                      placeholder="House / street, area"
                    />
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                      <Input label="Country" value={countryName} onChange={(e) => setCountryName(e.target.value)} />
                      <Input
                        label="Country code (ISO-2)"
                        value={isoCountryCode}
                        onChange={(e) => setIsoCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="IN"
                      />
                    </div>
                  </div>
                </section>
              )}

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
