"use client";

import { useState } from "react";
import Combobox, { type ComboOption } from "@/components/ui/Combobox";
import Button from "@/components/ui/Button";
import { searchStations } from "@/lib/mock/trains";
import { openIrctcBooking } from "@/lib/irctc";

// Train booking is a hand-off to IRCTC — we don't hold an IRCTC B2B ticketing
// contract, so this form collects the journey for the user's convenience and opens
// IRCTC's booking site in a new tab. (IRCTC's app ignores prefill params; see
// src/lib/irctc.ts.) The From/To station pickers use a bundled station list.

function stationToOption(s: { code: string; name: string; city: string }): ComboOption {
  return { value: s.code, label: s.name, sublabel: `${s.code} · ${s.city}` };
}

const today = new Date().toISOString().slice(0, 10);

export default function TrainSearchForm() {
  const [from, setFrom] = useState<ComboOption | null>(null);
  const [to, setTo] = useState<ComboOption | null>(null);
  const [date, setDate] = useState(today);

  const swap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  const searchFrom = (q: string) => searchStations(q).map(stationToOption);

  const onBook = () => {
    openIrctcBooking({
      fromCode: from?.value,
      toCode: to?.value,
      date,
    });
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-(--shadow-lg)">
      <div className="flex flex-col items-stretch gap-3 md:flex-row">
        <div className="flex-1">
          <Combobox
            label="From Station"
            placeholder="City or station code"
            value={from}
            onChange={setFrom}
            search={searchFrom}
            minQuery={0}
            leading={
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-brand-500">
                <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="9" />
              </svg>
            }
          />
        </div>

        <button
          type="button"
          onClick={swap}
          aria-label="Swap stations"
          className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border border-border bg-surface-muted transition-colors hover:border-brand-400 hover:bg-brand-50 md:mt-5"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 16V4m0 0L3 8m4-4l4 4" />
            <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>

        <div className="flex-1">
          <Combobox
            label="To Station"
            placeholder="City or station code"
            value={to}
            onChange={setTo}
            search={searchFrom}
            minQuery={0}
            leading={
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-accent-500">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
          />
        </div>

        <div className="flex min-w-[150px] flex-col gap-1">
          <label className="text-[12px] font-semibold text-ink-muted">Date of Journey</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-lg border border-border bg-white px-3 text-[14px] text-ink outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-[12px] leading-5 text-ink-muted">
          Tickets are booked securely on IRCTC. We&apos;ll take you there to complete your booking.
        </p>
        <Button variant="accent" size="lg" onClick={onBook} className="w-full shrink-0 sm:w-auto sm:min-w-[200px]">
          Book on IRCTC ↗
        </Button>
      </div>
    </div>
  );
}
