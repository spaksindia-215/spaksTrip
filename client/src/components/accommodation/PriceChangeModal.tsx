"use client";

import Button from "@/components/ui/Button";
import { formatINR } from "@/lib/format";

type Props = {
  originalPrice: number;
  newPrice: number;
  changePercent: number;
  onAccept: () => void;
  onReject: () => void;
  isOpen: boolean;
};

export default function PriceChangeModal({
  originalPrice,
  newPrice,
  changePercent,
  onAccept,
  onReject,
  isOpen,
}: Props) {
  if (!isOpen) return null;

  const isIncrease = changePercent > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg mx-4">
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-full bg-amber-100 p-3">
            <svg
              viewBox="0 0 24 24"
              width={24}
              height={24}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-700"
              aria-hidden
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <h2 className="text-center text-[18px] font-bold text-ink mb-2">Price Update</h2>
        <p className="text-center text-[13px] text-ink-soft mb-6">
          The hotel rate has changed after we locked it in. Please review the new price before proceeding.
        </p>

        <div className="rounded-lg bg-surface-muted p-4 mb-6">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-border-soft">
            <span className="text-[13px] text-ink-soft">Original Price (Search):</span>
            <span className="text-[13px] font-semibold text-ink line-through">
              {formatINR(originalPrice)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-ink-soft">New Price (PreBook - Final):</span>
            <span
              className={`text-[15px] font-bold ${
                isIncrease ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatINR(newPrice)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-border-soft flex justify-between items-center">
            <span className="text-[13px] font-semibold text-ink">Price Change:</span>
            <span
              className={`text-[14px] font-bold ${
                isIncrease ? "text-red-600" : "text-green-600"
              }`}
            >
              {isIncrease ? "+" : ""}
              {formatINR(newPrice - originalPrice)} ({changePercent > 0 ? "+" : ""}
              {changePercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-amber-50 p-3 border border-amber-200">
          <p className="text-[12px] text-amber-900 leading-relaxed">
            <strong>⚠ Important:</strong> TBO will honor the price shown above (PreBook).
            This is the final amount you will be charged. If you don't accept this new rate,
            you can go back and select a different room.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={onReject}
            fullWidth
          >
            Go Back & Choose Another Room
          </Button>
          <Button
            variant="accent"
            size="lg"
            onClick={onAccept}
            fullWidth
          >
            Accept New Price & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
