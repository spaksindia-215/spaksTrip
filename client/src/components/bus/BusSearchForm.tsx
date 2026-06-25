"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { BUS_LOCATIONS } from "@/lib/busTypes";

type Props = {
  source: string;
  destination: string;
  travelDate: string;
  error?: string;
  onChange: (field: "source" | "destination" | "travelDate", value: string) => void;
  onSwap: () => void;
  onSubmit: () => void;
};

export default function BusSearchForm({
  source,
  destination,
  travelDate,
  error,
  onChange,
  onSwap,
  onSubmit,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-(--shadow-lg) md:p-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_180px]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-soft">From</span>
          <select
            value={source}
            onChange={(event) => onChange("source", event.target.value)}
            className="h-11 rounded-md border border-border bg-white px-3 text-[14px] text-ink outline-none transition-colors focus:border-brand-500"
          >
            {BUS_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onSwap}
          aria-label="Swap source and destination"
          className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 16V4m0 0L3 8m4-4l4 4" />
            <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-soft">To</span>
          <select
            value={destination}
            onChange={(event) => onChange("destination", event.target.value)}
            className="h-11 rounded-md border border-border bg-white px-3 text-[14px] text-ink outline-none transition-colors focus:border-brand-500"
          >
            {BUS_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Travel Date"
          type="date"
          value={travelDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(event) => onChange("travelDate", event.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-[12px] leading-5 text-ink-muted">
          Tickets are booked securely on RedBus. We&apos;ll take you there with your route pre-filled.
        </p>

        <Button
          size="lg"
          variant="accent"
          onClick={onSubmit}
          disabled={!source || !destination || !travelDate}
          className="w-full md:w-auto md:min-w-[200px]"
        >
          Search on RedBus ↗
        </Button>
      </div>

      {error ? <p className="mt-3 text-[13px] font-medium text-danger-600">{error}</p> : null}
    </div>
  );
}
