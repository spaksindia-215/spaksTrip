"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";

export type CreditNoteType = "flight" | "hotel" | "car" | "bus" | "insurance" | "transfer";

type FieldConfig = {
  key: string;
  label: string;
  placeholder: string;
  hint?: string;
};

const TITLES: Record<CreditNoteType, string> = {
  flight: "Flight Credit Note",
  hotel: "Hotel Credit Note",
  car: "Car Credit Note",
  bus: "Bus Credit Note",
  insurance: "Insurance Credit Note",
  transfer: "Transfer Credit Note",
};

const GDS_OPTIONS = ["Amadeus", "Worldspan", "Galileo", "Abacus", "AmadeusNDC"];

function getFields(type: CreditNoteType): FieldConfig[] {
  switch (type) {
    case "flight":
      return [
        { key: "airlines", label: "Airline(s)", placeholder: "e.g. AI, 6E, UK", hint: "Separate with commas" },
        { key: "paxName", label: "PAX Name", placeholder: "Passenger full name" },
        { key: "pnr", label: "PNR", placeholder: "e.g. ABCDEF" },
        { key: "ticketNo", label: "Ticket Number", placeholder: "e.g. 098-1234567890" },
      ];
    case "hotel":
      return [
        { key: "paxName", label: "Search By PAX Name(s)", placeholder: "Guest name(s)" },
        { key: "confNo", label: "Confirmation Number", placeholder: "Booking confirmation no." },
      ];
    case "car":
      return [
        { key: "driverName", label: "Driver Name", placeholder: "Driver full name" },
        { key: "confNo", label: "Confirmation Number", placeholder: "Booking confirmation no." },
      ];
    case "bus":
      return [
        { key: "paxName", label: "PAX Name", placeholder: "Passenger full name" },
        { key: "ticketNo", label: "Ticket Number", placeholder: "e.g. BUS-XXXXXXXX" },
      ];
    case "insurance":
      return [
        { key: "paxName", label: "PAX Name", placeholder: "Policy holder name" },
        { key: "policyNo", label: "Policy Number", placeholder: "e.g. POL-XXXXXXXX" },
      ];
    case "transfer":
      return [
        { key: "paxName", label: "Pax Name", placeholder: "Passenger full name" },
        { key: "refNo", label: "Confirmation Number / Ref No", placeholder: "Booking reference" },
      ];
  }
}

type Props = { type: CreditNoteType };

export default function CreditNoteContent({ type }: Props) {
  const [intl, setIntl] = useState(type === "hotel");
  const [domestic, setDomestic] = useState(type === "hotel");
  const [gdsChecked, setGdsChecked] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});

  const fields = getFields(type);
  const showIntlDomestic = type === "flight" || type === "hotel";
  const showGds = type === "flight";

  const update = (key: string, val: string) => setValues((prev) => ({ ...prev, [key]: val }));
  const toggleGds = (g: string) => setGdsChecked((prev) => ({ ...prev, [g]: !prev[g] }));
  const clearAll = () => {
    setValues({});
    setGdsChecked({});
    setIntl(type === "hotel");
    setDomestic(type === "hotel");
  };

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">{TITLES[type]}</h2>
      </div>
      <div className="p-5">
        {showIntlDomestic && (
          <div className="mb-4 flex flex-wrap gap-5 rounded-lg bg-zinc-50 border border-border px-4 py-3">
            <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={intl}
                onChange={(e) => setIntl(e.target.checked)}
                className="accent-brand-600"
              />
              International
            </label>
            <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={domestic}
                onChange={(e) => setDomestic(e.target.checked)}
                className="accent-brand-600"
              />
              Domestic
            </label>
            {showGds &&
              GDS_OPTIONS.map((g) => (
                <label key={g} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!gdsChecked[g]}
                    onChange={() => toggleGds(g)}
                    className="accent-brand-600"
                  />
                  {g}
                </label>
              ))}
          </div>
        )}

        <form className="flex flex-col gap-4 mb-6" onSubmit={(e) => e.preventDefault()}>
          {fields.map((f) => (
            <div key={f.key}>
              <Input
                label={`${f.label} *`}
                value={values[f.key] ?? ""}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
              {f.hint && <p className="mt-0.5 text-[11px] text-ink-muted">{f.hint}</p>}
            </div>
          ))}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-soft hover:bg-zinc-50 transition-colors"
            >
              Clear All
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Show
            </button>
          </div>
        </form>

        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-zinc-50 py-12 text-center">
          <svg
            viewBox="0 0 24 24"
            width={40}
            height={40}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-muted mb-3"
            aria-hidden
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p className="text-sm font-medium text-ink-soft">There is no Credit Note in the Queue</p>
        </div>
      </div>
    </div>
  );
}
