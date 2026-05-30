"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

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
  businessOwnershipProof?: File;
  declaration: boolean;
};

interface Props {
  onVerificationComplete?: () => void;
  isEditing?: boolean;
}

export default function UnifiedPartnerVerification({ onVerificationComplete, isEditing = false }: Props) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<Partial<PartnerData>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.businessName?.trim()) newErrors.businessName = "Business name is required";
    if (!data.ownerName?.trim()) newErrors.ownerName = "Owner name is required";
    if (!data.businessEmail?.trim()) newErrors.businessEmail = "Business email is required";
    if (!data.businessMobile?.trim()) newErrors.businessMobile = "Mobile number is required";
    if (!data.panNumber?.trim()) newErrors.panNumber = "PAN number is required";
    if (!data.businessAddress?.trim()) newErrors.businessAddress = "Address is required";
    if (!data.city?.trim()) newErrors.city = "City is required";
    if (!data.state?.trim()) newErrors.state = "State is required";
    if (!data.country?.trim()) newErrors.country = "Country is required";
    if (!data.governmentIdProof) newErrors.governmentIdProof = "Government ID proof is required";
    if (!data.businessRegistration) newErrors.businessRegistration = "Business registration is required";
    if (!data.businessOwnershipProof) newErrors.businessOwnershipProof = "Business ownership/authorization proof is required";
    if (!data.declaration) newErrors.declaration = "You must confirm that you are authorized";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof PartnerData, value: any) => {
    setData({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleFileChange = (field: keyof PartnerData, file: File | undefined) => {
    handleChange(field, file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.push({ title: "Please fill all required fields", tone: "warn" });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("businessName", data.businessName || "");
      formData.append("ownerName", data.ownerName || "");
      formData.append("businessEmail", data.businessEmail || "");
      formData.append("businessMobile", data.businessMobile || "");
      formData.append("panNumber", data.panNumber || "");
      formData.append("businessAddress", data.businessAddress || "");
      formData.append("city", data.city || "");
      formData.append("state", data.state || "");
      formData.append("country", data.country || "");
      formData.append("gstNumber", data.gstNumber || "");
      formData.append("website", data.website || "");

      if (data.governmentIdProof) {
        formData.append("governmentIdProof", data.governmentIdProof);
      }
      if (data.businessRegistration) {
        formData.append("businessRegistration", data.businessRegistration);
      }
      if (data.gstCertificate) {
        formData.append("gstCertificate", data.gstCertificate);
      }
      if (data.businessOwnershipProof) {
        formData.append("businessOwnershipProof", data.businessOwnershipProof);
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
      const endpoint = isEditing ? "/api/partner/verify/update" : "/api/partner/verify";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(new URL(endpoint, API_BASE), {
        method,
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit verification");
      }

      toast.push({
        title: isEditing ? "Verification updated successfully" : "Verification submitted successfully",
        tone: "good",
      });

      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.push({
        title: error instanceof Error ? error.message : "Failed to submit verification",
        tone: "critical",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-brand-950">Partner Verification</h1>
          <p className="mt-2 text-lg text-ink-muted">
            {isEditing
              ? "Update your partner information"
              : "Verify your business details to unlock all partner features"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-brand-950 mb-6">Business Information</h2>

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
                  placeholder="Your business name"
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
                  placeholder="Your full name"
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
                  GST Number (Optional)
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
                  Website (Optional)
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
          </div>

          {/* Business Address */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-brand-950 mb-6">Business Address</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-950 mb-2">
                  Street Address *
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
            </div>
          </div>

          {/* Document Uploads */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-brand-950 mb-6">Document Uploads</h2>
            <p className="text-ink-muted mb-6">
              These documents help us verify your business and will be reviewed by our team.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-950 mb-2">
                  Government ID Proof (Aadhar/Passport/DL) *
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
                  Business Registration Certificate / License *
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
                  Business Ownership / Authorization Proof *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange("businessOwnershipProof", e.target.files?.[0])}
                  className={`block w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.businessOwnershipProof ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.businessOwnershipProof && (
                  <p className="mt-1 text-sm text-red-500">{errors.businessOwnershipProof}</p>
                )}
                {data.businessOwnershipProof && (
                  <p className="mt-1 text-sm text-green-600">✓ {data.businessOwnershipProof.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={data.declaration || false}
                onChange={(e) => handleChange("declaration", e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-brand-950">
                I confirm that all the information provided above is accurate and I am authorized to represent this business on the SpaksTrip platform. *
              </span>
            </label>
            {errors.declaration && (
              <p className="mt-2 text-sm text-red-500">{errors.declaration}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>✓ What happens next:</strong> Once you submit this verification, your business details will be reviewed by our team. You'll be able to add hotels, flights, taxis, and other services while we review your information. Your status will be updated via email.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              loading={submitting}
              size="xl"
              variant="accent"
              fullWidth
            >
              {isEditing ? "Update Verification" : "Complete Verification"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
