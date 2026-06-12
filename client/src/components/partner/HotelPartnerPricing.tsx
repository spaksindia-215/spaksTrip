"use client";

import { useState } from "react";

type PricingData = {
  basePricePerNight: number;
  taxPercentage: number;
  extraAdultCharge?: number;
  extraChildCharge?: number;
  currency: string;
};

interface Props {
  data: PricingData;
  onDataChange: (data: Partial<PricingData>) => void;
}

export default function HotelPartnerPricing({ data, onDataChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    onDataChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const baseTax = (data.basePricePerNight || 0) * ((data.taxPercentage || 0) / 100);
  const totalWithTax = (data.basePricePerNight || 0) + baseTax;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Pricing Configuration</h2>
        <p className="mt-2 text-ink-muted">
          Set pricing structure for your hotel
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Base Price Per Night (₹) *
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.basePricePerNight || ""}
            onChange={(e) =>
              handleChange("basePricePerNight", parseFloat(e.target.value) || 0)
            }
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.basePricePerNight ? "border-danger-500" : "border-border"
            }`}
            placeholder="0.00"
          />
          {errors.basePricePerNight && (
            <p className="mt-1 text-sm text-danger-500">{errors.basePricePerNight}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Tax Percentage (%) *
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={data.taxPercentage || ""}
            onChange={(e) =>
              handleChange("taxPercentage", parseFloat(e.target.value) || 0)
            }
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.taxPercentage ? "border-danger-500" : "border-border"
            }`}
            placeholder="0.00"
          />
          {errors.taxPercentage && (
            <p className="mt-1 text-sm text-danger-500">{errors.taxPercentage}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Extra Adult Charge (₹)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.extraAdultCharge || ""}
            onChange={(e) =>
              handleChange("extraAdultCharge", parseFloat(e.target.value) || 0)
            }
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Extra Child Charge (₹)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.extraChildCharge || ""}
            onChange={(e) =>
              handleChange("extraChildCharge", parseFloat(e.target.value) || 0)
            }
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Currency
          </label>
          <select
            value={data.currency || "INR"}
            onChange={(e) => handleChange("currency", e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:bg-surface-sunken disabled:cursor-not-allowed"
            disabled
          >
            <option value="INR">INR (₹)</option>
          </select>
          <p className="mt-1 text-xs text-ink-muted">
            Currently only INR is supported
          </p>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Price Summary</h3>
        <div className="grid gap-4 md:grid-cols-3 bg-surface-muted p-4 rounded-lg">
          <div>
            <p className="text-sm text-ink-muted">Base Price</p>
            <p className="text-2xl font-bold text-brand-950">
              ₹{(data.basePricePerNight || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Tax ({data.taxPercentage}%)</p>
            <p className="text-2xl font-bold text-brand-950">
              ₹{baseTax.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Total Per Night</p>
            <p className="text-2xl font-bold text-success-600">
              ₹{totalWithTax.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Additional Charges</h3>
        <div className="space-y-3">
          {data.extraAdultCharge ? (
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-900">Extra Adult Charge</span>
              <span className="font-semibold text-blue-900">
                ₹{(data.extraAdultCharge || 0).toFixed(2)}/night
              </span>
            </div>
          ) : null}
          {data.extraChildCharge ? (
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-900">Extra Child Charge</span>
              <span className="font-semibold text-blue-900">
                ₹{(data.extraChildCharge || 0).toFixed(2)}/night
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pt-4 bg-info-light rounded-lg p-4">
        <p className="text-sm text-brand-950">
          <strong>Note:</strong> These prices are base rates. Final rates can be adjusted based on seasons and demand through rate plans.
        </p>
      </div>
    </div>
  );
}
