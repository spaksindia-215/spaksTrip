"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import ErrorState from "@/components/ui/ErrorState";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { taxiPackagesClient } from "@/lib/taxiPackagesClient";
import { formatINR } from "@/lib/format";
import type { TaxiPackage, PackageVehiclePricing, PackageAvailability } from "@/types/taxiPackages";

interface FormData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  age?: number;
  address1: string;
  address2?: string;
  state: string;
  city: string;
  zipCode: string;
  additionalNotes?: string;
  passengers: number;
  children: number;
  travelDate: string;
  selectedVehicleId: string;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const destinationSlug = params.destinationSlug as string;
  const packageSlug = params.packageSlug as string;

  // Read pre-filled values from query params set by the detail page
  const [searchParams] = typeof window !== "undefined"
    ? [new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")]
    : [new URLSearchParams()];

  const [pkg, setPkg] = useState<TaxiPackage | null>(null);
  const [vehicles, setVehicles] = useState<PackageVehiclePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const getQp = (key: string, fallback = "") => {
    if (typeof window === "undefined") return fallback;
    return new URLSearchParams(window.location.search).get(key) ?? fallback;
  };

  const [form, setForm] = useState<FormData>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    age: undefined,
    address1: "",
    address2: "",
    state: "",
    city: "",
    zipCode: "",
    additionalNotes: "",
    passengers: 1,
    children: 0,
    travelDate: "",
    selectedVehicleId: "",
  });

  useEffect(() => {
    // Pre-fill from query params on first mount
    const travelDate = getQp("travelDate");
    const vehicleId = getQp("vehicleId");
    const passengers = Number(getQp("passengers", "1")) || 1;
    const children = Number(getQp("children", "0")) || 0;

    setForm((prev) => ({
      ...prev,
      travelDate,
      selectedVehicleId: vehicleId,
      passengers,
      children,
    }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const pkgData = await taxiPackagesClient.getPackageBySlug(destinationSlug, packageSlug);
        setPkg(pkgData);

        const vehicleData = await taxiPackagesClient.getVehicles(pkgData.id);
        setVehicles(vehicleData);

        // Only set default vehicle if not already pre-filled from query param
        setForm((prev) => ({
          ...prev,
          selectedVehicleId: prev.selectedVehicleId || (vehicleData[0]?.id ?? ""),
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [destinationSlug, packageSlug]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "passengers" || name === "children" || name === "age" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!pkg || !form.selectedVehicleId) {
      toast.push({ title: "Please select a vehicle", tone: "warn" });
      return;
    }

    const selectedVehicle = vehicles.find((v) => v.id === form.selectedVehicleId);
    if (!selectedVehicle) {
      toast.push({ title: "Invalid vehicle selection", tone: "warn" });
      return;
    }

    setSubmitting(true);

    try {
      const vehicleAmount = selectedVehicle.totalPrice;
      const bookingAmount = vehicleAmount + Math.round(vehicleAmount * 0.05);

      const booking = await taxiPackagesClient.createBooking({
        packageId: pkg.id,
        vehicleId: form.selectedVehicleId,
        travelDate: form.travelDate,
        passengers: form.passengers,
        children: form.children,
        amount: bookingAmount,
        customerDetails: {
          email: form.email,
          phone: form.phone,
          firstName: form.firstName,
          lastName: form.lastName,
          age: form.age,
          address1: form.address1,
          address2: form.address2,
          state: form.state,
          city: form.city,
          zipCode: form.zipCode,
          additionalNotes: form.additionalNotes,
        },
      });

      toast.push({
        title: "Booking confirmed!",
        description: `Your booking ID is ${booking.id}`,
        tone: "success",
      });

      setBookingSuccess(booking.id);
    } catch (err) {
      toast.push({
        title: "Booking failed",
        description: err instanceof Error ? err.message : "Please try again",
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === form.selectedVehicleId);
  const totalAmount = selectedVehicle?.totalPrice ?? Number(getQp("amount", "0"));
  const gst = Math.round(totalAmount * 0.05);
  const amountPayable = totalAmount + gst;

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-white text-[#0E1E3A]">
        <Header />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-green-700">Booking Confirmed!</h1>
          <p className="mt-2 text-gray-600">Your booking has been received.</p>
          <p className="mt-1 text-sm text-gray-500">Booking ID: <span className="font-mono font-bold">{bookingSuccess}</span></p>
          <p className="mt-4 text-sm text-gray-500">
            Our team will contact you at the provided email/phone to confirm pickup details.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="/my-bookings" className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
              My Bookings
            </a>
            <a href="/taxi-package" className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#0E1E3A] hover:bg-gray-50">
              Browse More Packages
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#0E1E3A]">
        <Header />
        <div className="flex justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-white text-[#0E1E3A]">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <ErrorState message={error || "Package not found"} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />

      <main className="bg-gray-50 py-8 md:py-12">
        <div className="mx-auto max-w-5xl px-4">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-gray-500">
            <a href="/taxi-package" className="hover:text-orange-600">Taxi Packages</a>
            {" / "}
            <a href={`/taxi-packages/${destinationSlug}`} className="capitalize hover:text-orange-600">
              {destinationSlug.replace(/-/g, " ")}
            </a>
            {" / "}
            <a href={`/taxi-packages/${destinationSlug}/${packageSlug}`} className="hover:text-orange-600">
              {pkg.title}
            </a>
            {" / "}
            <span className="text-gray-700">Booking</span>
          </div>

          <div className="mb-6 rounded-xl border-l-4 border-orange-500 bg-white px-5 py-4 shadow-sm">
            <h1 className="text-xl font-extrabold">Taxi Tour Booking</h1>
            <p className="mt-0.5 text-sm text-gray-500">Secure your spot — complete the form below.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h2 className="mb-4 text-xl font-bold">Contact Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="email"
                    name="email"
                    label="Email"
                    value={form.email}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    type="tel"
                    name="phone"
                    label="Phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Traveller Information */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h2 className="mb-4 text-xl font-bold">Traveller Information</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    type="text"
                    name="firstName"
                    label="First Name"
                    value={form.firstName}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    type="text"
                    name="lastName"
                    label="Last Name"
                    value={form.lastName}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    type="number"
                    name="age"
                    label="Age"
                    value={form.age || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h2 className="mb-4 text-xl font-bold">Address</h2>
                <div className="space-y-4">
                  <Input
                    type="text"
                    name="address1"
                    label="Address Line 1"
                    value={form.address1}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    type="text"
                    name="address2"
                    label="Address Line 2"
                    value={form.address2}
                    onChange={handleInputChange}
                  />
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      type="text"
                      name="state"
                      label="State"
                      value={form.state}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      type="text"
                      name="city"
                      label="City"
                      value={form.city}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      type="text"
                      name="zipCode"
                      label="Zip Code"
                      value={form.zipCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Travel Details */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h2 className="mb-4 text-xl font-bold">Travel Details</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    type="date"
                    name="travelDate"
                    label="Travel Date"
                    value={form.travelDate}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    type="number"
                    name="passengers"
                    label="Adults"
                    value={form.passengers}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                  <Input
                    type="number"
                    name="children"
                    label="Children (2-12 yrs)"
                    value={form.children}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h2 className="mb-4 text-xl font-bold">Select Vehicle</h2>
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <label key={vehicle.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="selectedVehicleId"
                        value={vehicle.id}
                        checked={form.selectedVehicleId === vehicle.id}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div className="flex-grow">
                        <div className="font-bold">{vehicle.vehicleName}</div>
                        <div className="text-sm text-gray-600">
                          {vehicle.seatingCapacity} seats • {vehicle.amenities.join(", ")}
                        </div>
                      </div>
                      <div className="font-bold text-orange-600">{formatINR(vehicle.totalPrice)}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h2 className="mb-4 text-xl font-bold">Additional Notes</h2>
                <textarea
                  name="additionalNotes"
                  placeholder="Any special requirements or preferences?"
                  value={form.additionalNotes}
                  onChange={handleInputChange}
                  className="w-full rounded border border-gray-300 p-3 focus:border-orange-600 focus:outline-none"
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                variant="accent"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? "Processing..." : "Proceed to Payment"}
              </Button>
            </form>

            {/* Order Summary */}
            <div>
              <div className="sticky top-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h2 className="font-bold">Review Order Details</h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* Package image */}
                  {pkg.metadata.coverImage && (
                    <img
                      src={pkg.metadata.coverImage}
                      alt={pkg.title}
                      className="w-full rounded-lg object-cover h-32"
                    />
                  )}

                  <div>
                    <h3 className="font-bold text-sm">{pkg.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {pkg.metadata.pickupLocation} → {pkg.metadata.dropLocation}
                    </p>
                  </div>

                  {/* Order info */}
                  <div className="border-t border-b py-3 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                      Order Info
                    </h4>
                    {form.travelDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Booking Date</span>
                        <span className="font-medium">{form.travelDate}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Passengers</span>
                      <span className="font-medium">{form.passengers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Children</span>
                      <span className="font-medium">{form.children}</span>
                    </div>
                    {selectedVehicle && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Car Type</span>
                        <span className="font-medium">{selectedVehicle.vehicleName}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                      Payment Info
                    </h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Package Price</span>
                      <span>{formatINR(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">GST @ 5%</span>
                      <span>{formatINR(gst)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Amount to Pay</span>
                    <span className="text-orange-600">{formatINR(amountPayable)}</span>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800 space-y-1">
                    <p className="font-semibold">Includes:</p>
                    <p>✓ Toll, Tax, Parking</p>
                    <p>✓ Driver Allowance</p>
                    <p>✓ Fuel all taxes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
