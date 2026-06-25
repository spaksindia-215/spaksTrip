"use client";

import { useCancellationStatus } from "@/hooks/useCancellationStatus";
import { formatINR } from "@/lib/format";
import Button from "@/components/ui/Button";
import { useEffect } from "react";

interface CancellationStatusTrackerProps {
  changeRequestId: number;
  bookingRefNo: string;
  paidAmount: number;
  onProcessed?: (refund: number | undefined) => void;
  onRejected?: () => void;
}

export default function CancellationStatusTracker({
  changeRequestId,
  bookingRefNo,
  paidAmount,
  onProcessed,
  onRejected,
}: CancellationStatusTrackerProps) {
  const { status, refundAmount, cancellationCharge, isLoading, error } = useCancellationStatus({
    changeRequestId,
    bookingRefNo,
    enabled: true,
    pollInterval: 5000,
    onProcessed,
    onRejected,
  });

  const getStatusColor = () => {
    switch (status) {
      case "Processed":
        return "green";
      case "Rejected":
        return "red";
      case "InProgress":
        return "blue";
      default:
        return "amber";
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "Pending":
        return "Waiting for TBO to process your cancellation request...";
      case "InProgress":
        return "TBO is processing your cancellation request...";
      case "Processed":
        return "✓ Your cancellation has been approved!";
      case "Rejected":
        return "✗ Your cancellation request was rejected.";
      default:
        return "Checking status...";
    }
  };

  const colorClass = getStatusColor();
  const bgColor =
    colorClass === "green"
      ? "bg-green-50"
      : colorClass === "red"
        ? "bg-red-50"
        : colorClass === "blue"
          ? "bg-blue-50"
          : "bg-amber-50";
  const borderColor =
    colorClass === "green"
      ? "border-green-200"
      : colorClass === "red"
        ? "border-red-200"
        : colorClass === "blue"
          ? "border-blue-200"
          : "border-amber-200";
  const textColor =
    colorClass === "green"
      ? "text-green-800"
      : colorClass === "red"
        ? "text-red-800"
        : colorClass === "blue"
          ? "text-blue-800"
          : "text-amber-800";

  return (
    <div className={`rounded-xl ${bgColor} border ${borderColor} p-6 shadow-(--shadow-xs)`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className={`text-[15px] font-bold ${textColor}`}>Cancellation in Progress</h3>
        <div className="flex items-center gap-2">
          {isLoading && status !== "Processed" && status !== "Rejected" && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
              <span className={`text-[12px] ${textColor} font-medium`}>Updating...</span>
            </div>
          )}
        </div>
      </div>

      <p className={`text-[13px] ${textColor} mb-4`}>{getStatusMessage()}</p>

      {/* Status Details */}
      <div className="bg-white/50 rounded-lg p-4 mb-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-ink-muted">Status</span>
            <span className={`text-[13px] font-semibold ${textColor}`}>{status}</span>
          </div>

          {status === "Processed" && refundAmount !== undefined && (
            <>
              <div className="border-t border-border-soft pt-2 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] text-ink-muted">Refund Amount</span>
                  <span className="text-[13px] font-bold text-green-700">{formatINR(refundAmount)}</span>
                </div>
                {cancellationCharge !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-ink-muted">Cancellation Fee</span>
                    <span className="text-[13px] font-semibold text-orange-700">-{formatINR(cancellationCharge)}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-border-soft pt-2 mt-2">
                <p className="text-[11px] text-green-800 leading-relaxed">
                  ✓ Your refund will be processed to your original payment method within 5-7 business days.
                </p>
              </div>
            </>
          )}

          {status === "Rejected" && (
            <div className="border-t border-border-soft pt-2 mt-2">
              <p className="text-[11px] text-red-800 leading-relaxed">
                Your cancellation request was rejected. This may be due to the cancellation deadline passing or other
                restrictions. Please contact support for assistance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {/* Timeline Info */}
      {status !== "Processed" && status !== "Rejected" && (
        <div className="bg-white/50 rounded-lg p-3">
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Cancellations typically take 2-5 minutes to process. This page will update automatically as TBO
            processes your request. You can safely leave this page - we'll send you a confirmation email.
          </p>
        </div>
      )}
    </div>
  );
}
