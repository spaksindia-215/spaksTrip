"use client";

import { useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { sleep } from "@/services/delay";

const AIR_AIRLINES = [
  "Air Arabia", "Air Asia", "AirCosta", "Air India", "Air-India Express",
  "AirIndiaExpress CRP Fare", "AirIndiaExpress Dis Inv", "AirIndiaExpress Student",
  "Air Pegasus", "AirPegasus Coupon", "Air Vistara", "AllianceAir", "GoAir",
  "Indigo", "Indigo API2", "Indigo API3", "Indigo API4", "Indigo Coupon",
  "Indigo CRP Fare", "Indigo Marine", "Indigo Student", "INTERNATIONAL",
  "InterSky", "Jet Airways", "JetLite", "SpiceJet", "SpiceJet API1",
  "SpiceJet API2", "SpiceJet API4", "SpiceJet Coupon", "SpiceJet CRP Fare",
  "SpiceJet Dis Inv", "SpiceJet Marine", "StarAir", "TruJet",
];

const HOTEL_SERVICES = ["Domestic Hotels", "International Hotels"];

type MarkupRow = { type: "FIXED" | "PERCENTAGE"; value: string };

const initRows = (keys: string[]): Record<string, MarkupRow> =>
  Object.fromEntries(keys.map((k) => [k, { type: "FIXED", value: "0" }]));

type TabId = "service-charge" | "air-markup" | "hotel-markup" | "eticket";

const TABS: { id: TabId; label: string }[] = [
  { id: "service-charge", label: "Service Charge" },
  { id: "air-markup", label: "Air Markup" },
  { id: "hotel-markup", label: "Hotel Markup" },
  { id: "eticket", label: "E-Ticket & Notifications" },
];

const SELECT_CLS =
  "rounded-lg border border-border bg-white px-2 py-1.5 text-[12px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

function MarkupTable({
  rows,
  setRows,
}: {
  rows: Record<string, MarkupRow>;
  setRows: React.Dispatch<React.SetStateAction<Record<string, MarkupRow>>>;
}) {
  const update = (key: string, field: keyof MarkupRow, val: string) =>
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], [field]: val } }));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-[#dce2e9]">
            <th className="px-4 py-2.5 text-left font-semibold text-ink">Airline / Service</th>
            <th className="px-4 py-2.5 text-left font-semibold text-ink whitespace-nowrap">Type</th>
            <th className="px-4 py-2.5 text-left font-semibold text-ink whitespace-nowrap">Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(rows).map((key, i) => (
            <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
              <td className="px-4 py-2 font-medium text-ink border-t border-border">{key}</td>
              <td className="px-4 py-2 border-t border-border">
                <select
                  value={rows[key].type}
                  onChange={(e) => update(key, "type", e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="FIXED">Fixed</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </td>
              <td className="px-4 py-2 border-t border-border">
                <input
                  type="text"
                  value={rows[key].value}
                  onChange={(e) => update(key, "value", e.target.value)}
                  maxLength={7}
                  className="w-20 rounded-lg border border-border px-2 py-1.5 text-[12px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MarkupContent() {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("service-charge");
  const [serviceFeeMode, setServiceFeeMode] = useState<"INCLUDEINTAX" | "SHOWASSERVICECHARGE">("INCLUDEINTAX");
  const [serviceCharge, setServiceCharge] = useState<Record<string, MarkupRow>>(initRows(AIR_AIRLINES));
  const [airMarkup, setAirMarkup] = useState<Record<string, MarkupRow>>(initRows(AIR_AIRLINES));
  const [hotelMarkup, setHotelMarkup] = useState<Record<string, MarkupRow>>(initRows(HOTEL_SERVICES));
  const [showFare, setShowFare] = useState<"showfare" | "hidefare">("showfare");
  const [showAgentLogo, setShowAgentLogo] = useState(false);
  const [showHotelAd, setShowHotelAd] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSave = async () => {
    setSubmitting(true);
    await sleep(1200);
    toast.push({ title: "Markup settings saved!", description: "Your pricing configuration has been updated.", tone: "success" });
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <h1 className="text-xl font-extrabold text-ink mb-6">Markup Management</h1>

        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "border-b-2 border-brand-600 text-brand-700 bg-brand-50"
                    : "text-ink-soft hover:text-ink hover:bg-zinc-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Service Charge */}
            {tab === "service-charge" && (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[13px] font-bold text-ink mb-3">Service Fee Display</p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                      <input
                        type="radio"
                        name="serviceFee"
                        checked={serviceFeeMode === "INCLUDEINTAX"}
                        onChange={() => setServiceFeeMode("INCLUDEINTAX")}
                        className="accent-brand-600"
                      />
                      Include in Tax
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                      <input
                        type="radio"
                        name="serviceFee"
                        checked={serviceFeeMode === "SHOWASSERVICECHARGE"}
                        onChange={() => setServiceFeeMode("SHOWASSERVICECHARGE")}
                        className="accent-brand-600"
                      />
                      Show as Service Charge
                    </label>
                  </div>
                </div>
                <MarkupTable rows={serviceCharge} setRows={setServiceCharge} />
              </div>
            )}

            {/* Air Markup */}
            {tab === "air-markup" && (
              <MarkupTable rows={airMarkup} setRows={setAirMarkup} />
            )}

            {/* Hotel Markup */}
            {tab === "hotel-markup" && (
              <MarkupTable rows={hotelMarkup} setRows={setHotelMarkup} />
            )}

            {/* E-Ticket & Notifications */}
            {tab === "eticket" && (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[13px] font-bold text-ink mb-3">Fare Display on E-Ticket</p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                      <input
                        type="radio"
                        name="showFare"
                        checked={showFare === "showfare"}
                        onChange={() => setShowFare("showfare")}
                        className="accent-brand-600"
                      />
                      Show Fare
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                      <input
                        type="radio"
                        name="showFare"
                        checked={showFare === "hidefare"}
                        onChange={() => setShowFare("hidefare")}
                        className="accent-brand-600"
                      />
                      Hide Fare
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showAgentLogo}
                      onChange={(e) => setShowAgentLogo(e.target.checked)}
                      className="accent-brand-600"
                    />
                    Show Agent Logo on Hotel Voucher
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showHotelAd}
                      onChange={(e) => setShowHotelAd(e.target.checked)}
                      className="accent-brand-600"
                    />
                    Show Hotel Ad on E-Ticket
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => setShowLogo(e.target.checked)}
                      className="accent-brand-600"
                    />
                    Show Agent Logo on E-Ticket
                  </label>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="primary" size="md" loading={submitting} onClick={onSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
