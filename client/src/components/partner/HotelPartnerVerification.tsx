"use client";

import { ChangeEvent, useState } from "react";

type PartnerData = {
  businessName: string;
  ownerName: string;
  businessEmail: string;
  businessMobile: string;
  panNumber: string;
  businessAddress: string;
  city: string;
  state: string;
  country: string;
  gstNumber?: string;
  website?: string;
  governmentIdProof?: File;
  businessRegistration?: File;
  gstCertificate?: File;
  hotelOwnershipProof?: File;
  declaration: boolean;
};

interface Props {
  data: PartnerData;
  onDataChange: (data: Partial<PartnerData>) => void;
}

export default function HotelPartnerVerification({ data, onDataChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.businessName) newErrors.businessName = "Business name is required";
    if (!data.ownerName) newErrors.ownerName = "Owner name is required";
    if (!data.businessEmail) newErrors.businessEmail = "Business email is required";
    if (!data.businessMobile) newErrors.businessMobile = "Mobile number is required";
    if (!data.panNumber) newErrors.panNumber = "PAN number is required";
    if (!data.businessAddress) newErrors.businessAddress = "Address is required";
    if (!data.city) newErrors.city = "City is required";
    if (!data.state) newErrors.state = "State is required";
    if (!data.country) newErrors.country = "Country is required";
    if (!data.governmentIdProof) newErrors.governmentIdProof = "Government ID proof is required";
    if (!data.businessRegistration) newErrors.businessRegistration = "Business registration is required";
    if (!data.hotelOwnershipProof) newErrors.hotelOwnershipProof = "Hotel ownership proof is required";
    if (!data.declaration) newErrors.declaration = "You must confirm authorization";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof PartnerData, value: any) => {
    onDataChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleFileChange = (field: keyof PartnerData, file: File | undefined) => {
    handleChange(field, file);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Partner Verification</h2>
        <p className="mt-2 text-ink-muted">
          We need to verify your details before you can list properties
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Business / Company Name *
          </label>
          <input
            type="text"
            value={data.businessName || ""}
            onChange={(e) => handleChange("businessName", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.businessName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your business name"
          />
          {errors.businessName && (
            <p className="mt-1 text-sm text-red-500">{errors.businessName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Owner Full Name *
          </label>
          <input
            type="text"
            value={data.ownerName || ""}
            onChange={(e) => handleChange("ownerName", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.ownerName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter owner's full name"
          />
          {errors.ownerName && (
            <p className="mt-1 text-sm text-red-500">{errors.ownerName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Business Email *
          </label>
          <input
            type="email"
            value={data.businessEmail || ""}
            onChange={(e) => handleChange("businessEmail", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.businessEmail ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="business@example.com"
          />
          {errors.businessEmail && (
            <p className="mt-1 text-sm text-red-500">{errors.businessEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Business Mobile Number *
          </label>
          <input
            type="tel"
            value={data.businessMobile || ""}
            onChange={(e) => handleChange("businessMobile", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.businessMobile ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="+91 XXXXX XXXXX"
          />
          {errors.businessMobile && (
            <p className="mt-1 text-sm text-red-500">{errors.businessMobile}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            PAN Number *
          </label>
          <input
            type="text"
            value={data.panNumber || ""}
            onChange={(e) => handleChange("panNumber", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.panNumber ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="XXXXX0000X"
            maxLength={10}
          />
          {errors.panNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.panNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            GST Number
          </label>
          <input
            type="text"
            value={data.gstNumber || ""}
            onChange={(e) => handleChange("gstNumber", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="XXXXX0000X0000"
            maxLength={15}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Business Address *
          </label>
          <input
            type="text"
            value={data.businessAddress || ""}
            onChange={(e) => handleChange("businessAddress", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 ${
              errors.businessAddress ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Street address"
          />
          {errors.businessAddress && (
            <p className="mt-1 text-sm text-red-500">{errors.businessAddress}</p>
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
              errors.city ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="City"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-500">{errors.city}</p>
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
              errors.state ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="State"
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-500">{errors.state}</p>
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
              errors.country ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Country"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-500">{errors.country}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Website
          </label>
          <input
            type="url"
            value={data.website || ""}
            onChange={(e) => handleChange("website", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-semibold text-brand-950">Document Uploads</h3>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Government ID Proof *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange("governmentIdProof", e.target.files?.[0])}
            className={`block w-full px-4 py-2 border rounded-lg focus:outline-none ${
              errors.governmentIdProof ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.governmentIdProof && (
            <p className="mt-1 text-sm text-red-500">{errors.governmentIdProof}</p>
          )}
          {data.governmentIdProof && (
            <p className="mt-1 text-sm text-green-600">✓ {data.governmentIdProof.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Business Registration Certificate *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange("businessRegistration", e.target.files?.[0])}
            className={`block w-full px-4 py-2 border rounded-lg focus:outline-none ${
              errors.businessRegistration ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.businessRegistration && (
            <p className="mt-1 text-sm text-red-500">{errors.businessRegistration}</p>
          )}
          {data.businessRegistration && (
            <p className="mt-1 text-sm text-green-600">✓ {data.businessRegistration.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            GST Certificate (Optional)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange("gstCertificate", e.target.files?.[0])}
            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
          {data.gstCertificate && (
            <p className="mt-1 text-sm text-green-600">✓ {data.gstCertificate.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-950 mb-2">
            Hotel Ownership Proof / Management Authorization *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange("hotelOwnershipProof", e.target.files?.[0])}
            className={`block w-full px-4 py-2 border rounded-lg focus:outline-none ${
              errors.hotelOwnershipProof ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.hotelOwnershipProof && (
            <p className="mt-1 text-sm text-red-500">{errors.hotelOwnershipProof}</p>
          )}
          {data.hotelOwnershipProof && (
            <p className="mt-1 text-sm text-green-600">✓ {data.hotelOwnershipProof.name}</p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={data.declaration || false}
            onChange={(e) => handleChange("declaration", e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-brand-950">
            I confirm that I am authorized to list and manage this property. *
          </span>
        </label>
        {errors.declaration && (
          <p className="mt-1 text-sm text-red-500">{errors.declaration}</p>
        )}
      </div>

      <div className="pt-4 bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Status:</strong> Your registration will be verified and set to "Pending Verification" once submitted.
        </p>
      </div>
    </div>
  );
}
