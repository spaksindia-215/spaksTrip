"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const PORT_OPTIONS = ["Port Blair", "Havelock Island", "Neil Island"];
const DESTINATION_OPTIONS = ["Havelock Island", "Neil Island", "Port Blair", "Long Island"];

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function AndamanCruiseSearchForm() {
  const router = useRouter();
  const toast = useToast();
  const minDate = useMemo(() => getTomorrowDate(), []);

  const [from, setFrom] = useState("Port Blair");
  const [to, setTo] = useState("Havelock Island");
  const [date, setDate] = useState(minDate);
  const [returnDate, setReturnDate] = useState("");
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
  const [travellers, setTravellers] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const destinationChoices = useMemo(
    () => DESTINATION_OPTIONS.filter((port) => port !== from),
    [from],
  );

  const handleSearch = () => {
    if (!from) {
      toast.push({ title: "Select a departure port", tone: "warn" });
      return;
    }
    if (!to) {
      toast.push({ title: "Select a destination island", tone: "warn" });
      return;
    }
    if (from === to) {
      toast.push({ title: "Departure and destination cannot be the same", tone: "warn" });
      return;
    }
    if (!date) {
      toast.push({ title: "Choose your cruise date", tone: "warn" });
      return;
    }
    if (tripType === "round-trip" && !returnDate) {
      toast.push({ title: "Choose your return date", tone: "warn" });
      return;
    }
    if (tripType === "round-trip" && returnDate && returnDate < date) {
      toast.push({ title: "Return date must be after departure date", tone: "warn" });
      return;
    }

    setSubmitting(true);
    const params = new URLSearchParams({
      from,
      to,
      date,
      tripType,
      travellers: String(travellers),
    });
    if (tripType === "round-trip" && returnDate) {
      params.set("returnDate", returnDate);
    }
    router.push(`/cruise/andaman/results?${params.toString()}`);
  };

  return (
    <div className="rounded-[28px] border border-white/12 bg-white/96 p-5 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Search Sailings
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#0E1E3A]">Andaman Cruise Finder</h2>
          <p className="mt-1 text-[13px] leading-6 text-ink-muted">
            Compare popular island routes and pick the sailing that fits your plan.
          </p>
        </div>
        <div className="hidden rounded-2xl bg-blue-50 px-3 py-2 text-right sm:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Instant</p>
          <p className="mt-1 text-[12px] font-semibold text-ink">Ticketing Support</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Departure Port">
          <select
            value={from}
            onChange={(e) => {
              const nextFrom = e.target.value;
              setFrom(nextFrom);
              if (nextFrom === to) {
                const nextDestination = DESTINATION_OPTIONS.find((port) => port !== nextFrom) ?? "";
                setTo(nextDestination);
              }
            }}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            aria-label="Departure Port"
          >
            {PORT_OPTIONS.map((port) => (
              <option key={port} value={port}>
                {port}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Destination Island">
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            aria-label="Destination Island"
          >
            {destinationChoices.map((port) => (
              <option key={port} value={port}>
                {port}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cruise Date">
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            aria-label="Cruise Date"
          />
        </Field>

        <Field label="Number of Travellers">
          <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3">
            <button
              type="button"
              onClick={() => setTravellers((value) => Math.max(1, value - 1))}
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-lg font-semibold text-ink transition-colors hover:bg-slate-50"
              aria-label="Decrease travellers"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <p className="text-[15px] font-bold text-ink">{travellers}</p>
              <p className="text-[11px] text-ink-muted">Passenger{travellers === 1 ? "" : "s"}</p>
            </div>
            <button
              type="button"
              onClick={() => setTravellers((value) => Math.min(9, value + 1))}
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-lg font-semibold text-ink transition-colors hover:bg-slate-50"
              aria-label="Increase travellers"
            >
              +
            </button>
          </div>
        </Field>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Trip Type</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "One Way", value: "one-way" as const },
            { label: "Round Trip", value: "round-trip" as const },
          ].map((option) => {
            const active = tripType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTripType(option.value)}
                className={`inline-flex h-10 items-center rounded-full px-4 text-[13px] font-semibold transition-colors ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {tripType === "round-trip" ? (
          <div className="mt-4">
            <Field label="Return Date" subtle>
              <input
                type="date"
                value={returnDate}
                min={date || minDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                aria-label="Return Date"
              />
            </Field>
          </div>
        ) : null}
      </div>

      <Button
        onClick={handleSearch}
        loading={submitting}
        size="xl"
        variant="accent"
        fullWidth
        className="mt-6 rounded-2xl"
      >
        Search Andaman Cruises
      </Button>
    </div>
  );
}

function Field({
  label,
  subtle,
  children,
}: {
  label: string;
  subtle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={`text-[12px] font-semibold ${subtle ? "text-ink-muted" : "text-ink"}`}>{label}</span>
      {children}
    </label>
  );
}
