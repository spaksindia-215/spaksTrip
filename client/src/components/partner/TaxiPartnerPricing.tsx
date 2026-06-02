"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";

type PricingData = {
  baseFare: number;
  perKmCharge: number;
  driverAllowance?: number;
  nightCharges?: number;
  waitingCharges?: number;
  tollIncluded: boolean;
  parkingIncluded: boolean;
  currency: string;
};

interface Props {
  data: Partial<PricingData>;
  onDataChange: (data: Partial<PricingData>) => void;
}

export default function TaxiPartnerPricing({ data, onDataChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof PricingData, value: any) => {
    onDataChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Pricing Configuration</h2>
        <p className="mt-2 text-ink-muted">
          Set your pricing for different services
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-brand-950 mb-4">Base Pricing</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Base Fare (₹) *
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Minimum charges per trip"
                value={data.baseFare || ""}
                onChange={(e) => handleChange("baseFare", parseFloat(e.target.value))}
                error={!!errors.baseFare}
                helperText={errors.baseFare}
              />
              <p className="text-xs text-ink-muted mt-1">
                Minimum charges even for short trips
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Per KM Charge (₹) *
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Charge per kilometer"
                value={data.perKmCharge || ""}
                onChange={(e) => handleChange("perKmCharge", parseFloat(e.target.value))}
                error={!!errors.perKmCharge}
                helperText={errors.perKmCharge}
              />
              <p className="text-xs text-ink-muted mt-1">
                Charges for every kilometer traveled
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Currency *
              </label>
              <div className="flex items-center gap-2 p-2 border border-slate-300 rounded-md bg-slate-50">
                <span className="font-medium text-brand-950">₹ INR</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-brand-950 mb-4">Additional Charges</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Driver Allowance (₹) <span className="text-ink-muted text-sm font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Daily or hourly allowance"
                value={data.driverAllowance || ""}
                onChange={(e) => handleChange("driverAllowance", parseFloat(e.target.value))}
              />
              <p className="text-xs text-ink-muted mt-1">
                Additional charges for driver services
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Night Charges (₹) <span className="text-ink-muted text-sm font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Charges for night trips"
                value={data.nightCharges || ""}
                onChange={(e) => handleChange("nightCharges", parseFloat(e.target.value))}
              />
              <p className="text-xs text-ink-muted mt-1">
                Additional charges for trips after 10 PM
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Waiting Charges (₹/hour) <span className="text-ink-muted text-sm font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Charges for waiting time"
                value={data.waitingCharges || ""}
                onChange={(e) => handleChange("waitingCharges", parseFloat(e.target.value))}
              />
              <p className="text-xs text-ink-muted mt-1">
                Charges when taxi waits for customer
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-brand-950 mb-4">Inclusions</h3>
          <div className="space-y-4">
            <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={data.tollIncluded || false}
                onChange={(e) => handleChange("tollIncluded", e.target.checked)}
                className="h-4 w-4 text-brand-600 rounded border-slate-300"
              />
              <span className="ml-3 font-medium text-brand-950">
                Toll Charges Included
              </span>
            </label>

            <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={data.parkingIncluded || false}
                onChange={(e) => handleChange("parkingIncluded", e.target.checked)}
                className="h-4 w-4 text-brand-600 rounded border-slate-300"
              />
              <span className="ml-3 font-medium text-brand-950">
                Parking Charges Included
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900">
          <strong>Pricing Tips:</strong> Be competitive but fair. Consider local market rates and your vehicle type. Higher pricing may reduce bookings.
        </p>
      </div>
    </div>
  );
}
