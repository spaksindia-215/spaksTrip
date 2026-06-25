"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { formatINR } from "@/lib/format";

interface CancellationConfirmModalProps {
  isOpen: boolean;
  hotelName: string;
  bookingId: number;
  bookingRefNo: string;
  paidAmount: number;
  cancellationFee: number;
  refundAmount: number;
  cancellationDeadline?: string;
  onConfirm: (remarks: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function CancellationConfirmModal({
  isOpen,
  hotelName,
  bookingId,
  bookingRefNo,
  paidAmount,
  cancellationFee,
  refundAmount,
  cancellationDeadline,
  onConfirm,
  onCancel,
  isLoading = false,
  error,
}: CancellationConfirmModalProps) {
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(remarks);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full shadow-lg">
        <div className="border-b border-border-soft p-6">
          <h2 className="text-[18px] font-bold text-ink">Confirm Cancellation</h2>
          <p className="text-[13px] text-ink-muted mt-1">
            Please review the details below before confirming.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Booking Details */}
          <div className="rounded-lg bg-surface-muted p-4">
            <p className="text-[12px] text-ink-muted font-semibold mb-2">BOOKING DETAILS</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[13px] text-ink">Hotel</span>
                <span className="text-[13px] font-semibold text-ink">{hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-ink">Booking ID</span>
                <span className="text-[13px] font-mono text-ink-muted">{bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-ink">Ref</span>
                <span className="text-[13px] font-mono text-ink-muted">{bookingRefNo}</span>
              </div>
            </div>
          </div>

          {/* Refund Breakdown */}
          <div className="rounded-lg bg-surface-muted p-4">
            <p className="text-[12px] text-ink-muted font-semibold mb-3">REFUND BREAKDOWN</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-border-soft">
                <span className="text-[13px] text-ink">Paid Amount</span>
                <span className="text-[13px] font-semibold text-ink">{formatINR(paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-soft">
                <span className="text-[13px] text-orange-700">Cancellation Fee</span>
                <span className="text-[13px] font-semibold text-orange-700">-{formatINR(cancellationFee)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[13px] font-bold text-green-700">You'll Receive</span>
                <span className="text-[14px] font-bold text-green-700">{formatINR(refundAmount)}</span>
              </div>
            </div>
          </div>

          {/* Deadline */}
          {cancellationDeadline && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-[12px] text-blue-900 font-semibold">Cancellation Deadline</p>
              <p className="text-[13px] text-blue-700 mt-1 font-medium">{cancellationDeadline}</p>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-[12px] text-ink-muted font-semibold mb-2">
              Additional Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Tell us why you're cancelling (optional)"
              className="w-full px-3 py-2 border border-border-soft rounded-lg text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              disabled={isLoading || isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-[12px] text-red-700">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-[11px] text-amber-800">
              ⚠️ This action cannot be undone. Your refund will be processed within 5-7 business days.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border-soft p-6 flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
          >
            Keep Booking
          </Button>
          <Button
            variant="accent"
            fullWidth
            onClick={handleConfirm}
            loading={isLoading || isSubmitting}
          >
            Cancel Booking
          </Button>
        </div>
      </div>
    </div>
  );
}
