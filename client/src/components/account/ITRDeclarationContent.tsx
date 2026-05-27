"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { sleep } from "@/services/delay";

const FY_YEARS = ["2018-19", "2019-20"];

type YearState = { itrFiled: string; ackNo: string; dateOfFiling: string };

const SELECT_CLS =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

const initialYearData = (): Record<string, YearState> =>
  Object.fromEntries(FY_YEARS.map((y) => [y, { itrFiled: "", ackNo: "", dateOfFiling: "" }]));

export default function ITRDeclarationContent() {
  const toast = useToast();
  const [companyName, setCompanyName] = useState("spaksindia business solutions private limited");
  const [contactName, setContactName] = useState("siddartha kumar");
  const [pan, setPan] = useState("AAVCS3082N");
  const [contactNo, setContactNo] = useState("9650474766");
  const [email, setEmail] = useState("citywala1959@gmail.com");
  const [yearData, setYearData] = useState<Record<string, YearState>>(initialYearData);
  const [submitting, setSubmitting] = useState(false);

  const updateYear = (year: string, key: keyof YearState, val: string) =>
    setYearData((prev) => ({ ...prev, [year]: { ...prev[year], [key]: val } }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await sleep(1200);
    toast.push({ title: "ITR Declaration saved!", description: "Your declaration details have been updated.", tone: "success" });
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">Agency ITR Declaration</h2>
      </div>
      <form onSubmit={onSubmit} className="p-5 flex flex-col gap-6">
        {/* Company contact info */}
        <div className="flex flex-col gap-4">
          <Input
            label="Company Legal Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder=""
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Name *"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder=""
            />
            <Input
              label="PAN *"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              placeholder=""
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Number *"
              type="tel"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              placeholder=""
            />
            <Input
              label="Email ID *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=""
            />
          </div>
        </div>

        {/* Per financial year */}
        {FY_YEARS.map((year) => (
          <div key={year} className="rounded-lg border border-border p-4">
            <h3 className="text-[13px] font-bold text-ink mb-4">
              Declaration for Financial Year {year}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-ink">
                  Please confirm, if ITR has been filed *
                </label>
                <select
                  value={yearData[year].itrFiled}
                  onChange={(e) => updateYear(year, "itrFiled", e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">--Select--</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="NA">Not applicable</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Acknowledgement No *"
                  value={yearData[year].ackNo}
                  onChange={(e) => updateYear(year, "ackNo", e.target.value)}
                  placeholder=""
                />
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-ink">
                    Date of Filing *
                  </label>
                  <input
                    type="date"
                    value={yearData[year].dateOfFiling}
                    onChange={(e) => updateYear(year, "dateOfFiling", e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            Save Declaration
          </Button>
        </div>
      </form>
    </div>
  );
}
