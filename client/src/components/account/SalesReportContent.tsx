"use client";

import { useState } from "react";

const NON_AIR_SERVICES = [
  "International Hotels",
  "Domestic Hotels",
  "Transfer",
  "Site Seeing",
  "Insurance",
  "Indian Railway",
  "Mobile Recharge (PrePaid)",
  "Bus",
  "Package",
  "Cruise",
  "Misc.",
  "SMS",
  "Visa",
];

const DATE_INPUT_CLS =
  "rounded-lg border border-border px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default function SalesReportContent() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [includePNR, setIncludePNR] = useState(false);
  const [nonAirChecked, setNonAirChecked] = useState<Record<string, boolean>>({});
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  const toggleNonAir = (s: string) =>
    setNonAirChecked((prev) => ({ ...prev, [s]: !prev[s] }));

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">Sales Report</h2>
      </div>
      <div className="p-5 flex flex-col gap-6">
        {/* Date range */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">From *</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={DATE_INPUT_CLS} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">To *</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={DATE_INPUT_CLS} />
          </div>
        </div>

        {/* Include PNR */}
        <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includePNR}
            onChange={(e) => setIncludePNR(e.target.checked)}
            className="accent-brand-600"
          />
          Include PNR in Excel Sheet (csv)
        </label>

        {/* Air section */}
        <div>
          <h3 className="text-[13px] font-bold text-brand-700 mb-2">Air</h3>
          <div className="flex items-center justify-center rounded-lg border border-border bg-zinc-50 py-8">
            <p className="text-[13px] text-ink-muted">No air sales data for the selected period.</p>
          </div>
        </div>

        {/* Non-Air section */}
        <div>
          <h3 className="text-[13px] font-bold text-brand-700 mb-3">NON-AIR</h3>
          <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-zinc-50 px-4 py-3 mb-5">
            {NON_AIR_SERVICES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!nonAirChecked[s]}
                  onChange={() => toggleNonAir(s)}
                  className="accent-brand-600"
                />
                {s}
              </label>
            ))}
          </div>

          <h4 className="text-[13px] font-semibold text-ink mb-3">Sales Report (Non Air)</h4>
          <p className="text-[12px] font-semibold text-ink-muted mb-2">Period Covered</p>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div>
              <label className="block text-[12px] font-semibold text-ink-muted mb-1">From *</label>
              <input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className={DATE_INPUT_CLS} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink-muted mb-1">To *</label>
              <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className={DATE_INPUT_CLS} />
            </div>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-border bg-zinc-50 py-8">
            <p className="text-[13px] text-ink-muted">No non-air sales data for the selected period.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Get Report
          </button>
        </div>
      </div>
    </div>
  );
}
