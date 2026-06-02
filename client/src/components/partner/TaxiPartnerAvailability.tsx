"use client";

import { useState } from "react";

type AvailabilityData = {
  status: "available" | "unavailable" | "maintenance";
};

interface Props {
  data: Partial<AvailabilityData>;
  onDataChange: (data: Partial<AvailabilityData>) => void;
}

export default function TaxiPartnerAvailability({ data, onDataChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (status: "available" | "unavailable" | "maintenance") => {
    onDataChange({ status });
    if (errors.status) {
      setErrors({ ...errors, status: "" });
    }
  };

  const statusOptions: Array<{
    value: "available" | "unavailable" | "maintenance";
    label: string;
    description: string;
    icon: string;
  }> = [
    {
      value: "available",
      label: "Available",
      description: "Your taxi is ready to accept bookings",
      icon: "✓",
    },
    {
      value: "unavailable",
      label: "Unavailable",
      description: "Temporarily not accepting new bookings",
      icon: "✗",
    },
    {
      value: "maintenance",
      label: "Under Maintenance",
      description: "Vehicle is under maintenance, not available",
      icon: "⚙",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Availability Status</h2>
        <p className="mt-2 text-ink-muted">
          Set the current availability status of your taxi
        </p>
      </div>

      <div className="space-y-4">
        {statusOptions.map((option) => (
          <label
            key={option.value}
            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              data.status === option.value
                ? "border-brand-600 bg-brand-50"
                : "border-slate-200 bg-white hover:border-brand-300"
            }`}
          >
            <input
              type="radio"
              name="status"
              value={option.value}
              checked={data.status === option.value}
              onChange={() => handleChange(option.value)}
              className="h-5 w-5 text-brand-600 rounded-full border-slate-300 mt-0.5"
            />
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-brand-950 flex items-center gap-2">
                <span className="text-2xl">{option.icon}</span>
                {option.label}
              </h3>
              <p className="text-sm text-ink-muted mt-1">
                {option.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Available</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✓ Visible in search results</li>
            <li>✓ Customers can book</li>
            <li>✓ Receive booking requests</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">Unavailable</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>✗ Hidden from search</li>
            <li>✗ No bookings</li>
            <li>✓ Can change anytime</li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-2">Under Maintenance</h4>
          <ul className="text-sm text-red-800 space-y-1">
            <li>✗ Completely hidden</li>
            <li>✗ No bookings possible</li>
            <li>⚙ Vehicle under repair</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> You can change the availability status anytime from your partner dashboard. This is just the initial status for your registration.
        </p>
      </div>

      {errors.status && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{errors.status}</p>
        </div>
      )}
    </div>
  );
}
