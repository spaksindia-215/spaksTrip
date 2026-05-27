const GST_INFO = [
  { label: "Company Name", value: "Spaks Trip" },
  { label: "Premise Code", value: "728" },
  { label: "GSTIN", value: "06AACCT6259K1ZZ" },
  { label: "UIN", value: "NA" },
  { label: "PAN", value: "AACCT6259K" },
  { label: "Website", value: "www.spakstrip.com" },
  { label: "TAN", value: "DELT07132G" },
  { label: "Email ID", value: "spakstrip@gmail.com" },
  { label: "Address Line 1", value: "E 387 Badarpur New Delhi" },
  { label: "Address Line 2", value: "Phase - V, Gurgaon" },
  { label: "GST State (Location)", value: "Delhi" },
  { label: "GST State Code", value: "6" },
  { label: "Company Phone", value: "1244998999" },
];

export default function GSTDetailsContent() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">SpaksTrip GST Details</h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GST_INFO.map((item) => (
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
