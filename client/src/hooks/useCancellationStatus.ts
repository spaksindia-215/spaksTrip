import { useEffect, useState } from "react";

export type CancellationStatusType = "Pending" | "InProgress" | "Processed" | "Rejected";

export interface CancellationStatusData {
  status: CancellationStatusType;
  refundAmount?: number;
  cancellationCharge?: number;
  responseStatus?: number;
}

export interface UseCancellationStatusProps {
  changeRequestId: number;
  bookingRefNo: string;
  enabled?: boolean;
  pollInterval?: number;
  onProcessed?: (refund: number | undefined) => void;
  onRejected?: (reason?: string) => void;
}

export function useCancellationStatus({
  changeRequestId,
  bookingRefNo,
  enabled = true,
  pollInterval = 5000,
  onProcessed,
  onRejected,
}: UseCancellationStatusProps) {
  const [status, setStatus] = useState<CancellationStatusType>("Pending");
  const [refundAmount, setRefundAmount] = useState<number | undefined>();
  const [cancellationCharge, setCancellationCharge] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const pollStatus = async () => {
      try {
        const url = new URL("/api/hotels/cancel/status", typeof window !== "undefined" ? window.location.origin : "");
        url.searchParams.append("changeRequestId", String(changeRequestId));
        url.searchParams.append("bookingRefNo", bookingRefNo);

        const res = await fetch(url.toString());
        if (!res.ok) {
          throw new Error(`Status check failed: ${res.statusText}`);
        }

        const data = await res.json();

        if (!isMounted) return;

        const statusData: CancellationStatusData = data.data;
        setStatus(statusData.status);
        setRefundAmount(statusData.refundAmount);
        setCancellationCharge(statusData.cancellationCharge);
        setError(null);
        setIsLoading(false);

        if (statusData.status === "Processed") {
          if (intervalId) clearInterval(intervalId);
          onProcessed?.(statusData.refundAmount);
        } else if (statusData.status === "Rejected") {
          if (intervalId) clearInterval(intervalId);
          onRejected?.();
        }
      } catch (err) {
        if (!isMounted) return;
        const errorMsg = err instanceof Error ? err.message : "Status check failed";
        setError(errorMsg);
        setIsLoading(false);
      }
    };

    pollStatus();
    intervalId = setInterval(pollStatus, pollInterval);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [changeRequestId, bookingRefNo, enabled, pollInterval, onProcessed, onRejected]);

  return {
    status,
    refundAmount,
    cancellationCharge,
    isLoading,
    error,
  };
}
