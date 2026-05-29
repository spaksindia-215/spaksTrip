"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Button from "@/components/ui/Button";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { getVoucherDeadlineInfo } from "@/lib/adapters/tbo/hotel/voucherDeadline";

type BookingStatus = "confirmed" | "held" | "voucher" | "cancelled";

interface BookingDetail {
  bookingId: number;
  bookingRefNo: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  netAmount: number;
  status: BookingStatus;
  lastVoucherDate?: string;
  lastCancellationDeadline?: string;
  voucherStatus?: boolean;
}

export default function BookingPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <BookingInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">Loading booking details…</main>
      <Footer />
    </div>
  );
}

function BookingInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/hotels/booking/${id}`);
        if (!res.ok) throw new Error("Booking not found");
        const data = await res.json();
        setBooking(data.data);
      } catch (err) {
        toast.push({
          title: "Failed to load booking",
          description: err instanceof Error ? err.message : "Unknown error",
          tone: "danger",
        });
        router.replace("/hotel");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, router, toast]);

  if (loading) return null;
  if (!booking) return null;

  const deadlineInfo = getVoucherDeadlineInfo(booking.lastVoucherDate);
  const isHeld = booking.status === "held" && !booking.voucherStatus;
  const canGenerateVoucher = isHeld && !deadlineInfo.isExpired;

  const handleGenerateVoucher = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/hotels/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          lastVoucherDate: booking.lastVoucherDate,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (res.status === 410) {
          throw new Error("Voucher deadline has passed. Contact support.");
        }
        throw new Error(error.error || "Failed to generate voucher");
      }

      toast.push({
        title: "Voucher generated successfully!",
        description: `Booking confirmed. Reference: ${booking.bookingRefNo}`,
        tone: "success",
      });

      setTimeout(() => router.push(`/hotel/booking/${id}/confirmation`), 1500);
    } catch (err) {
      toast.push({
        title: "Failed to generate voucher",
        description: err instanceof Error ? err.message : "Unknown error",
        tone: "danger",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
          <div className="rounded-xl bg-white border border-border-soft p-6 shadow-(--shadow-xs) mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-[24px] font-bold text-ink">{booking.hotelName}</h1>
                <p className="text-[13px] text-ink-muted mt-1">Booking ID: {booking.bookingId}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-semibold text-ink">Total: {formatINR(booking.netAmount)}</p>
                <p
                  className={`text-[12px] font-medium mt-1 ${
                    booking.status === "confirmed"
                      ? "text-green-600"
                      : booking.status === "held"
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {booking.status === "confirmed"
                    ? "✓ Confirmed"
                    : booking.status === "held"
                      ? "⏸ On Hold"
                      : "✗ Cancelled"}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border-soft">
              <div>
                <p className="text-[12px] text-ink-muted">Check-In</p>
                <p className="text-[14px] font-semibold text-ink">{booking.checkInDate}</p>
              </div>
              <div>
                <p className="text-[12px] text-ink-muted">Check-Out</p>
                <p className="text-[14px] font-semibold text-ink">{booking.checkOutDate}</p>
              </div>
            </div>
          </div>

          {/* Held Booking Status */}
          {isHeld && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 shadow-(--shadow-xs) mb-6">
              <h2 className="text-[15px] font-bold text-amber-900 mb-3">⏸ Booking on Hold</h2>
              <p className="text-[13px] text-amber-800 mb-4">
                Your booking is currently on hold. You must generate the voucher before the deadline to confirm it.
              </p>

              {/* Deadline Info */}
              <div className="bg-white rounded px-4 py-3 mb-4 border border-amber-200">
                <p className="text-[12px] text-amber-900 font-semibold">Voucher Deadline</p>
                <p className={`text-[14px] font-bold mt-2 ${deadlineInfo.isExpired ? "text-red-600" : "text-amber-700"}`}>
                  {deadlineInfo.message}
                </p>
              </div>

              {/* Cancellation Deadline */}
              {booking.lastCancellationDeadline && (
                <div className="bg-white rounded px-4 py-3 mb-4 border border-blue-200">
                  <p className="text-[12px] text-blue-900 font-semibold">Free Cancellation Until</p>
                  <p className="text-[14px] font-bold text-blue-700 mt-2">{booking.lastCancellationDeadline}</p>
                </div>
              )}

              <Button
                variant={canGenerateVoucher ? "accent" : "secondary"}
                size="lg"
                onClick={handleGenerateVoucher}
                loading={generating}
                disabled={!canGenerateVoucher || deadlineInfo.isExpired}
                fullWidth
              >
                {deadlineInfo.isExpired
                  ? "Voucher Deadline Passed"
                  : "Generate Voucher & Confirm Booking"}
              </Button>

              {!canGenerateVoucher && (
                <p className="text-[11px] text-red-600 mt-3 text-center font-medium">
                  ⚠ Cannot generate voucher: deadline has passed or booking is already confirmed
                </p>
              )}
            </div>
          )}

          {/* Confirmed Booking */}
          {booking.status === "confirmed" && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 shadow-(--shadow-xs)">
              <p className="text-[13px] text-green-800">
                ✓ Your booking is confirmed! Check your email for the voucher and booking details.
              </p>
            </div>
          )}

          {/* Cancelled Booking */}
          {booking.status === "cancelled" && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 shadow-(--shadow-xs)">
              <p className="text-[13px] text-red-800">
                ✗ This booking has been cancelled. Contact support for assistance.
              </p>
            </div>
          )}

          {/* TBO Liability Disclaimer */}
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 shadow-(--shadow-xs) mt-6">
            <h3 className="text-[13px] font-bold text-red-900 mb-2">⚠ Important Notice</h3>
            <p className="text-[11px] text-red-800 leading-relaxed">
              TBO will not take any liability for financial loss if you fail to generate the voucher before the deadline.
              Ensure you complete this action before the voucher deadline expires. Once the deadline passes, TBO may automatically
              cancel your booking and you may not be eligible for a refund.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
