const BANK_INFO = [
  { label: "Company Name", value: "Spaks Trip" },
  { label: "Address", value: "728, Phase - V, Udyog Vihar, Gurgaon" },
  { label: "City", value: "Badarpur" },
  { label: "Zip Code", value: "110044" },
];

export default function SpakstripBankContent() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">SpaksTrip Bank Details</h2>
      </div>
      <div className="p-5 flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 mt-0.5 text-yellow-600"
            aria-hidden
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-[13px] font-semibold text-yellow-800">
            ALERT — Get Instant Funds in your ledger by Transferring funds via IMPS, NEFT and RTGS
            to our YesBank&apos;s Virtual Account. Account Number starting with <span className="font-black">TBOTEK</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BANK_INFO.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-zinc-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-0.5">
                {item.label}
              </p>
              <p className="text-[14px] font-semibold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
