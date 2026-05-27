"use client";

import { useState } from "react";

const AIR_AIRLINES = [
  "Jet Airways", "Air Deccan", "India Airlines", "JetLite", "Go Air",
  "KingFisher", "Paramount", "MDLR Airlines", "Spicejet", "Indigo",
  "Air India", "Air India Express",
];

type ReportSection = { label: string; items: string[]; summary: string[] };

const SECTIONS: ReportSection[] = [
  { label: "Air", items: AIR_AIRLINES, summary: ["International", "Total Commission", "Total Sales"] },
  { label: "Rail", items: [], summary: ["Commission", "Total Sales"] },
  { label: "Hotel Domestic", items: [], summary: ["Agent Markup", "Total Sales"] },
  { label: "Hotel International", items: [], summary: ["Agent Markup", "Total Sales"] },
  { label: "Insurance", items: [], summary: ["Commission", "Total Sales"] },
  { label: "Bus", items: [], summary: ["Commission", "Total Sales"] },
];

function SectionPanel({ section }: { section: ReportSection }) {
  return (
    <div className="rounded-lg border border-border bg-zinc-50 p-4">
      <h3 className="text-[13px] font-bold text-brand-700 mb-3">{section.label}</h3>
      <div className="flex flex-col gap-1.5">
        {section.items.map((item) => (
          <div key={item} className="flex justify-between text-[12px]">
            <span className="font-medium text-ink">{item}</span>
            <span className="text-ink-muted">₹0</span>
          </div>
        ))}
        {section.items.length > 0 && <div className="border-t border-border my-1.5" />}
        {section.summary.map((row) => (
          <div key={row} className="flex justify-between text-[12px]">
            <span className="font-semibold text-ink">{row}</span>
            <span className="font-semibold text-ink">₹0</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DailySalesContent() {
  const [mode, setMode] = useState<"for-date" | "to">("for-date");
  const [date, setDate] = useState("");

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">Daily Sales Report</h2>
      </div>
      <div className="p-5">
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg bg-zinc-50 border border-border px-4 py-3">
          <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
            <input
              type="radio"
              name="dsr-mode"
              checked={mode === "for-date"}
              onChange={() => setMode("for-date")}
              className="accent-brand-600"
            />
            For Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
            <input
              type="radio"
              name="dsr-mode"
              checked={mode === "to"}
              onChange={() => setMode("to")}
              className="accent-brand-600"
            />
            To
          </label>
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Get Report
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SECTIONS.map((s) => (
            <SectionPanel key={s.label} section={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
