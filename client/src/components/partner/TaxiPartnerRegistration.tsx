"use client";

import { useState } from "react";
import TaxiPartnerInfo from "./TaxiPartnerInfo";
import TaxiPartnerDocuments from "./TaxiPartnerDocuments";
import TaxiPartnerServiceArea from "./TaxiPartnerServiceArea";
import TaxiPartnerPricing from "./TaxiPartnerPricing";
import TaxiPartnerAvailability from "./TaxiPartnerAvailability";
import TaxiPartnerReview from "./TaxiPartnerReview";
import Button from "@/components/ui/Button";

type RegistrationStep = "info" | "documents" | "serviceArea" | "pricing" | "availability" | "review";

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

type DocumentData = {
  vehicleRC?: File;
  commercialPermit?: File;
  insuranceCertificate?: File;
  pollutionCertificate?: File;
  driverLicense?: File;
  vehiclePhotos: File[];
};

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

type AvailabilityData = {
  status: "available" | "unavailable" | "maintenance";
};

export default function TaxiPartnerRegistration() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("info");
  const [taxiData, setTaxiData] = useState<Partial<TaxiData>>({});
  const [documentData, setDocumentData] = useState<Partial<DocumentData>>({});
  const [serviceAreaData, setServiceAreaData] = useState<Partial<ServiceAreaData>>({});
  const [pricingData, setPricingData] = useState<Partial<PricingData>>({});
  const [availabilityData, setAvailabilityData] = useState<Partial<AvailabilityData>>({
    status: "available",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps: RegistrationStep[] = ["info", "documents", "serviceArea", "pricing", "availability", "review"];
  const stepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1]);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1]);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();

      formData.append("taxi", JSON.stringify(taxiData));
      formData.append("documents", JSON.stringify(documentData));
      formData.append("serviceArea", JSON.stringify(serviceAreaData));
      formData.append("pricing", JSON.stringify(pricingData));
      formData.append("availability", JSON.stringify(availabilityData));

      Object.entries(documentData).forEach(([key, file]) => {
        if (file instanceof File) {
          formData.append(`document_${key}`, file);
        }
      });

      if (taxiData.vehicleImages) {
        taxiData.vehicleImages.forEach((file, index) => {
          formData.append(`vehicleImage_${index}`, file);
        });
      }

      const response = await fetch("/api/partner/taxis", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit taxi registration");
      }

      alert("Taxi registered successfully! It will be reviewed by our admin team.");
      window.location.href = "/partner/my-taxis";
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles: Record<RegistrationStep, string> = {
    info: "Vehicle Information",
    documents: "Documents & Verification",
    serviceArea: "Service Area",
    pricing: "Pricing",
    availability: "Availability Status",
    review: "Review & Submit",
  };

  return (
    <div className="min-h-screen bg-surface-muted py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">List Your Taxi</h1>
          <p className="mt-2 text-ink-muted">
            Complete the registration to start listing your vehicle
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    index < stepIndex
                      ? "bg-brand-50 text-brand-700"
                      : index === stepIndex
                        ? "bg-brand-600 text-white"
                        : "bg-surface-sunken text-ink-muted"
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      index < stepIndex ? "bg-brand-600" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm font-medium text-ink-soft">
              Step {stepIndex + 1} of {steps.length}: {stepTitles[currentStep]}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-danger-50 p-4 border border-danger-200">
            <p className="text-sm font-medium text-danger-700">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="rounded-md bg-white p-6 sm:p-8 shadow-card border border-border-soft mb-8">
          {currentStep === "info" && (
            <TaxiPartnerInfo data={taxiData} onDataChange={setTaxiData} />
          )}
          {currentStep === "documents" && (
            <TaxiPartnerDocuments data={documentData} onDataChange={setDocumentData} />
          )}
          {currentStep === "serviceArea" && (
            <TaxiPartnerServiceArea data={serviceAreaData} onDataChange={setServiceAreaData} />
          )}
          {currentStep === "pricing" && (
            <TaxiPartnerPricing data={pricingData} onDataChange={setPricingData} />
          )}
          {currentStep === "availability" && (
            <TaxiPartnerAvailability data={availabilityData} onDataChange={setAvailabilityData} />
          )}
          {currentStep === "review" && (
            <TaxiPartnerReview
              taxiData={taxiData}
              documentData={documentData}
              serviceAreaData={serviceAreaData}
              pricingData={pricingData}
              availabilityData={availabilityData}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            onClick={handlePrev}
            disabled={stepIndex === 0}
            variant="outline"
          >
            Previous
          </Button>
          {currentStep === "review" ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              variant="accent"
            >
              {isSubmitting ? "Submitting..." : "Submit registration"}
            </Button>
          ) : (
            <Button onClick={handleNext} variant="primary">
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
