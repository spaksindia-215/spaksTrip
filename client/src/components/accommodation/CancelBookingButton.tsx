"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import CancellationConfirmModal from "./CancellationConfirmModal";
import CancellationStatusTracker from "./CancellationStatusTracker";
import { useToast } from "@/components/ui/Toast";

interface CancelBookingButtonProps {
  bookingId: number;
  bookingRefNo: string;
  hotelName: string;
  paidAmount: number;
  refundAmount: number;
  cancellationFee: number;
  lastCancellationDeadline?: string;
}

interface CancelResponse {
  success: boolean;
  data?: {
    changeRequestId: number;
    status: string;
    refundAmount?: number;
    cancellationCharge?: number;
    bookingId: number;
    bookingRefNo: string;
  };
  error?: string;
}

export default function CancelBookingButton({
  bookingId,
  bookingRefNo,
  hotelName,
  paidAmount,
  refundAmount,
  cancellationFee,
  lastCancellationDeadline,
}: CancelBookingButtonProps) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changeRequestId, setChangeRequestId] = useState<number | null>(null);
  const [cancellationError, setCancellationError] = useState<string | null>(null);

  const handleConfirmCancel = async (remarks: string) => {
    setIsSubmitting(true);
    setCancellationError(null);

    try {
      const res = await fetch("/api/hotels/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          bookingRefNo,
          remarks: remarks || "Customer-initiated cancellation",
        }),
      });

      const data: CancelResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      const changeReqId = data.data?.changeRequestId;
      if (!changeReqId) {
        throw new Error("No change request ID returned");
      }

      setChangeRequestId(changeReqId);
      setModalOpen(false);

      toast.push({
        title: "Cancellation submitted",
        description: "Your cancellation request has been submitted to TBO. Status will update shortly.",
        tone: "success",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Cancellation failed";
      setCancellationError(errorMsg);

      toast.push({
        title: "Cancellation failed",
        description: errorMsg,
        tone: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (changeRequestId) {
    return (
      <CancellationStatusTracker
        changeRequestId={changeRequestId}
        bookingRefNo={bookingRefNo}
        paidAmount={paidAmount}
        onProcessed={(refund) => {
          toast.push({
            title: "✓ Cancellation Approved",
            description: `Your refund of ${refund ? `₹${refund.toLocaleString()}` : "the calculated amount"} will be processed in 5-7 business days.`,
            tone: "success",
          });
        }}
        onRejected={() => {
          toast.push({
            title: "✗ Cancellation Rejected",
            description: "Your cancellation request was rejected. Contact support for assistance.",
            tone: "danger",
          });
        }}
      />
    );
  }

  return (
    <>
      <Button variant="accent" fullWidth onClick={() => setModalOpen(true)}>
        Cancel Booking
      </Button>

      <CancellationConfirmModal
        isOpen={modalOpen}
        hotelName={hotelName}
        bookingId={bookingId}
        bookingRefNo={bookingRefNo}
        paidAmount={paidAmount}
        cancellationFee={cancellationFee}
        refundAmount={refundAmount}
        cancellationDeadline={lastCancellationDeadline}
        onConfirm={handleConfirmCancel}
        onCancel={() => setModalOpen(false)}
        isLoading={isSubmitting}
        error={cancellationError || undefined}
      />
    </>
  );
}
