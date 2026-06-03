"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import HotelBookingStepper from "@/components/accommodation/HotelBookingStepper";
import Button from "@/components/ui/Button";
import { formatINR } from "@/lib/format";
import { useHotelBookingStore } from "@/state/hotelBookingStore";
import { useToast } from "@/components/ui/Toast";

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

// ─── Page shell ───────────────────────────────────────────────────────────────

type BookingOption = "hold" | "voucher";

export default function HotelPaymentPage() {
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
      <HotelBookingStepper active="payment" />
      <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">
        Loading…
      </main>
      <Footer />
    </div>
  );
}

// ─── Inner component ──────────────────────────────────────────────────────────

function PaymentInner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { current, confirm } = useHotelBookingStore();

  const [bookingOption, setBookingOption] = useState<BookingOption>("hold");
  const [phase, setPhase] = useState<
    "idle" | "creating_order" | "awaiting_payment" | "verifying"
  >("idle");

  // Ref holds the latest Razorpay success response so the async verify handler
  // always has it even after state updates.
  const pendingResponseRef = useRef<RazorpaySuccessResponse | null>(null);

  useEffect(() => {
    if (!current) router.replace("/hotel");
  }, [current, router]);

  if (!current) return null;

  const totalPaise = Math.round(current.totalPrice * 100);
  const isBusy = phase !== "idle";

  // ── Payment verification — called from Razorpay handler callback ───────────
  // Retries up to 2 times on network failure (idempotent on the server).

  async function verifyAndBook(
    response: RazorpaySuccessResponse,
    retryCount = 0,
  ): Promise<void> {
    if (!current) return;
    setPhase("verifying");

    // Capture snapshot so TypeScript knows it's non-null inside async callbacks.
    const booking = current;

    try {
      const res = await fetch("/api/hotels/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          amountPaise: totalPaise,
          bookingCode: booking.preBook!.bookingCode,
          netAmount: booking.preBook!.netAmount,
          isVoucherBooking: bookingOption === "voucher",
          guests: booking.guests,
          guestNationality: booking.guestNationality,
          clientReferenceId: booking.id,
          adults: booking.adults,
          rooms: booking.rooms,
        }),
      });

      const data = await res.json();

      // ── Success ────────────────────────────────────────────────────────────
      if (res.ok && data.success) {
        confirm(
          data.data.bookingRefNo ||
            data.data.bookingId?.toString() ||
            booking.id,
        );
        toast.push({
          title: "Booking confirmed!",
          description: `Ref: ${data.data.bookingRefNo || data.data.bookingId}`,
          tone: "success",
        });
        router.push(
          `/hotel/${encodeURIComponent(id)}/confirmation?${sp.toString()}`,
        );
        return;
      }

      // ── Signature mismatch (tampered response) ────────────────────────────
      if (data.signatureMismatch) {
        toast.push({
          title: "Payment verification failed",
          description:
            "The payment signature is invalid. If any amount was deducted, " +
            `please contact support with payment ID: ${data.razorpayPaymentId}`,
          tone: "warn",
        });
        setPhase("idle");
        return;
      }

      // ── TBO timeout ────────────────────────────────────────────────────────
      if (data.tboTimedOut) {
        toast.push({
          title: "Booking request timed out",
          description:
            `Payment received (ID: ${response.razorpay_payment_id}). ` +
            `We will confirm your booking via email. Reference: ${current.id}`,
          tone: "warn",
        });
        setPhase("idle");
        return;
      }

      // ── TBO hard failure (price change or booking failure) ─────────────────
      if (data.tboFailed) {
        const refundNote = data.razorpayRefundInitiated
          ? "A full refund has been initiated (5-7 business days)."
          : `Please contact support with payment ID: ${response.razorpay_payment_id}`;

        toast.push({
          title:
            data.reason === "price_changed"
              ? "Hotel price changed"
              : "Booking failed",
          description: refundNote,
          tone: "warn",
        });
        setPhase("idle");

        // For price change: send user back to room selection to re-book at new price.
        if (data.reason === "price_changed") {
          router.push(`/hotel/${encodeURIComponent(id)}?${sp.toString()}`);
        }
        return;
      }

      // ── Generic server error ───────────────────────────────────────────────
      toast.push({
        title: "Booking failed",
        description:
          data.error ||
          `An unexpected error occurred. Contact support with payment ID: ${response.razorpay_payment_id}`,
        tone: "warn",
      });
      setPhase("idle");
    } catch {
      // ── Network interruption during verification ───────────────────────────
      // The server operation is idempotent, so retries are safe.
      if (retryCount < 2) {
        toast.push({
          title: `Connection issue — retrying (${retryCount + 1}/2)…`,
          description: "Please stay on this page.",
          tone: "info",
        });
        await new Promise((r) => setTimeout(r, 3000 * (retryCount + 1)));
        return verifyAndBook(response, retryCount + 1);
      }

      toast.push({
        title: "Verification interrupted",
        description:
          `Your payment was received but we could not confirm the booking. ` +
          `Please contact support with payment ID: ${response.razorpay_payment_id}`,
        tone: "warn",
      });
      setPhase("idle");
    }
  }

  // ── Main pay handler ────────────────────────────────────────────────────────

  async function onPay() {
    if (!current) return;
    const booking = current;

    if (!booking.preBook?.bookingCode) {
      toast.push({
        title: "Booking data missing. Please go back and try again.",
        tone: "warn",
      });
      return;
    }
    if (booking.guestNationality !== "IN") {
      toast.push({
        title: "Only Indian nationals can book through SpaksTrip.",
        tone: "warn",
      });
      return;
    }
    if (!window.Razorpay) {
      toast.push({
        title: "Payment gateway not loaded. Please refresh the page.",
        tone: "warn",
      });
      return;
    }

    // Step 1: create Razorpay order server-side
    setPhase("creating_order");
    let orderId: string;

    try {
      const res = await fetch("/api/hotels/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaise: totalPaise,
          clientReferenceId: booking.id,
          hotelName: booking.hotel.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.push({
          title: data.error || "Failed to initiate payment. Please try again.",
          tone: "warn",
        });
        setPhase("idle");
        return;
      }

      ({ orderId } = await res.json());
    } catch {
      toast.push({
        title: "Could not connect to payment gateway. Please try again.",
        tone: "warn",
      });
      setPhase("idle");
      return;
    }

    // Step 2: open Razorpay checkout
    setPhase("awaiting_payment");

    const lead = booking.guests[0];
    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      order_id: orderId,
      amount: totalPaise,
      currency: "INR",
      name: "SpaksTrip",
      description: `Hotel: ${booking.hotel.name}`,
      prefill: {
        name: lead ? `${lead.firstName} ${lead.lastName}` : undefined,
        email: booking.contact?.email,
        contact: booking.contact?.phone,
      },
      notes: {
        hotelName: booking.hotel.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        clientReferenceId: booking.id,
      },
      theme: { color: "#1a56db" },

      // Called by Razorpay after the user completes payment inside the modal.
      handler(response: RazorpaySuccessResponse) {
        pendingResponseRef.current = response;
        verifyAndBook(response);
      },

      modal: {
        // User closed the Razorpay modal without paying.
        ondismiss() {
          setPhase("idle");
          toast.push({
            title: "Payment cancelled",
            description:
              "Your booking session is still active. You can try paying again.",
            tone: "info",
          });
        },
      },
    });

    rzp.open();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const buttonLabel =
    phase === "creating_order"
      ? "Opening payment…"
      : phase === "awaiting_payment"
        ? "Awaiting payment…"
        : phase === "verifying"
          ? "Verifying payment…"
          : `Pay ${formatINR(current.totalPrice)}`;

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      {/* Razorpay checkout.js — loaded after page becomes interactive */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <Header />
      <HotelBookingStepper active="payment" />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6">
          {/* Verification spinner banner */}
          {phase === "verifying" && (
            <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-blue-800 text-[13px] font-medium flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Verifying payment and confirming your booking — please do not
              close this tab.
            </div>
          )}

          <div className="grid md:grid-cols-[1fr_340px] gap-5">
            {/* ── Left column ── */}
            <div className="flex flex-col gap-4">
              {/* Hotel summary */}
              <div className="rounded-xl bg-white border border-border-soft p-4 shadow-(--shadow-xs) flex gap-4">
                <img
                  src={current.hotel.images[0]}
                  alt={current.hotel.name}
                  className="h-20 w-28 shrink-0 rounded-lg object-cover"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-[15px] font-bold text-ink truncate">
                    {current.hotel.name}
                  </p>
                  <p className="text-[12px] text-ink-muted">{current.room.name}</p>
                  <p className="text-[12px] text-ink-muted">
                    {current.checkIn} → {current.checkOut} ·{" "}
                    {current.nights} night{current.nights !== 1 ? "s" : ""} ·{" "}
                    {current.rooms} room{current.rooms !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Booking option selector (Hold vs Voucher) — unchanged behaviour */}
              <section className="rounded-xl bg-blue-50 border border-blue-200 p-4 shadow-(--shadow-xs)">
                <h2 className="text-[15px] font-bold text-blue-900 mb-3">
                  Booking Option
                </h2>
                <div className="flex flex-col gap-3">
                  <label
                    className="flex items-start gap-3 p-3 rounded-lg bg-white border-2 cursor-pointer transition-colors"
                    style={{
                      borderColor:
                        bookingOption === "hold"
                          ? "rgb(59,130,246)"
                          : "rgb(229,231,235)",
                    }}
                  >
                    <input
                      type="radio"
                      name="booking-option"
                      value="hold"
                      checked={bookingOption === "hold"}
                      onChange={() => setBookingOption("hold")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-ink">
                        Hold Booking
                      </p>
                      <p className="text-[12px] text-ink-soft mt-1">
                        Keep booking on hold. Generate voucher later before the
                        deadline.
                      </p>
                      {current.preBook?.cancelPolicies?.[0]?.fromDate && (
                        <p className="text-[11px] text-blue-700 mt-2 font-medium">
                          Generate voucher by:{" "}
                          {current.preBook.cancelPolicies[0].fromDate}
                        </p>
                      )}
                    </div>
                  </label>

                  <label
                    className="flex items-start gap-3 p-3 rounded-lg bg-white border-2 cursor-pointer transition-colors"
                    style={{
                      borderColor:
                        bookingOption === "voucher"
                          ? "rgb(34,197,94)"
                          : "rgb(229,231,235)",
                    }}
                  >
                    <input
                      type="radio"
                      name="booking-option"
                      value="voucher"
                      checked={bookingOption === "voucher"}
                      onChange={() => setBookingOption("voucher")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-ink">
                        Confirm Now (Generate Voucher)
                      </p>
                      <p className="text-[12px] text-ink-soft mt-1">
                        Generate voucher immediately and confirm your booking.
                      </p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Security badge */}
              <div className="rounded-xl bg-green-50 text-green-700 text-[12px] font-medium px-4 py-3 flex items-center gap-2 border border-green-200">
                <svg
                  viewBox="0 0 24 24"
                  width={16}
                  height={16}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Secured by Razorpay · 256-bit SSL · PCI DSS compliant · Supports
                UPI, Cards, Net Banking &amp; Wallets
              </div>
            </div>

            {/* ── Right column ── */}
            <aside className="flex flex-col gap-4">
              <div className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[15px] font-bold text-ink mb-3">
                  Price Breakdown
                </h2>
                <div className="flex flex-col gap-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">
                      Room ({current.nights}N × {current.rooms}R)
                    </span>
                    <span className="font-semibold">
                      {formatINR(
                        current.room.basePrice *
                          current.nights *
                          current.rooms,
                      )}
                    </span>
                  </div>
                  {current.addOns.breakfast && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Breakfast</span>
                      <span className="font-semibold">
                        {formatINR(650 * current.nights * current.rooms)}
                      </span>
                    </div>
                  )}
                  {current.addOns.insurance && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Travel insurance</span>
                      <span className="font-semibold">{formatINR(499)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Taxes (12%)</span>
                    <span className="font-semibold">
                      {formatINR(current.taxes)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border-soft pt-2 mt-1">
                    <span className="font-bold text-ink">Total</span>
                    <span className="font-extrabold text-[17px] text-ink">
                      {formatINR(current.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="accent"
                size="lg"
                onClick={onPay}
                loading={isBusy}
                disabled={isBusy}
                fullWidth
              >
                {buttonLabel}
              </Button>

              <p className="text-[11px] text-ink-muted text-center">
                Clicking Pay opens Razorpay&apos;s secure checkout. Your
                payment details are never stored by SpaksTrip.
              </p>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
