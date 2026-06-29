"use client";

import { useState } from "react";
import LocationPicker from "@/components/ui/LocationPicker";

type HotelData = {
  hotelName: string;
  description: string;
  hotelType: string;
  starRating: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  hotelImages: File[];
  amenities: string[];
  policies: {
    cancellation: string;
    child: string;
    pet: string;
    smoking: string;
  };
};

interface Props {
  data: HotelData;
  onDataChange: (data: Partial<HotelData>) => void;
}

const HOTEL_TYPES = [
  "Hotel",
  "Resort",
  "Villa",
  "Homestay",
  "Apartment",
  "Guest House",
  "Airbnb",
  "Houseboat",
  "Hostel",
];

const AMENITIES = [
  "WiFi",
  "Parking",
  "Restaurant",
  "Swimming Pool",
  "Gym",
  "Spa",
  "Room Service",
  "Airport Transfer",
  "Laundry",
  "Conference Hall",
  "Others",
];

export default function HotelPartnerInfo({ data, onDataChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    onDataChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handlePolicyChange = (policyType: string, value: string) => {
    onDataChange({
      ...data,
      policies: {
        ...data.policies,
        [policyType]: value,
      },
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    const amenities = data.amenities || [];
    const updated = amenities.includes(amenity)
      ? amenities.filter((a) => a !== amenity)
      : [...amenities, amenity];
    handleChange("amenities", updated);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleChange("hotelImages", files);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Hotel Information</h2>
        <p className="mt-2 text-ink-muted">
          Provide details about your hotel property
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Hotel Name *
          </label>
          <input
            type="text"
            value={data.hotelName || ""}
            onChange={(e) => handleChange("hotelName", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.hotelName ? "border-danger-500" : "border-border"
            }`}
            placeholder="Enter your hotel name"
          />
          {errors.hotelName && (
            <p className="mt-1 text-sm text-danger-500">{errors.hotelName}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Hotel Description *
          </label>
          <textarea
            value={data.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.description ? "border-danger-500" : "border-border"
            }`}
            placeholder="Describe your hotel..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger-500">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Hotel Type *
          </label>
          <select
            value={data.hotelType || ""}
            onChange={(e) => handleChange("hotelType", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.hotelType ? "border-danger-500" : "border-border"
            }`}
          >
            <option value="">Select hotel type</option>
            {HOTEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.hotelType && (
            <p className="mt-1 text-sm text-danger-500">{errors.hotelType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Star Rating *
          </label>
          <select
            value={data.starRating || ""}
            onChange={(e) => handleChange("starRating", parseFloat(e.target.value))}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.starRating ? "border-danger-500" : "border-border"
            }`}
          >
            <option value="">Select rating</option>
            {[1, 2, 3, 3.5, 4, 4.5, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating} Star{rating !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
          {errors.starRating && (
            <p className="mt-1 text-sm text-danger-500">{errors.starRating}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Address *
          </label>
          <input
            type="text"
            value={data.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.address ? "border-danger-500" : "border-border"
            }`}
            placeholder="Street address"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-danger-500">{errors.address}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            City *
          </label>
          <input
            type="text"
            value={data.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.city ? "border-danger-500" : "border-border"
            }`}
            placeholder="City"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-danger-500">{errors.city}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            State *
          </label>
          <input
            type="text"
            value={data.state || ""}
            onChange={(e) => handleChange("state", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.state ? "border-danger-500" : "border-border"
            }`}
            placeholder="State"
          />
          {errors.state && (
            <p className="mt-1 text-sm text-danger-500">{errors.state}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Country *
          </label>
          <input
            type="text"
            value={data.country || ""}
            onChange={(e) => handleChange("country", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.country ? "border-danger-500" : "border-border"
            }`}
            placeholder="Country"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-danger-500">{errors.country}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Postal Code *
          </label>
          <input
            type="text"
            value={data.postalCode || ""}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.postalCode ? "border-danger-500" : "border-border"
            }`}
            placeholder="Postal code"
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-danger-500">{errors.postalCode}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Location *
          </label>
          <LocationPicker
            latitude={typeof data.latitude === "number" ? data.latitude : undefined}
            longitude={typeof data.longitude === "number" ? data.longitude : undefined}
            error={errors.latitude || errors.longitude}
            onChange={({ latitude, longitude, address }) =>
              onDataChange({
                latitude,
                longitude,
                // Only overwrite address fields when the geocoder returned them.
                ...(address?.street ? { address: address.street } : {}),
                ...(address?.city ? { city: address.city } : {}),
                ...(address?.state ? { state: address.state } : {}),
                ...(address?.country ? { country: address.country } : {}),
                ...(address?.postalCode ? { postalCode: address.postalCode } : {}),
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Hotel Contact Number *
          </label>
          <input
            type="tel"
            value={data.contactNumber || ""}
            onChange={(e) => handleChange("contactNumber", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.contactNumber ? "border-danger-500" : "border-border"
            }`}
            placeholder="+91 XXXXX XXXXX"
          />
          {errors.contactNumber && (
            <p className="mt-1 text-sm text-danger-500">{errors.contactNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Hotel Email *
          </label>
          <input
            type="email"
            value={data.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.email ? "border-danger-500" : "border-border"
            }`}
            placeholder="hotel@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-danger-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Check-In Time *
          </label>
          <input
            type="time"
            value={data.checkInTime || ""}
            onChange={(e) => handleChange("checkInTime", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.checkInTime ? "border-danger-500" : "border-border"
            }`}
          />
          {errors.checkInTime && (
            <p className="mt-1 text-sm text-danger-500">{errors.checkInTime}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Check-Out Time *
          </label>
          <input
            type="time"
            value={data.checkOutTime || ""}
            onChange={(e) => handleChange("checkOutTime", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.checkOutTime ? "border-danger-500" : "border-border"
            }`}
          />
          {errors.checkOutTime && (
            <p className="mt-1 text-sm text-danger-500">{errors.checkOutTime}</p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-950 mb-4">Hotel Images</h3>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
          {data.hotelImages && data.hotelImages.length > 0 && (
            <p className="mt-2 text-sm text-success-600">
              ✓ {data.hotelImages.length} image(s) selected
            </p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t space-y-4">
        <h3 className="text-lg font-semibold text-brand-950">Amenities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.amenities?.includes(amenity) || false}
                onChange={() => handleAmenityToggle(amenity)}
                className="rounded"
              />
              <span className="text-sm text-brand-950">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t space-y-4">
        <h3 className="text-lg font-semibold text-brand-950">Policies</h3>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Cancellation Policy
          </label>
          <textarea
            value={data.policies?.cancellation || ""}
            onChange={(e) => handlePolicyChange("cancellation", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="Enter cancellation policy details"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Child Policy
          </label>
          <textarea
            value={data.policies?.child || ""}
            onChange={(e) => handlePolicyChange("child", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="Enter child policy details"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Pet Policy
          </label>
          <textarea
            value={data.policies?.pet || ""}
            onChange={(e) => handlePolicyChange("pet", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="Enter pet policy details"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Smoking Policy
          </label>
          <textarea
            value={data.policies?.smoking || ""}
            onChange={(e) => handlePolicyChange("smoking", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="Enter smoking policy details"
          />
        </div>
      </div>
    </div>
  );
}
