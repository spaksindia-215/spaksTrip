"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import HotelPartnerInfo from "./HotelPartnerInfo";
import HotelPartnerRooms from "./HotelPartnerRooms";
import HotelPartnerRates from "./HotelPartnerRates";
import HotelPartnerInventory from "./HotelPartnerInventory";
import HotelPartnerPricing from "./HotelPartnerPricing";
import HotelPartnerPromotions from "./HotelPartnerPromotions";
import HotelPartnerReview from "./HotelPartnerReview";

type RegistrationStep = "info" | "rooms" | "rates" | "inventory" | "pricing" | "promotions" | "review";


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

type RoomType = {
  id: string;
  name: string;
  description: string;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  roomSize: string;
  roomImages: File[];
  amenities: string[];
};

type RatePlan = {
  id: string;
  roomTypeId: string;
  name: string;
  mealType: string;
  refundable: boolean;
  inclusions: string[];
};

type InventoryData = {
  roomTypeId: string;
  totalRooms: number;
  availableRooms: number;
};

type PricingData = {
  basePricePerNight: number;
  taxPercentage: number;
  extraAdultCharge?: number;
  extraChildCharge?: number;
  currency: string;
};

type PromotionData = {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
};

export default function HotelPartnerRegistration() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("info");
  const [hotelData, setHotelData] = useState<Partial<HotelData>>({});
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [rates, setRates] = useState<RatePlan[]>([]);
  const [inventory, setInventory] = useState<InventoryData[]>([]);
  const [pricing, setPricing] = useState<Partial<PricingData>>({});
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const steps: RegistrationStep[] = ["info", "rooms", "rates", "inventory", "pricing", "promotions", "review"];
  const stepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();

      formData.append("hotel", JSON.stringify(hotelData));
      formData.append("rooms", JSON.stringify(rooms));
      formData.append("rates", JSON.stringify(rates));
      formData.append("inventory", JSON.stringify(inventory));
      formData.append("pricing", JSON.stringify(pricing));
      formData.append("promotions", JSON.stringify(promotions));

      hotelData.hotelImages?.forEach((img) => {
        formData.append("hotelImages", img);
      });

      rooms.forEach((room) => {
        room.roomImages?.forEach((img) => {
          formData.append(`roomImages-${room.id}`, img);
        });
      });

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
      const response = await fetch(new URL("/api/partner/hotels", API_BASE), {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to submit hotel registration");
      }

      await response.json();
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting hotel registration:", error);
      setSubmitError(
        "We couldn't submit your listing. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-md border border-border-soft bg-white p-12 text-center shadow-card">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
              <svg
                className="h-8 w-8 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-brand-950">Listing submitted</h1>
            <p className="mt-3 text-lg text-ink-muted">
              Thanks! Your property has been submitted for review. Our team will verify
              the details and get back to you shortly.
            </p>
            <a
              href="/partner/hotels"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-brand-600 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-700"
            >
              Go to My Hotels
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-brand-950">List Your Hotel</h1>
          <p className="mt-2 text-lg text-ink-muted">
            Complete the steps below to register and list your property
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                    index < stepIndex
                      ? "bg-brand-50 text-brand-700"
                      : index === stepIndex
                        ? "bg-brand-600 text-white"
                        : "bg-surface-sunken text-ink-muted"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="mt-2 text-xs font-medium text-center capitalize">
                  {step === "info" && "Hotel Info"}
                  {step === "rooms" && "Rooms"}
                  {step === "rates" && "Rates"}
                  {step === "inventory" && "Inventory"}
                  {step === "pricing" && "Pricing"}
                  {step === "promotions" && "Promotions"}
                  {step === "review" && "Review"}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-full mt-4 ${
                      index < stepIndex ? "bg-brand-600" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border-soft bg-white p-8 shadow-card">
          {currentStep === "info" && (
            <HotelPartnerInfo
              data={hotelData as HotelData}
              onDataChange={setHotelData}
            />
          )}
          {currentStep === "rooms" && (
            <HotelPartnerRooms
              rooms={rooms}
              onRoomsChange={setRooms}
            />
          )}
          {currentStep === "rates" && (
            <HotelPartnerRates
              rooms={rooms}
              rates={rates}
              onRatesChange={setRates}
            />
          )}
          {currentStep === "inventory" && (
            <HotelPartnerInventory
              rooms={rooms}
              inventory={inventory}
              onInventoryChange={setInventory}
            />
          )}
          {currentStep === "pricing" && (
            <HotelPartnerPricing
              data={pricing as PricingData}
              onDataChange={setPricing}
            />
          )}
          {currentStep === "promotions" && (
            <HotelPartnerPromotions
              promotions={promotions}
              onPromotionsChange={setPromotions}
            />
          )}
          {currentStep === "review" && (
            <HotelPartnerReview
              hotelData={hotelData as HotelData}
              rooms={rooms}
              rates={rates}
              inventory={inventory}
              pricing={pricing as PricingData}
              promotions={promotions}
            />
          )}
        </div>

        {submitError && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            {submitError}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={stepIndex === 0 || isSubmitting}
          >
            Previous
          </Button>
          {currentStep !== "review" ? (
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button variant="accent" onClick={handleSubmit} loading={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit listing"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
