"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import ErrorState from "@/components/ui/ErrorState";
import { taxiPackagesClient } from "@/lib/taxiPackagesClient";
import { formatINR } from "@/lib/format";
import { formatDuration, formatDateShort, isPastDate } from "@/lib/taxi-packages-utils";
import type { TaxiPackage, PackageVehiclePricing, PackageAvailability } from "@/types/taxiPackages";

function formatMonthYear(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AvailabilityCalendar({
  month,
  availability,
  onSelect,
  selected,
}: {
  month: Date;
  availability: PackageAvailability[];
  onSelect: (date: string) => void;
  selected: string;
}) {
  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();

  const byDate = new Map<string, PackageAvailability>();
  availability.forEach((a) => byDate.set(a.date.slice(0, 10), a));

  const cells: (null | number)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 gap-px">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-semibold text-gray-400 uppercase">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />;
          const isoDate = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const avail = byDate.get(isoDate);
          const past = isPastDate(isoDate);
          const isSelected = selected === isoDate;

          let cls = "flex flex-col items-center justify-center rounded p-1 text-xs transition ";
          if (past) {
            cls += "text-gray-300 cursor-not-allowed";
          } else if (!avail || avail.status === "BLOCKED") {
            cls += "text-gray-400";
          } else if (avail.status === "SOLD_OUT") {
            cls += "bg-red-50 text-red-400 cursor-not-allowed";
          } else if (avail.status === "ON_REQUEST") {
            cls += "cursor-pointer bg-yellow-50 text-yellow-700 hover:bg-yellow-100";
          } else {
            cls += "cursor-pointer bg-green-50 text-green-700 hover:bg-green-100 font-semibold";
          }
          if (isSelected) cls += " ring-2 ring-orange-400";

          const clickable =
            !past && avail && avail.status !== "BLOCKED" && avail.status !== "SOLD_OUT";

          return (
            <button
              key={isoDate}
              type="button"
              disabled={!clickable}
              className={cls}
              onClick={() => clickable && onSelect(isoDate)}
            >
              <span>{day}</span>
              {avail?.status === "AVAILABLE" && (
                <span className="mt-0.5 text-[9px]">
                  {avail.priceOverride ? formatINR(avail.priceOverride) : "Open"}
                </span>
              )}
              {avail?.status === "ON_REQUEST" && (
                <span className="mt-0.5 text-[9px]">Query</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-100" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-yellow-100" /> On Request
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-100" /> Sold Out
        </span>
      </div>
    </div>
  );
}

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const destinationSlug = params.destinationSlug as string;
  const packageSlug = params.packageSlug as string;

  const [pkg, setPkg] = useState<TaxiPackage | null>(null);
  const [vehicles, setVehicles] = useState<PackageVehiclePricing[]>([]);
  const [availability, setAvailability] = useState<PackageAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Booking sidebar state
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const pkgData = await taxiPackagesClient.getPackageBySlug(destinationSlug, packageSlug);
        setPkg(pkgData);

        const [vehicleData, availData] = await Promise.all([
          taxiPackagesClient.getVehicles(pkgData.id),
          taxiPackagesClient.getAvailability(
            pkgData.id,
            new Date(),
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          ),
        ]);

        setVehicles(vehicleData);
        setAvailability(availData);
        if (vehicleData.length > 0) setSelectedVehicle(vehicleData[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load package details");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [destinationSlug, packageSlug]);

  const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicle);

  const handleBookNow = () => {
    if (!pkg) return;
    const qs = new URLSearchParams({
      packageId: pkg.id,
      vehicleId: selectedVehicle,
      travelDate: selectedDate,
      passengers: String(adults),
      children: String(children),
      amount: String(selectedVehicleObj?.totalPrice ?? pkg.metadata.basePrice),
    });
    router.push(`/taxi-packages/${destinationSlug}/${packageSlug}/booking?${qs}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#0E1E3A]">
        <Header />
        <div className="flex justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
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
          <ErrorState message={error ?? "Package not found"} />
          <div className="mt-4 text-center">
            <Link href={`/taxi-packages/${destinationSlug}`} className="text-orange-600 underline">
              ← Back to packages
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { metadata } = pkg;
  const allImages = [metadata.coverImage, ...(metadata.galleryImages ?? [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-gray-500">
            <Link href="/taxi-package" className="hover:text-orange-600">Taxi Packages</Link>
            <span>/</span>
            <Link href={`/taxi-packages/${destinationSlug}`} className="capitalize hover:text-orange-600">
              {destinationSlug.replace(/-/g, " ")}
            </Link>
            <span>/</span>
            <span className="text-gray-700">{pkg.title}</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* ── Left Column ─────────────────────────────── */}
            <div className="space-y-8">

              {/* Image Gallery */}
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl">
                  <img
                    src={allImages[selectedImageIndex] ?? metadata.coverImage}
                    alt={pkg.title}
                    className="h-72 w-full object-cover sm:h-96"
                  />
                </div>
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          selectedImageIndex === idx ? "border-orange-500" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  {formatDuration(metadata.durationDays, metadata.durationNights)}
                </span>
                <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{pkg.title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {metadata.pickupLocation} → {metadata.dropLocation}
                </p>
              </div>

              {/* Description */}
              {pkg.description && (
                <section>
                  <h2 className="mb-3 text-lg font-bold">Description</h2>
                  <div className="rounded-xl bg-gray-50 p-5">
                    <p className="text-sm leading-7 text-gray-700 whitespace-pre-line">{pkg.description}</p>
                  </div>
                </section>
              )}

              {/* Tour Price List */}
              {vehicles.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-bold">Tour Price List</h2>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="bg-[#0E1E3A] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white/70">
                      Select your vehicle
                    </div>
                    <div className="divide-y divide-gray-100">
                      {vehicles.map((v) => (
                        <label
                          key={v.id}
                          className={`flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition ${
                            selectedVehicle === v.id ? "bg-orange-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="vehicle"
                              value={v.id}
                              checked={selectedVehicle === v.id}
                              onChange={() => setSelectedVehicle(v.id)}
                              className="accent-orange-500"
                            />
                            <div>
                              <p className="font-semibold">{v.vehicleName}</p>
                              <p className="text-xs text-gray-500">{v.vehicleType} · {v.seatingCapacity} seater</p>
                              {v.amenities.length > 0 && (
                                <p className="text-xs text-gray-400">{v.amenities.join(" · ")}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-extrabold text-orange-600">{formatINR(v.totalPrice)}</p>
                            {v.pricePerDay > 0 && (
                              <p className="text-xs text-gray-400">{formatINR(v.pricePerDay)}/day</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="bg-gray-50 px-5 py-3 text-xs text-gray-500">
                      Including Toll, Tax, Parking, Driver Allowances, Fuel and all taxes.
                    </div>
                  </div>
                </section>
              )}

              {/* Availability Calendar */}
              {availability.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-bold">Tour Calendar</h2>
                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const p = new Date(calendarMonth);
                          p.setMonth(p.getMonth() - 1);
                          setCalendarMonth(p);
                        }}
                        className="rounded px-2 py-1 hover:bg-gray-100 text-lg"
                      >
                        ‹
                      </button>
                      <span className="font-semibold">{formatMonthYear(calendarMonth)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const n = new Date(calendarMonth);
                          n.setMonth(n.getMonth() + 1);
                          setCalendarMonth(n);
                        }}
                        className="rounded px-2 py-1 hover:bg-gray-100 text-lg"
                      >
                        ›
                      </button>
                    </div>
                    <AvailabilityCalendar
                      month={calendarMonth}
                      availability={availability}
                      onSelect={setSelectedDate}
                      selected={selectedDate}
                    />
                    {selectedDate && (
                      <p className="mt-3 text-sm font-medium text-green-700">
                        Selected: {formatDateShort(selectedDate)}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Itinerary */}
              {metadata.itinerary && metadata.itinerary.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-bold">Itinerary</h2>
                  <div className="space-y-4">
                    {metadata.itinerary.map((day) => (
                      <div key={day.day} className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                            {day.day}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-bold">{day.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-gray-600">{day.description}</p>
                          {day.image && (
                            <img
                              src={day.image}
                              alt={day.title}
                              className="mt-3 h-40 w-full rounded-lg object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Inclusions & Exclusions */}
              {((metadata.inclusions?.length ?? 0) > 0 || (metadata.exclusions?.length ?? 0) > 0) && (
                <section>
                  <h2 className="mb-3 text-lg font-bold">Inclusions & Exclusions</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {(metadata.inclusions?.length ?? 0) > 0 && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                        <h3 className="mb-3 font-bold text-green-800">Inclusions</h3>
                        <ul className="space-y-2">
                          {metadata.inclusions.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-green-900">
                              <span className="mt-0.5 text-green-600">✓</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(metadata.exclusions?.length ?? 0) > 0 && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                        <h3 className="mb-3 font-bold text-red-800">Exclusions</h3>
                        <ul className="space-y-2">
                          {(metadata.exclusions ?? []).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-red-900">
                              <span className="mt-0.5 text-red-500">✗</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Policy */}
              <section className="rounded-xl bg-gray-50 p-5 text-sm text-gray-700 space-y-4">
                <div>
                  <h3 className="mb-1 font-semibold">Documents Required</h3>
                  <p>Government issued ID (Aadhaar / Passport / Driving Licence / Election ID) for all passengers.</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Cancellation Policy</h3>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>10% + ₹1,000/person if cancelled 30+ days before departure.</li>
                    <li>25% if cancelled 7–29 days before departure.</li>
                    <li>No refund within 7 days of departure.</li>
                  </ul>
                </div>
              </section>
            </div>

            {/* ── Right Column: Booking Sidebar ────────────── */}
            <div>
              <div className="sticky top-4 space-y-4">
                {/* Summary */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold">{pkg.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {formatDuration(metadata.durationDays, metadata.durationNights)}
                  </p>
                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-orange-600">
                      {formatINR(selectedVehicleObj?.totalPrice ?? metadata.basePrice)}
                    </span>
                    <span className="ml-1 text-xs text-gray-400">per vehicle</span>
                  </div>
                </div>

                {/* Booking Form */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 font-bold">Booking Now</h3>

                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Travel Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200"
                    />
                  </div>

                  {vehicles.length > 0 && (
                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-semibold text-gray-500">Vehicle</label>
                      <select
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                      >
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.vehicleName} — {formatINR(v.totalPrice)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">Adults</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={adults}
                        onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">Children (2–12)</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={children}
                        onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBookNow}
                    disabled={!selectedDate}
                    className="w-full rounded-lg bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selectedDate ? "Book Now →" : "Select a Travel Date"}
                  </button>
                </div>

                <Link
                  href={`/taxi-packages/${destinationSlug}`}
                  className="block text-center text-sm text-orange-600 hover:underline"
                >
                  ← More packages
                </Link>
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
