"use client";

import { useState } from "react";
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

      const result = await response.json();
      setCurrentStep("review");
    } catch (error) {
      console.error("Error submitting hotel registration:", error);
      alert("Error submitting registration. Please try again.");
    }
  };

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
                    index <= stepIndex
                      ? "bg-brand-600 text-white"
                      : "bg-gray-200 text-gray-600"
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
                      index < stepIndex ? "bg-brand-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
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

        <div className="mt-8 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={stepIndex === 0}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {currentStep !== "review" ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
