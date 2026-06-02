"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { formatINR } from "@/lib/format";
import { getCab, createTaxiBooking, type CabOffer } from "@/services/cabs";
import { useToast } from "@/components/ui/Toast";

export default function CabBookingPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <CabBookingInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">Loading…</main>
      <Footer />
    </div>
  );
}

function CabBookingInner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const toast = useToast();

  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const date = sp.get("date") ?? "";
  const time = sp.get("time") ?? "";

  const [cab, setCab] = useState<CabOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  useEffect(() => {
    getCab(decodeURIComponent(id)).then((c) => { setCab(c); setLoading(false); });
  }, [id]);

  const onBook = async () => {
    if (!name.trim()) { toast.push({ title: "Enter your name", tone: "warn" }); return; }
    if (!phone.replace(/\D/g, "").length) { toast.push({ title: "Enter phone number", tone: "warn" }); return; }
    if (!date) { toast.push({ title: "Travel date is required", tone: "warn" }); return; }
    if (!cab) return;
    setSubmitting(true);
    try {
      const [firstName = "", ...lastParts] = name.trim().split(" ");
      const booking = await createTaxiBooking({
        taxiId: cab.id,
        pickupLocation: from,
        dropLocation: to,
        pickupDate: date,
        pickupTime: time,
        vehicleType: cab.type,
        passengers: 1,
        amount: cab.basePrice,
        customerDetails: {
          email,
          phone,
          firstName,
          lastName: lastParts.join(" "),
          address,
        },
      });
      setConfirmed(booking.id);
      toast.push({ title: "Cab booking confirmed!", tone: "success" });
    } catch {
      toast.push({ title: "Booking failed. Please try again.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-muted">
        <Header />
        <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">Loading…</main>
        <Footer />
      </div>
    );
  }

  if (!cab) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-muted">
        <Header />
        <main className="flex-1 grid place-items-center p-8">
          <p className="text-[15px] font-semibold text-ink">Cab booking is currently unavailable.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-muted">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-lg px-4 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-500">
              <svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-[22px] font-extrabold text-success-700 mb-2">Cab Booked!</h1>
            <p className="text-[14px] text-ink-muted mb-4">Booking ID: <strong className="text-ink">{confirmed}</strong></p>
            <div className="rounded-xl bg-white border border-border-soft p-5 text-left shadow-(--shadow-xs) mb-6">
              <p className="text-[13px] font-bold text-ink">{cab.name} · {cab.type}</p>
              <p className="text-[12px] text-ink-muted mt-1">{from} → {to}</p>
              <p className="text-[12px] text-ink-muted">{date} at {time}</p>
              <p className="text-[15px] font-extrabold text-ink mt-2">{formatINR(cab.basePrice)}</p>
            </div>
            <a href="/cabs" className="text-brand-600 hover:underline text-[14px] font-semibold">Book another cab</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-lg px-4 md:px-6 py-6">
          <h1 className="text-[20px] font-extrabold text-ink mb-5">Confirm Your Cab</h1>

          {/* Cab summary */}
          <div className="rounded-xl bg-white border border-border-soft p-4 shadow-(--shadow-xs) mb-4 flex gap-4 items-center">
            <div
              className="h-16 w-20 shrink-0 rounded-xl flex items-center justify-center text-white font-black text-[18px]"
              style={{ background: `hsl(${cab.imageHue} 60% 45%)` }}
              aria-hidden
            >
              {cab.type[0]}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="text-[15px] font-bold text-ink">{cab.name}</p>
              <p className="text-[12px] text-ink-muted">{from} → {to} · {date} {time}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {cab.features.map((f) => <Badge key={f} tone="neutral" size="sm">{f}</Badge>)}
              </div>
            </div>
            <p className="text-[20px] font-extrabold text-ink shrink-0">{formatINR(cab.basePrice)}</p>
          </div>

          {/* Contact & Passenger details */}
          <div className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs) mb-4">
            <h2 className="text-[15px] font-bold text-ink mb-3">Contact Info</h2>
            <div className="flex flex-col gap-3">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs) mb-4">
            <h2 className="text-[15px] font-bold text-ink mb-3">Traveler Info</h2>
            <div className="flex flex-col gap-3">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="As on ID" />
              <Input label="Pickup Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Door / landmark for pickup" />
            </div>
          </div>

          <Button variant="accent" size="xl" onClick={onBook} loading={submitting} fullWidth>
            Confirm & Pay {formatINR(cab.basePrice)}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
