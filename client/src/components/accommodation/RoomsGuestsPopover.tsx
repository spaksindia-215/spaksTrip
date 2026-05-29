"use client";

import { useMemo } from "react";
import Popover from "@/components/ui/Popover";
import { OCCUPANCY_LIMITS, validateOccupancy } from "@/lib/validators/occupancyValidation";

type Props = {
  rooms: number;
  adults: number;
  children: number;
  onRoomsChange: (n: number) => void;
  onAdultsChange: (n: number) => void;
  onChildrenChange: (n: number) => void;
};

function Counter({
  label,
  sub,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  sub?: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        {sub && <p className="text-[11px] text-ink-muted">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-ink-soft hover:border-brand-500 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="w-6 text-center text-[14px] font-bold text-ink">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-ink-soft hover:border-brand-500 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function RoomsGuestsPopover({ rooms, adults, children, onRoomsChange, onAdultsChange, onChildrenChange }: Props) {
  const summary = `${rooms} Room${rooms > 1 ? "s" : ""} · ${adults + children} Guest${adults + children !== 1 ? "s" : ""}`;

  // Calculate dynamic max values based on TBO limits
  const maxAdultsTotal = rooms * OCCUPANCY_LIMITS.MAX_ADULTS_PER_ROOM;
  const maxChildrenTotal = rooms * OCCUPANCY_LIMITS.MAX_CHILDREN_PER_ROOM;

  // Validate current occupancy
  const occupancyValidation = useMemo(
    () => validateOccupancy(rooms, adults, children),
    [rooms, adults, children],
  );

  const handleAdultsChange = (value: number) => {
    // Ensure we don't exceed max adults per room
    if (value <= maxAdultsTotal) {
      onAdultsChange(value);
    }
  };

  const handleChildrenChange = (value: number) => {
    // Ensure we don't exceed max children per room
    if (value <= maxChildrenTotal) {
      onChildrenChange(value);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-ink-muted">Rooms & Guests</span>
      <Popover
        placement="bottom-start"
        trigger={({ open, toggle, ref }) => (
          <button
            ref={ref}
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="flex h-11 w-full items-center gap-2 rounded-lg border border-border bg-white px-3 text-left text-[14px] font-semibold text-ink hover:border-brand-500 transition-colors"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-ink-muted">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {summary}
          </button>
        )}
      >
        {({ close }) => (
          <div className="w-72 p-4">
            <div className="divide-y divide-border-soft">
              <Counter
                label="Rooms"
                value={rooms}
                min={1}
                max={OCCUPANCY_LIMITS.MAX_ROOMS}
                onChange={onRoomsChange}
              />
              <Counter
                label="Adults"
                sub="Age 18+ (max 10 per room)"
                value={adults}
                min={1}
                max={maxAdultsTotal}
                onChange={handleAdultsChange}
              />
              <Counter
                label="Children"
                sub="Age 0–17 (max 6 per room)"
                value={children}
                min={0}
                max={maxChildrenTotal}
                onChange={handleChildrenChange}
              />
            </div>

            {/* Validation Message */}
            {!occupancyValidation.valid && (
              <div className="mt-3 p-2 rounded-lg bg-danger-50 border border-danger-200">
                <p className="text-[12px] text-danger-700 font-medium">{occupancyValidation.error}</p>
              </div>
            )}

            {/* Warning for High Occupancy */}
            {occupancyValidation.valid && occupancyValidation.warning && (
              <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-[12px] text-amber-700 font-medium">{occupancyValidation.warning}</p>
              </div>
            )}

            <button
              type="button"
              onClick={close}
              disabled={!occupancyValidation.valid}
              className="mt-3 w-full rounded-lg bg-brand-600 py-2 text-[13px] font-semibold text-white hover:bg-brand-700 transition-colors disabled:bg-ink-muted disabled:cursor-not-allowed"
            >
              Done
            </button>
          </div>
        )}
      </Popover>
    </div>
  );
}
