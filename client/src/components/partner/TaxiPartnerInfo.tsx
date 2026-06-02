"use client";

import { ChangeEvent, useState } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";

type TaxiData = {
  taxiName: string;
  vehicleType: string;
  registrationNumber: string;
  driverName: string;
  driverMobileNumber: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  seatingCapacity: number;
  luggageCapacity: number;
  fuelType: string;
  acAvailable: boolean;
  vehicleDescription: string;
  vehicleImages: File[];
};

interface Props {
  data: Partial<TaxiData>;
  onDataChange: (data: Partial<TaxiData>) => void;
}

export default function TaxiPartnerInfo({ data, onDataChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof TaxiData, value: any) => {
    onDataChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      handleChange("vehicleImages", files);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Vehicle Information</h2>
        <p className="mt-2 text-ink-muted">
          Provide details about your vehicle
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Taxi Name *
          </label>
          <Input
            type="text"
            placeholder="e.g., My Premium Cab"
            value={data.taxiName || ""}
            onChange={(e) => handleChange("taxiName", e.target.value)}
            error={!!errors.taxiName}
            helperText={errors.taxiName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Vehicle Type *
          </label>
          <Select
            value={data.vehicleType || ""}
            onChange={(e) => handleChange("vehicleType", e.target.value)}
          >
            <option value="">Select Vehicle Type</option>
            <option value="hatchback">Hatchback</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="luxury">Luxury</option>
            <option value="tempoTraveller">Tempo Traveller</option>
            <option value="miniBus">Mini Bus</option>
            <option value="bus">Bus</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Registration Number *
          </label>
          <Input
            type="text"
            placeholder="e.g., DL-01-AB-1234"
            value={data.registrationNumber || ""}
            onChange={(e) => handleChange("registrationNumber", e.target.value)}
            error={!!errors.registrationNumber}
            helperText={errors.registrationNumber}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Driver Name *
          </label>
          <Input
            type="text"
            placeholder="Full name of driver"
            value={data.driverName || ""}
            onChange={(e) => handleChange("driverName", e.target.value)}
            error={!!errors.driverName}
            helperText={errors.driverName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Driver Mobile Number *
          </label>
          <Input
            type="tel"
            placeholder="10-digit mobile number"
            value={data.driverMobileNumber || ""}
            onChange={(e) => handleChange("driverMobileNumber", e.target.value)}
            error={!!errors.driverMobileNumber}
            helperText={errors.driverMobileNumber}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Vehicle Brand *
          </label>
          <Input
            type="text"
            placeholder="e.g., Honda, Toyota, Mahindra"
            value={data.vehicleBrand || ""}
            onChange={(e) => handleChange("vehicleBrand", e.target.value)}
            error={!!errors.vehicleBrand}
            helperText={errors.vehicleBrand}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Vehicle Model *
          </label>
          <Input
            type="text"
            placeholder="e.g., City, Innova, XUV"
            value={data.vehicleModel || ""}
            onChange={(e) => handleChange("vehicleModel", e.target.value)}
            error={!!errors.vehicleModel}
            helperText={errors.vehicleModel}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Vehicle Year *
          </label>
          <Select
            value={String(data.vehicleYear || "")}
            onChange={(e) => handleChange("vehicleYear", parseInt(e.target.value))}
          >
            <option value="">Select Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Seating Capacity *
          </label>
          <Input
            type="number"
            min="2"
            max="50"
            placeholder="Number of seats"
            value={data.seatingCapacity || ""}
            onChange={(e) => handleChange("seatingCapacity", parseInt(e.target.value))}
            error={!!errors.seatingCapacity}
            helperText={errors.seatingCapacity}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Luggage Capacity *
          </label>
          <Input
            type="number"
            min="0"
            placeholder="Luggage capacity in kg"
            value={data.luggageCapacity || ""}
            onChange={(e) => handleChange("luggageCapacity", parseInt(e.target.value))}
            error={!!errors.luggageCapacity}
            helperText={errors.luggageCapacity}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Fuel Type *
          </label>
          <Select
            value={data.fuelType || ""}
            onChange={(e) => handleChange("fuelType", e.target.value)}
          >
            <option value="">Select Fuel Type</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="cng">CNG</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            AC Available? *
          </label>
          <Select
            value={String(data.acAvailable || "")}
            onChange={(e) => handleChange("acAvailable", e.target.value === "true")}
          >
            <option value="">Select Option</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-950 mb-2">
          Vehicle Description *
        </label>
        <Textarea
          placeholder="Describe your vehicle, its condition, features, etc."
          value={data.vehicleDescription || ""}
          onChange={(e) => handleChange("vehicleDescription", e.target.value)}
          rows={5}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-950 mb-2">
          Vehicle Images *
        </label>
        <p className="text-sm text-ink-muted mb-3">
          Upload 3-5 clear photos of your vehicle (exterior and interior)
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-100 file:text-brand-700 hover:file:bg-brand-200"
        />
        {data.vehicleImages && data.vehicleImages.length > 0 && (
          <p className="mt-2 text-sm text-green-600">
            {data.vehicleImages.length} image(s) selected
          </p>
        )}
      </div>
    </div>
  );
}
