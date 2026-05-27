"use client";

import { useState } from "react";

const PG_GATEWAYS = [
  "Select", "AMEX", "AmexCUG", "AmexUsingRazorPay", "APICustomer", "Atom",
  "Axis", "Bankonnect", "Beam", "BillDesk", "BillDeskB2B", "CCAvenue",
  "Citrus", "Direcpay", "EazyPayICICI", "EBS", "HDFC", "HDFCCUG",
  "HDFCMaster", "HDFCUPI", "ICICI", "ICICIDirect", "Indifi", "NIBL",
  "OXICASH", "PayPal", "Paytm", "PayU", "Payzippy", "PhonePe",
  "RazorPay", "SBI", "TechProcess", "TicketVala", "YESBank", "ZAAKPAY",
];

const TABLE_HEADERS = [
  "S.No", "Payment Date", "PG Type", "PG Name", "Agency Name",
  "PG Transaction ID", "Updated By", "Updated Date", "Status",
  "TBO Transaction ID", "Amount",
];

const DATE_INPUT_CLS =
  "rounded-lg border border-border px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default function PGFailureContent() {
  const [statusChecked, setStatusChecked] = useState<Record<string, boolean>>({});
  const [gateway, setGateway] = useState("Select");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const toggleStatus = (s: string) =>
    setStatusChecked((prev) => ({ ...prev, [s]: !prev[s] }));

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">PG Failure Queue</h2>
      </div>
      <div className="p-5">
        {/* Filters */}
        <div className="mb-6 rounded-lg border border-border bg-zinc-50 px-4 py-4 flex flex-wrap gap-5 items-end">
          {/* Status checkboxes */}
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-ink-muted">Status</p>
            <div className="flex gap-5">
              {["Failed", "Successful", "Pending"].map((s) => (
                <label key={s} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!statusChecked[s]}
                    onChange={() => toggleStatus(s)}
                    className="accent-brand-600"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* PG dropdown */}
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">Payment Gateway Name</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {PG_GATEWAYS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={DATE_INPUT_CLS} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-ink-muted mb-1">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={DATE_INPUT_CLS} />
          </div>

          <button
            type="button"
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Table */}
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
                <td colSpan={TABLE_HEADERS.length} className="px-3 py-10 text-center text-[13px] text-ink-muted border-t border-border">
                  No records found for the selected filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
