"use client";

import { useState } from "react";

type Props = { type: "payment" | "invoice" };

const TABLE_HEADERS = ["ID", "Date", "Mode", "Details", "Status", "Amount", "Account Type", "View Voucher"];

export default function HistoryContent({ type }: Props) {
  const [period, setPeriod] = useState<"current" | "custom">("custom");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const title = type === "payment" ? "Payment History" : "Invoice History";
  const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
      </div>
      <div className="p-5">
        <div className="mb-4">
          <p className="text-sm font-medium text-ink mb-3">
            {type === "payment"
              ? `Showing payments from ${todayStr} to ${todayStr}`
              : "Please Select Time Period for History:"}
          </p>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
              <input
                type="radio"
                name="period"
                checked={period === "current"}
                onChange={() => setPeriod("current")}
                className="accent-brand-600"
              />
              Current Billing Cycle{type === "payment" ? " Payment" : ""}
            </label>
            <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
              <input
                type="radio"
                name="period"
                checked={period === "custom"}
                onChange={() => setPeriod("custom")}
                className="accent-brand-600"
              />
              Choose Another Period
            </label>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={period === "current"}
              className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={period === "current"}
              className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Show
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#dce2e9]">
                {TABLE_HEADERS.map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-ink whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {TABLE_HEADERS.map((h) => (
                  <td key={h} className="px-3 py-3 text-ink-muted border-t border-border">—</td>
                ))}
              </tr>
              <tr className="bg-[#dce2e9] border-t border-border">
                <td colSpan={TABLE_HEADERS.length} className="px-3 py-2.5 text-right">
                  {type === "payment" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded px-3 py-1.5 text-[12px] font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                      >
                        Cheque / D.D
                      </button>
                      <button
                        type="button"
                        className="rounded px-3 py-1.5 text-[12px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Cash
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="rounded px-3 py-1.5 text-[12px] font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                    >
                      Pay Now
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
