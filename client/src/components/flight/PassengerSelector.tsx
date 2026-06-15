"use client";

import Popover from "@/components/ui/Popover";
import type { CabinClass } from "@/lib/mock/flights";
import type { PaxCounts } from "@/state/flightSearchStore";

const CABIN_LABEL: Record<CabinClass, string> = {
  ECONOMY: "Economy",
  PREMIUM_ECONOMY: "Premium Economy",
  BUSINESS: "Business",
  FIRST: "First",
};

export default function PassengerSelector({
  pax,
  cabin,
  onPaxChange,
  onCabinChange,
}: {
  pax: PaxCounts;
  cabin: CabinClass;
  onPaxChange: (p: PaxCounts) => void;
  onCabinChange: (c: CabinClass) => void;
}) {
  const total = pax.adults + pax.children + pax.infants;
  // TBO/Search rule: a single journey may carry at most 9 passengers (Adults +
  // Children + Infants combined). Each "+" is gated on the remaining shared slots
  // so no individual counter can push the total past 9.
  const MAX_PAX = 9;
  const remaining = Math.max(0, MAX_PAX - total);

  return (
    <Popover
      panelClassName="p-4 w-[340px] max-w-[92vw]"
      trigger={({ toggle, ref }) => (
        <button
          type="button"
          ref={ref}
          onClick={toggle}
          className="flex min-w-[240px] h-12 flex-col justify-center gap-0.5 rounded-md border border-border bg-white shadow-sm px-4 text-left hover:border-brand-400 transition-colors"
        >
          <span className="text-[11px] font-medium text-ink-muted">Travellers & Cabin</span>
          <span className="text-[14px] font-semibold text-ink truncate">
            {total} Traveller{total !== 1 ? "s" : ""}, {CABIN_LABEL[cabin]}
          </span>
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            Travellers
          </div>
          <div className="flex flex-col gap-3">
            <Counter
              label="Adults"
              desc="12+ years"
              value={pax.adults}
              min={1}
              max={Math.min(MAX_PAX, pax.adults + remaining)}
              onChange={(v) => onPaxChange({ ...pax, adults: v })}
            />
            <Counter
              label="Children"
              desc="2 – 12 years"
              value={pax.children}
              min={0}
              max={Math.min(MAX_PAX, pax.children + remaining)}
              onChange={(v) => onPaxChange({ ...pax, children: v })}
            />
            <Counter
              label="Infants"
              desc="Under 2 years"
              value={pax.infants}
              min={0}
              // Infants are also capped at one per adult (lap infants).
              max={Math.min(pax.adults, pax.infants + remaining)}
              onChange={(v) => onPaxChange({ ...pax, infants: v })}
            />
          </div>
          {remaining === 0 && (
            <p className="mt-2 text-[11px] font-medium text-ink-muted">
              Maximum {MAX_PAX} passengers per journey reached.
            </p>
          )}
          <div className="mt-5 mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            Cabin class
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CABIN_LABEL) as CabinClass[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCabinChange(c)}
                className={
                  "rounded-md border px-3 h-10 text-[13px] font-semibold transition-colors " +
                  (c === cabin
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-ink-soft border-border hover:bg-surface-muted")
                }
              >
                {CABIN_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={close}
              className="inline-flex items-center rounded-md bg-brand-600 text-white px-4 h-9 text-[13px] font-semibold hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

function Counter({
  label,
  desc,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  desc: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const canMinus = value > min;
  const canPlus = value < max;
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-[14px] font-semibold text-ink">{label}</span>
        <span className="text-[11px] text-ink-muted">{desc}</span>
      </div>
      <div className="flex items-center gap-3">
        <IconBtn disabled={!canMinus} onClick={() => onChange(value - 1)} symbol="minus" aria={`Decrease ${label}`} />
        <span className="min-w-[1.25rem] text-center text-[14px] font-semibold">{value}</span>
        <IconBtn disabled={!canPlus} onClick={() => onChange(value + 1)} symbol="plus" aria={`Increase ${label}`} />
      </div>
    </div>
  );
}

function IconBtn({
  disabled,
  onClick,
  symbol,
  aria,
}: {
  disabled?: boolean;
  onClick: () => void;
  symbol: "plus" | "minus";
  aria: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={aria}
      className="grid h-7 w-7 place-items-center rounded-full border border-border text-ink-soft hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
        <line x1={5} y1={12} x2={19} y2={12} />
        {symbol === "plus" ? <line x1={12} y1={5} x2={12} y2={19} /> : null}
      </svg>
    </button>
  );
}
