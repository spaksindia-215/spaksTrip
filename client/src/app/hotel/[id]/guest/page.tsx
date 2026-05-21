"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import HotelBookingStepper from "@/components/accommodation/HotelBookingStepper";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { formatINR } from "@/lib/format";
import { useHotelBookingStore, type HotelGuest } from "@/state/hotelBookingStore";
import { useToast } from "@/components/ui/Toast";
import { useParams } from "next/navigation";

function buildGuestList(roomCount: number, existingGuests: HotelGuest[] = []): HotelGuest[] {
  if (existingGuests.length > 0) {
    return existingGuests.map((guest) => ({
      firstName: guest.firstName ?? "",
      lastName: guest.lastName ?? "",
    }));
  }
  return Array.from({ length: roomCount }, () => ({
    firstName: "",
    lastName: "",
  }));
}

export default function HotelGuestPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <GuestInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <HotelBookingStepper active="guest" />
      <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">Loading…</main>
      <Footer />
    </div>
  );
}

function GuestInner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { current, setGuests, setContact, setAddOns } = useHotelBookingStore();
  const initializedBookingIdRef = useRef<string | null>(null);

  const roomCount = current?.rooms ?? 1;

  const [guests, setLocalGuests] = useState<HotelGuest[]>(() =>
    buildGuestList(roomCount, current?.guests ?? []),
  );
  const [email, setEmail] = useState(() => current?.contact.email ?? "");
  const [phone, setPhone] = useState(() => current?.contact.phone ?? "");
  const [breakfast, setBreakfast] = useState(() => current?.addOns.breakfast ?? false);
  const [insurance, setInsurance] = useState(() => current?.addOns.insurance ?? false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!current) router.replace("/hotel");
  }, [current, router]);

  useEffect(() => {
    if (!current) return;
    if (initializedBookingIdRef.current === current.id) return;
    initializedBookingIdRef.current = current.id;
    setLocalGuests(buildGuestList(current.rooms, current.guests));
  }, [current?.id]);

  if (!current) return null;

  const updateGuest = (i: number, field: keyof HotelGuest, value: string) => {
    setLocalGuests((prev) => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));
  };

  const onContinue = () => {
    for (const g of guests) {
      if (!g.firstName.trim() || !g.lastName.trim()) {
        toast.push({ title: "Enter name for all rooms", tone: "warn" });
        return;
      }
    }
    if (!email.trim() || !email.includes("@")) {
      toast.push({ title: "Enter a valid email address", tone: "warn" });
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      toast.push({ title: "Enter a valid phone number", tone: "warn" });
      return;
    }
    setSubmitting(true);
    setGuests(guests);
    setContact({ email, phone, countryCode: "+91" });
    setAddOns({ breakfast, insurance });
    router.push(`/hotel/${encodeURIComponent(id)}/payment?${sp.toString()}`);
  };

  const addOnTotal = (breakfast ? 650 * current.nights * current.rooms : 0) + (insurance ? 499 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <HotelBookingStepper active="guest" />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6">
          <div className="grid md:grid-cols-[1fr_320px] gap-5">
            <div className="flex flex-col gap-4">
              {/* Guest names */}
              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[16px] font-bold text-ink mb-4">Guest Details</h2>
                <div className="flex flex-col gap-4">
                  {guests.map((g, i) => (
                    <div key={i} className="flex flex-col gap-3">
                      <p className="text-[13px] font-semibold text-ink-muted">Room {i + 1} — Primary Guest</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Input
                          id={`guest-first-name-${i}`}
                          label="First Name"
                          value={g.firstName}
                          onChange={(e) => updateGuest(i, "firstName", e.target.value)}
                          placeholder="As on ID"
                        />
                        <Input
                          id={`guest-last-name-${i}`}
                          label="Last Name"
                          value={g.lastName}
                          onChange={(e) => updateGuest(i, "lastName", e.target.value)}
                          placeholder="As on ID"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Contact */}
              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[16px] font-bold text-ink mb-4">Contact Information</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    hint="Booking confirmation will be sent here"
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </section>

              {/* Add-ons */}
              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[16px] font-bold text-ink mb-4">Add-ons</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4 rounded-lg bg-surface-muted p-3">
                    <Checkbox
                      id="add-breakfast"
                      label="Breakfast for all rooms"
                      description={`${formatINR(650)} per room per night`}
                      checked={breakfast}
                      onChange={(e) => setBreakfast(e.target.checked)}
                    />
                    <span className="text-[13px] font-bold text-ink shrink-0">
                      {formatINR(650 * current.nights * current.rooms)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 rounded-lg bg-surface-muted p-3">
                    <Checkbox
                      id="add-insurance"
                      label="Travel insurance"
                      description="Covers trip cancellation, medical emergencies"
                      checked={insurance}
                      onChange={(e) => setInsurance(e.target.checked)}
                    />
                    <span className="text-[13px] font-bold text-ink shrink-0">{formatINR(499)}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Price summary */}
            <aside className="flex flex-col gap-4">
              <div className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[15px] font-bold text-ink mb-3">Price Summary</h2>
                <div className="flex flex-col gap-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">{current.room.name}</span>
                    <span className="font-semibold text-ink">{formatINR(current.room.basePrice)}/night</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">{current.nights} nights × {current.rooms} room{current.rooms !== 1 ? "s" : ""}</span>
                    <span className="font-semibold text-ink">{formatINR(current.room.basePrice * current.nights * current.rooms)}</span>
                  </div>
                  {addOnTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Add-ons</span>
                      <span className="font-semibold text-ink">{formatINR(addOnTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Taxes & fees</span>
                    <span className="font-semibold text-ink">{formatINR(current.taxes)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border-soft pt-2 mt-1">
                    <span className="font-bold text-ink">Total</span>
                    <span className="font-extrabold text-[16px] text-ink">{formatINR(current.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <Button variant="accent" size="lg" onClick={onContinue} loading={submitting} fullWidth>
                Continue to Payment
              </Button>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
