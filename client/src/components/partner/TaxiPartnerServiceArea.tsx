"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type ServiceAreaData = {
  operatingCity: string;
  operatingState: string;
  operatingCountry: string;
  airportTransfer: boolean;
  localRental: boolean;
  outstationAvailable: boolean;
  oneWayAvailable: boolean;
  roundTripAvailable: boolean;
};

interface Props {
  data: Partial<ServiceAreaData>;
  onDataChange: (data: Partial<ServiceAreaData>) => void;
}

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli",
  "Daman and Diu",
  "Delhi",
  "Lakshadweep",
  "Puducherry",
];

export default function TaxiPartnerServiceArea({ data, onDataChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ServiceAreaData, value: any) => {
    onDataChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Service Area</h2>
        <p className="mt-2 text-ink-muted">
          Define where your taxi operates
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Operating Country *
          </label>
          <Select
            value={data.operatingCountry || ""}
            onChange={(e) => handleChange("operatingCountry", e.target.value)}
          >
            <option value="">Select Country</option>
            <option value="IN">India</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Operating State *
          </label>
          <Select
            value={data.operatingState || ""}
            onChange={(e) => handleChange("operatingState", e.target.value)}
          >
            <option value="">Select State</option>
            {indianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Operating City *
          </label>
          <Input
            type="text"
            placeholder="e.g., Delhi, Mumbai, Bangalore"
            value={data.operatingCity || ""}
            onChange={(e) => handleChange("operatingCity", e.target.value)}
            error={errors.operatingCity}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Service Types</h3>
        <p className="text-sm text-ink-muted mb-4">
          Select the types of services you offer
        </p>

        <div className="space-y-4">
          <label className="flex items-center p-3 border border-border-soft rounded-lg cursor-pointer hover:bg-surface-muted">
            <input
              type="checkbox"
              checked={data.airportTransfer || false}
              onChange={(e) => handleChange("airportTransfer", e.target.checked)}
              className="h-4 w-4 text-brand-600 rounded border-border"
            />
            <div className="ml-3">
              <span className="font-medium text-brand-950">Airport Transfer</span>
              <p className="text-sm text-ink-muted">
                Pick-up and drop to/from airports
              </p>
            </div>
          </label>

          <label className="flex items-center p-3 border border-border-soft rounded-lg cursor-pointer hover:bg-surface-muted">
            <input
              type="checkbox"
              checked={data.localRental || false}
              onChange={(e) => handleChange("localRental", e.target.checked)}
              className="h-4 w-4 text-brand-600 rounded border-border"
            />
            <div className="ml-3">
              <span className="font-medium text-brand-950">Local Rental</span>
              <p className="text-sm text-ink-muted">
                Hourly or full-day rentals within the city
              </p>
            </div>
          </label>

          <label className="flex items-center p-3 border border-border-soft rounded-lg cursor-pointer hover:bg-surface-muted">
            <input
              type="checkbox"
              checked={data.outstationAvailable || false}
              onChange={(e) => handleChange("outstationAvailable", e.target.checked)}
              className="h-4 w-4 text-brand-600 rounded border-border"
            />
            <div className="ml-3">
              <span className="font-medium text-brand-950">Outstation</span>
              <p className="text-sm text-ink-muted">
                Long-distance trips to other cities
              </p>
            </div>
          </label>

          <label className="flex items-center p-3 border border-border-soft rounded-lg cursor-pointer hover:bg-surface-muted">
            <input
              type="checkbox"
              checked={data.oneWayAvailable || false}
              onChange={(e) => handleChange("oneWayAvailable", e.target.checked)}
              className="h-4 w-4 text-brand-600 rounded border-border"
            />
            <div className="ml-3">
              <span className="font-medium text-brand-950">One-Way Trips</span>
              <p className="text-sm text-ink-muted">
                Single-way journeys with no return
              </p>
            </div>
          </label>

          <label className="flex items-center p-3 border border-border-soft rounded-lg cursor-pointer hover:bg-surface-muted">
            <input
              type="checkbox"
              checked={data.roundTripAvailable || false}
              onChange={(e) => handleChange("roundTripAvailable", e.target.checked)}
              className="h-4 w-4 text-brand-600 rounded border-border"
            />
            <div className="ml-3">
              <span className="font-medium text-brand-950">Round Trips</span>
              <p className="text-sm text-ink-muted">
                Journeys with return to the same location
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-success-50 border border-success-200 rounded-lg p-4">
        <p className="text-sm text-success-700">
          <strong>Tip:</strong> Select all the service types you can provide. This helps customers find your taxi for their specific needs.
        </p>
      </div>
    </div>
  );
}
