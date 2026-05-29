"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

type Props = {
  isOpen: boolean;
  minutesRemaining: number;
  secondsRemaining: number;
  onNewSearch: () => void;
};

export default function SessionTimeoutModal({
  isOpen,
  minutesRemaining,
  secondsRemaining,
  onNewSearch,
}: Props) {
  const [displayTime, setDisplayTime] = useState(`${minutesRemaining}m ${secondsRemaining}s`);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setDisplayTime((prev) => {
        const parts = prev.split(" ");
        let mins = parseInt(parts[0], 10);
        let secs = parseInt(parts[1], 10);

        secs--;
        if (secs < 0) {
          mins--;
          secs = 59;
        }

        if (mins < 0) {
          return "EXPIRED";
        }

        return `${mins}m ${secs}s`;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const isExpired = displayTime === "EXPIRED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg mx-4">
        <div className="mb-4 flex items-center justify-center">
          <div className={`rounded-full p-3 ${isExpired ? "bg-red-100" : "bg-amber-100"}`}>
            <svg
              viewBox="0 0 24 24"
              width={24}
              height={24}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isExpired ? "text-red-700" : "text-amber-700"}
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <h2 className="text-center text-[18px] font-bold text-ink mb-2">
          {isExpired ? "Session Expired" : "Session Timeout Warning"}
        </h2>

        <p className="text-center text-[13px] text-ink-soft mb-6">
          {isExpired
            ? "Your booking session has expired. TBO API sessions are only valid for 40 minutes from the initial search. Please start a new search to continue."
            : `Your booking session will expire in ${displayTime}. TBO API sessions are only valid for 40 minutes. Complete your booking or start a new search.`}
        </p>

        <div className={`rounded-lg p-4 mb-6 ${isExpired ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[13px] font-semibold ${isExpired ? "text-red-900" : "text-amber-900"}`}>
              Time Remaining:
            </span>
            <span
              className={`text-[16px] font-bold font-mono ${
                isExpired ? "text-red-600" : "text-amber-600"
              }`}
            >
              {displayTime}
            </span>
          </div>
          {!isExpired && (
            <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{
                  width: `${Math.max(0, ((minutesRemaining * 60 + secondsRemaining) / (40 * 60)) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        <div
          className={`rounded-lg p-3 mb-6 ${isExpired ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}
        >
          <p
            className={`text-[12px] leading-relaxed ${isExpired ? "text-red-900" : "text-blue-900"}`}
          >
            <strong>ℹ Session Timeout:</strong> TBO API maintains session validity for exactly 40 minutes
            from the initial hotel search. This is a strict limit. Once expired, your booking code becomes
            invalid and all subsequent PreBook and Book requests will fail. Please start a fresh search.
          </p>
        </div>

        <Button variant="accent" size="lg" onClick={onNewSearch} fullWidth>
          {isExpired ? "Start New Search" : "Start New Search Now"}
        </Button>
      </div>
    </div>
  );
}
