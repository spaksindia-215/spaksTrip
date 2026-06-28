"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useFlightSearchStore, type FareCategory } from "@/state/flightSearchStore";
import AirportField from "./AirportField";
import PassengerSelector from "./PassengerSelector";
import TripTypeTabs from "./TripTypeTabs";
import { toIsoDate } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

type Props = { variant?: "hero" | "inline" };

type FareCategoryOption = {
  value: FareCategory;
  label: string;
  description: string;
  icon: ReactNode;
};

const FareIconProps = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const FARE_CATEGORIES: FareCategoryOption[] = [
  {
    value: "regular",
    label: "Regular",
    description: "Best mix of value and flexibility",
    icon: (
      <svg {...FareIconProps}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="3" y1="13" x2="21" y2="13" />
      </svg>
    ),
  },
  {
    value: "student",
    label: "Student",
    description: "Extra baggage & student benefits",
    icon: (
      <svg {...FareIconProps}>
        <path d="M22 10 12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5a6 6 0 0 0 12 0v-5" />
      </svg>
    ),
  },
  {
    value: "armed_forces",
    label: "Armed Forces",
    description: "Exclusive offers for forces",
    icon: (
      <svg {...FareIconProps}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    value: "senior_citizen",
    label: "Senior Citizen",
    description: "Special savings for seniors",
    icon: (
      <svg {...FareIconProps}>
        <circle cx="12" cy="7" r="4" />
        <path d="M5 22v-2a7 7 0 0 1 14 0v2" />
      </svg>
    ),
  },
];

export default function FlightSearchForm({ variant = "hero" }: Props) {
  const router = useRouter();
  const toast = useToast();

  const {
    tripType,
    legs,
    returnDate,
    cabin,
    pax,
    preferredStops,
    fareCategory,
    setTripType,
    setLeg,
    addLeg,
    removeLeg,
    swapLeg,
    setReturnDate,
    setCabin,
    setPax,
    setPreferredStops,
    setFareCategory,
    pushRecent,
  } = useFlightSearchStore();

  const [submitting, setSubmitting] = useState(false);

  const primaryLeg = legs[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const departureDate = primaryLeg.date ? new Date(primaryLeg.date) : null;
  const returnDateMin = departureDate
    ? new Date(departureDate.getTime() + 24 * 60 * 60 * 1000)
    : today;

  const onSearch = () => {
    if (!primaryLeg.from || !primaryLeg.to) {
      toast.push({ title: "Add origin and destination", tone: "warn" });
      return;
    }
    if (primaryLeg.from.code === primaryLeg.to.code) {
      toast.push({ title: "Origin and destination can't be the same", tone: "warn" });
      return;
    }
    if (!primaryLeg.date) {
      toast.push({ title: "Pick a departure date", tone: "warn" });
      return;
    }
    if (tripType === "ROUND") {
      if (!returnDate) {
        toast.push({ title: "Pick a return date", tone: "warn" });
        return;
      }
      if (departureDate && new Date(returnDate) <= departureDate) {
        toast.push({ title: "Return must be after departure", tone: "warn" });
        return;
      }
    }

    setSubmitting(true);
    const params = new URLSearchParams({
      from: primaryLeg.from.code,
      to: primaryLeg.to.code,
      depart: primaryLeg.date,
      cabin,
      adults: String(pax.adults),
      children: String(pax.children),
      infants: String(pax.infants),
      trip: tripType,
      direct: preferredStops.length === 1 && preferredStops[0] === 0 ? "1" : "0",
      fareCategory,
    });
    if (preferredStops.length > 0) params.set("stops", preferredStops.join(","));
    if (tripType === "ROUND" && returnDate) params.set("return", returnDate);
    if (tripType === "MULTI" && legs[1]?.from && legs[1]?.to && legs[1]?.date) {
      params.set("from2", legs[1].from.code);
      params.set("to2", legs[1].to.code);
      params.set("depart2", legs[1].date);
    }

    pushRecent({
      id: `${primaryLeg.from.code}-${primaryLeg.to.code}-${primaryLeg.date}`,
      label: `${primaryLeg.from.city} → ${primaryLeg.to.city}`,
      when: new Date().toISOString(),
      from: primaryLeg.from.code,
      to: primaryLeg.to.code,
      date: primaryLeg.date,
    });

    router.push(`/flight/results?${params.toString()}`);
  };

  const isHero = variant === "hero";

  return (
    <div
      className={
        isHero
          ? "rounded-2xl bg-white p-4 sm:p-5 md:p-6 shadow-(--shadow-lg)"
          : "rounded-xl bg-white p-4 shadow-(--shadow-sm) border border-border-soft"
      }
    >
      {/* Row 1: Trip type + Stops filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TripTypeTabs value={tripType} onChange={setTripType} />
        <div className="flex items-center gap-1.5">
          {([0, 1, 2] as const).map((s) => {
            const active = preferredStops.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  const cur = new Set(preferredStops);
                  if (cur.has(s)) cur.delete(s); else cur.add(s);
                  setPreferredStops(Array.from(cur) as (0 | 1 | 2)[]);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-border bg-white text-ink-soft hover:border-brand-300 hover:text-ink",
                )}
              >
                {s === 0 ? "Non-stop" : s === 1 ? "1 Stop" : "2+ Stops"}
              </button>
            );
          })}
        </div>
      </div>

      {tripType !== "MULTI" ? (
        <div className="mt-4 grid gap-2 grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_1fr] lg:grid-cols-[1fr_auto_1fr_1.5fr_1fr]">
          <AirportField
            label="From"
            value={primaryLeg.from}
            onChange={(a) => setLeg(0, { from: a })}
          />
          <button
            type="button"
            aria-label="Swap origin and destination"
            onClick={() => swapLeg(0)}
            className="hidden md:grid self-end h-12 w-11 place-items-center rounded-md border border-border bg-white text-ink-soft hover:border-brand-500 hover:text-brand-600 transition-colors"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="16 3 21 8 16 13" />
              <line x1="21" y1="8" x2="4" y2="8" />
              <polyline points="8 21 3 16 8 11" />
              <line x1="3" y1="16" x2="20" y2="16" />
            </svg>
          </button>
          <AirportField
            label="To"
            value={primaryLeg.to}
            onChange={(a) => setLeg(0, { to: a })}
          />
          <div className="md:hidden flex items-end justify-center py-2">
            <button
              type="button"
              aria-label="Swap origin and destination"
              onClick={() => swapLeg(0)}
              className="grid h-11 w-11 place-items-center rounded-md border border-border bg-white text-ink-soft hover:border-brand-500 hover:text-brand-600 transition-colors"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="16 3 21 8 16 13" />
                <line x1="21" y1="8" x2="4" y2="8" />
                <polyline points="8 21 3 16 8 11" />
                <line x1="3" y1="16" x2="20" y2="16" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-ink-muted">
              {tripType === "ROUND" ? "Depart — Return" : "Departure"}
            </span>
            <div className={tripType === "ROUND" ? "grid gap-2 sm:grid-cols-2" : ""}>
              <DateRangePicker
                mode="single"
                value={{ from: departureDate, to: null }}
                minDate={today}
                onChange={(v) => {
                  const nextDeparture = v.from ? toIsoDate(v.from) : null;
                  setLeg(0, { date: nextDeparture });
                  if (returnDate && nextDeparture && new Date(returnDate) <= new Date(nextDeparture)) {
                    setReturnDate(null);
                  }
                }}
                labelFrom="Departure"
                placeholderFrom="Pick date"
              />
              {tripType === "ROUND" && (
                <DateRangePicker
                  mode="single"
                  value={{ from: returnDate ? new Date(returnDate) : null, to: null }}
                  minDate={returnDateMin}
                  onChange={(v) => setReturnDate(v.from ? toIsoDate(v.from) : null)}
                  labelFrom="Return"
                  placeholderFrom="Pick date"
                />
              )}
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <PassengerSelector
              pax={pax}
              cabin={cabin}
              onPaxChange={setPax}
              onCabinChange={setCabin}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {legs.map((leg, i) => (
            <div key={i}>
              <div className="grid gap-2 grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_auto]">
                <AirportField
                  label={`From (${i + 1})`}
                  value={leg.from}
                  onChange={(a) => setLeg(i, { from: a })}
                />
                <button
                  type="button"
                  aria-label="Swap"
                  onClick={() => swapLeg(i)}
                  className="hidden md:grid self-end h-11 w-11 place-items-center rounded-full border border-border bg-white text-ink-soft hover:border-brand-500 hover:text-brand-600"
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                    <polyline points="16 3 21 8 16 13" />
                    <line x1="21" y1="8" x2="4" y2="8" />
                    <polyline points="8 21 3 16 8 11" />
                    <line x1="3" y1="16" x2="20" y2="16" />
                  </svg>
                </button>
                <AirportField
                  label={`To (${i + 1})`}
                  value={leg.to}
                  onChange={(a) => setLeg(i, { to: a })}
                />
                <div className="flex flex-col gap-1 md:row-span-1">
                  <span className="text-[12px] font-medium text-ink-muted">Departure</span>
                  <DateRangePicker
                    mode="single"
                    value={{ from: leg.date ? new Date(leg.date) : null, to: null }}
                    onChange={(v) => setLeg(i, { date: v.from ? toIsoDate(v.from) : null })}
                    labelFrom="Departure"
                    placeholderFrom="Pick date"
                  />
                </div>
                <div className="flex items-end gap-2">
                  {legs.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeLeg(i)}
                      aria-label="Remove leg"
                      className="h-11 px-3 rounded-md border border-border text-ink-soft hover:bg-danger-50 hover:text-danger-600"
                    >
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-2 14H7L5 6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="md:hidden flex items-end justify-center py-2">
                <button
                  type="button"
                  aria-label="Swap"
                  onClick={() => swapLeg(i)}
                  className="grid h-11 w-11 place-items-center rounded-md border border-border bg-white text-ink-soft hover:border-brand-500 hover:text-brand-600"
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                    <polyline points="16 3 21 8 16 13" />
                    <line x1="21" y1="8" x2="4" y2="8" />
                    <polyline points="8 21 3 16 8 11" />
                    <line x1="3" y1="16" x2="20" y2="16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLeg}
              disabled={legs.length >= 5}
              leading={
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
                  <line x1={12} y1={5} x2={12} y2={19} />
                  <line x1={5} y1={12} x2={19} y2={12} />
                </svg>
              }
            >
              Add another flight
            </Button>
            <PassengerSelector
              pax={pax}
              cabin={cabin}
              onPaxChange={setPax}
              onCabinChange={setCabin}
            />
          </div>
        </div>
      )}

      {/* Row 3: Fare type cards */}
      <div className="mt-4">
        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide">
          Fare Type
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {FARE_CATEGORIES.map((cat) => {
            const active = fareCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFareCategory(cat.value)}
                aria-pressed={active}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg border py-1.5 px-2.5 text-left transition-colors",
                  active
                    ? "border-brand-500 bg-brand-50/40"
                    : "border-border-soft bg-white hover:border-brand-300",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                    active ? "bg-brand-500 text-white" : "bg-surface-muted text-ink-muted",
                  )}
                  aria-hidden
                >
                  {cat.icon}
                </span>
                <div className="min-w-0 pr-4">
                  <div className="text-[12px] font-semibold text-ink leading-tight">
                    {cat.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-muted leading-snug">
                    {cat.description}
                  </div>
                </div>
                <span
                  className={cn(
                    "absolute top-2 right-2 grid h-4 w-4 place-items-center rounded-full border transition-colors",
                    active
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-border bg-white",
                  )}
                  aria-hidden
                >
                  {active && (
                    <svg
                      viewBox="0 0 24 24"
                      width={9}
                      height={9}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PopularRoutes />
        <Button
          onClick={onSearch}
          loading={submitting}
          size="xl"
          variant="accent"
          fullWidth
          className="sm:min-w-45 sm:w-auto"
          leading={
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        >
          Search Flights
        </Button>
      </div>
    </div>
  );
}

const POPULAR: Array<{ from: string; to: string; label: string }> = [
  { from: "DEL", to: "BOM", label: "Delhi → Mumbai" },
  { from: "BLR", to: "GOI", label: "Bengaluru → Goa" },
  { from: "BOM", to: "DXB", label: "Mumbai → Dubai" },
  { from: "DEL", to: "LHR", label: "Delhi → London" },
];

function PopularRoutes() {
  const { setLeg } = useFlightSearchStore();
  return (
    <div className="hidden md:flex items-center gap-2 overflow-hidden">
      <span className="text-[12px] font-medium text-ink-muted">Popular:</span>
      <div className="flex items-center gap-2 flex-wrap">
        {POPULAR.map((r) => (
          <button
            key={`${r.from}-${r.to}`}
            type="button"
            onClick={() => {
              import("@/lib/mock/airports").then(({ getAirport }) => {
                setLeg(0, { from: getAirport(r.from), to: getAirport(r.to) });
              });
            }}
            className="text-[12px] font-medium text-brand-700 hover:text-brand-800 hover:underline"
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
