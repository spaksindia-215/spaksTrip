"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Script from "next/script";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BookingStepper from "@/components/flight/BookingStepper";
import ItinerarySummary from "@/components/flight/ItinerarySummary";
import PriceBreakdown from "@/components/flight/PriceBreakdown";
import Button from "@/components/ui/Button";
import { useBookingStore } from "@/state/bookingStore";
import { useToast } from "@/components/ui/Toast";
import { buildBookingPayload } from "@/services/flights";

// ─── Razorpay browser types ───────────────────────────────────────────────────

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler(response: RazorpaySuccessResponse): void;
  modal?: { ondismiss?(): void };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}

export default function FlightPaymentPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <PaymentInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <BookingStepper active="payment" />
      <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">
        Loading…
      </main>
      <Footer />
    </div>
  );
}

function PaymentInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const { current, confirm } = useBookingStore();

  const [phase, setPhase] = useState<
    "idle" | "creating_order" | "awaiting_payment" | "verifying" | "booking"
  >("idle");

  useEffect(() => {
    if (!current) router.replace("/flight");
  }, [current, router]);

  if (!current) return null;

  const totalPaise = Math.round(current.totalPrice * 100);
  const isBusy = phase !== "idle";
  const from = current.offer.segments[0]?.from ?? "";
  const to = current.offer.segments[current.offer.segments.length - 1]?.to ?? "";

  // ── Verify payment + issue ticket server-side (atomic; auto-refund on failure) ─
  // Idempotent on the server, so a network retry is safe.
  async function verifyAndBook(response: RazorpaySuccessResponse, retry = 0) {
    const booking = current!;
    setPhase("booking");
    try {
      const res = await fetch("/api/flights/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          amountPaise: totalPaise,
          clientReferenceId: booking.id,
          booking: buildBookingPayload(booking),
        }),
      });
      const data = await res.json().catch(() => null);

      // ── Success ──────────────────────────────────────────────────────────────
      if (res.ok && data?.success) {
        confirm(data.data.pnr, data.data.returnLeg?.pnr);
        toast.push({ title: "Booking confirmed", description: `PNR: ${data.data.pnr}`, tone: "success" });
        router.push(`/flight/${encodeURIComponent(booking.offer.id)}/confirmation?${sp.toString()}`);
        return;
      }

      // ── Signature mismatch ─────────────────────────────────────────────────────
      if (data?.signatureMismatch) {
        toast.push({
          title: "Payment verification failed",
          description: `If any amount was deducted, contact support with payment ID: ${data.razorpayPaymentId}`,
          tone: "warn",
        });
        setPhase("idle");
        return;
      }

      // ── TBO timeout — payment captured, booking state unknown ──────────────────
      if (data?.tboTimedOut) {
        toast.push({
          title: "Booking request timed out",
          description: `Payment received (ID: ${response.razorpay_payment_id}). We'll confirm by email; reference: ${booking.id}.`,
          tone: "warn",
        });
        setPhase("idle");
        return;
      }

      // ── Partial (domestic return): outbound ticketed, inbound failed ───────────
      // Outbound is confirmed — take the user to confirmation; ops reconciles the return.
      if (data?.tboPartial) {
        confirm(data.partialPnr);
        toast.push({
          title: "Outbound confirmed — return pending",
          description: `Your outbound flight is ticketed (PNR: ${data.partialPnr}). The return leg couldn't be confirmed; our team will contact you to complete it — no extra charge without your consent.`,
          tone: "warn",
        });
        router.push(`/flight/${encodeURIComponent(booking.offer.id)}/confirmation?${sp.toString()}`);
        return;
      }

      // ── Hard failure / price change → refund already initiated server-side ─────
      if (data?.tboFailed) {
        const refundNote = data.razorpayRefundInitiated
          ? "A full refund has been initiated (5–7 business days)."
          : `Please contact support with payment ID: ${response.razorpay_payment_id}`;
        toast.push({
          title: data.reason === "price_changed" ? "Fare changed" : "Booking failed",
          description: `${data.error ?? ""} ${refundNote}`.trim(),
          tone: "warn",
        });
        setPhase("idle");
        // Price changed → send the user back to re-price the itinerary.
        if (data.reason === "price_changed") {
          router.push(`/flight/${encodeURIComponent(booking.offer.id)}/review?${sp.toString()}`);
        }
        return;
      }

      // ── Generic server error ───────────────────────────────────────────────────
      toast.push({
        title: "Booking failed",
        description: data?.error ?? `Contact support with payment ID: ${response.razorpay_payment_id}`,
        tone: "warn",
      });
      setPhase("idle");
    } catch {
      // Network interruption — the server is idempotent, so retry safely.
      if (retry < 2) {
        toast.push({ title: `Connection issue — retrying (${retry + 1}/2)…`, description: "Please stay on this page.", tone: "info" });
        await new Promise((r) => setTimeout(r, 3000 * (retry + 1)));
        return verifyAndBook(response, retry + 1);
      }
      toast.push({
        title: "Verification interrupted",
        description: `Your payment was received but we couldn't confirm the booking. Contact support with payment ID: ${response.razorpay_payment_id}`,
        tone: "warn",
      });
      setPhase("idle");
    }
  }

  // ── Pay handler ───────────────────────────────────────────────────────────────
  async function onPay() {
    const booking = current!;
    if (!booking.fareBreakdown?.length || !booking.travelers?.length) {
      toast.push({ title: "Booking session incomplete", description: "Please go back to the review step and try again.", tone: "warn" });
      router.push(`/flight/${encodeURIComponent(booking.offer.id)}/review?${sp.toString()}`);
      return;
    }
    if (!window.Razorpay) {
      toast.push({ title: "Payment gateway not loaded. Please refresh the page.", tone: "warn" });
      return;
    }
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) {
      toast.push({ title: "Payment is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID.", tone: "warn" });
      return;
    }

    // Step 1: create the Razorpay order server-side.
    setPhase("creating_order");
    let orderId: string;
    try {
      const res = await fetch("/api/flights/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaise: totalPaise,
          clientReferenceId: booking.id,
          route: `${from}-${to}`,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.push({ title: data?.error ?? "Failed to initiate payment. Please try again.", tone: "warn" });
        setPhase("idle");
        return;
      }
      orderId = data.orderId;
    } catch {
      toast.push({ title: "Could not connect to payment gateway. Please try again.", tone: "warn" });
      setPhase("idle");
      return;
    }

    // Step 2: open Razorpay checkout.
    setPhase("awaiting_payment");
    const lead = booking.travelers[0];
    const rzp = new window.Razorpay({
      key,
      order_id: orderId,
      amount: totalPaise,
      currency: "INR",
      name: "SpaksTrip",
      description: `Flight: ${from} → ${to}`,
      prefill: {
        name: lead ? `${lead.firstName} ${lead.lastName}` : undefined,
        email: booking.contact?.email,
        contact: booking.contact?.phone,
      },
      notes: { clientReferenceId: booking.id, route: `${from}-${to}` },
      theme: { color: "#1a56db" },
      handler(response: RazorpaySuccessResponse) {
        verifyAndBook(response);
      },
      modal: {
        ondismiss() {
          setPhase("idle");
          toast.push({
            title: "Payment cancelled",
            description: "Your booking session is still active. You can try paying again.",
            tone: "info",
          });
        },
      },
    });
    rzp.open();
  }

  const buttonLabel =
    phase === "creating_order"
      ? "Opening payment…"
      : phase === "awaiting_payment"
        ? "Awaiting payment…"
        : phase === "verifying"
          ? "Verifying payment…"
          : phase === "booking"
            ? "Issuing ticket…"
            : `Pay ${current.totalPrice.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      {/* Razorpay checkout.js — loaded after the page becomes interactive */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <Header />
      <BookingStepper active="payment" />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6">
          {(phase === "verifying" || phase === "booking") && (
            <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-blue-800 text-[13px] font-medium flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {phase === "verifying" ? "Verifying payment…" : "Confirming your booking with the airline"} — please do not close this tab.
            </div>
          )}

          <div className="grid md:grid-cols-[1fr_340px] gap-5">
            <div className="flex flex-col gap-4">
              <ItinerarySummary offer={current.offer} compact />

              <div className="rounded-xl bg-green-50 text-green-700 text-[12px] font-medium px-4 py-3 flex items-center gap-2 border border-green-200">
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Secured by Razorpay · 256-bit SSL · supports UPI, Cards, Net Banking &amp; Wallets
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <PriceBreakdown booking={current} />
              <Button variant="accent" size="lg" onClick={onPay} loading={isBusy} disabled={isBusy} fullWidth>
                {buttonLabel}
              </Button>
              <p className="text-[11px] text-ink-muted text-center">
                Clicking Pay opens Razorpay&apos;s secure checkout. Your payment details are never stored by SpaksTrip.
              </p>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
