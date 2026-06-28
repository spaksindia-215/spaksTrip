"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export type DateRange = { from: Date | null; to: Date | null };

type Props = {
  value: DateRange;
  onChange: (v: DateRange) => void;
  mode?: "range" | "single";
  minDate?: Date;
  placeholderFrom?: string;
  placeholderTo?: string;
  labelFrom?: string;
  labelTo?: string;
  className?: string;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["S","M","T","W","T","F","S"];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function stripTime(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function sameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function between(d: Date, a: Date, b: Date) { const x=stripTime(d).getTime(), lo=Math.min(stripTime(a).getTime(),stripTime(b).getTime()), hi=Math.max(stripTime(a).getTime(),stripTime(b).getTime()); return x>=lo && x<=hi; }

export function formatDate(d: Date | null) {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShort(d: Date | null) {
  if (!d) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

type Coords = { top: number; left: number };

export default function DateRangePicker({
  value,
  onChange,
  mode = "range",
  minDate,
  placeholderFrom = "Select date",
  placeholderTo = "Return",
  labelFrom = "Departure",
  labelTo = "Return",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(value.from ?? new Date()));
  const [pickingTo, setPickingTo] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  // Compute viewport-relative coords for the fixed-position portal panel.
  const computeCoords = useCallback((): Coords | null => {
  const el = rootRef.current;
  if (!el) return null;

  const r = el.getBoundingClientRect();

  const panelW = Math.min(640, window.innerWidth - 16);
  const left = Math.max(8, Math.min(r.left, window.innerWidth - panelW - 8));

  const panelHeight = 420;
  const spaceBelow = window.innerHeight - r.bottom;

  const openUp = spaceBelow < panelHeight;

  return {
    top: openUp ? r.top - panelHeight - 6 : r.bottom + 6,
    left,
  };
}, []);

  useEffect(() => {
    if (!open) return;
    setCoords(computeCoords());

    const onOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      // Keep open when clicking inside the trigger wrapper OR inside the portal panel.
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // Close on any scroll (simpler and expected UX for a fixed overlay).
    const onDismiss = () => setOpen(false);

    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onDismiss, { capture: true, passive: true });
    window.addEventListener("resize", onDismiss, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onDismiss, { capture: true });
      window.removeEventListener("resize", onDismiss);
    };
  }, [open, computeCoords]);

  const minStripped = minDate ? stripTime(minDate) : stripTime(new Date());

  const onDayClick = (d: Date) => {
    if (mode === "single") {
      onChange({ from: d, to: null });
      setOpen(false);
      return;
    }
    if (!value.from || (value.from && value.to) || !pickingTo) {
      onChange({ from: d, to: null });
      setPickingTo(true);
      return;
    }
    if (stripTime(d) < stripTime(value.from)) {
      onChange({ from: d, to: value.from });
    } else {
      onChange({ from: value.from, to: d });
    }
    setPickingTo(false);
    setOpen(false);
  };

  const months = [viewMonth, addMonths(viewMonth, 1)];

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setPickingTo(false); }}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full gap-0 rounded-md border border-border bg-white h-11 sm:h-12 items-center text-left hover:border-brand-500 shadow-sm transition-all"
      >
        <DateCell label={labelFrom} value={value.from} placeholder={placeholderFrom} />
        {mode === "range" && (
          <>
            <span className="w-px self-stretch bg-border" />
            <DateCell label={labelTo} value={value.to} placeholder={placeholderTo} />
          </>
        )}
      </button>

      {open && coords && createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
          className="rounded-2xl border border-border-soft bg-white p-5 shadow-xl animate-pop-in w-[min(600px,calc(90vw-1rem))] max-h-[80vh] overflow-auto"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-border-soft bg-white hover:bg-brand-50 hover:text-brand-600 transition-all"
              aria-label="Previous month"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-border-soft bg-white hover:bg-brand-50 hover:text-brand-600 transition-all"
              aria-label="Next month"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {months.map((m) => (
              <Month
                key={m.toISOString()}
                monthDate={m}
                value={value}
                min={minStripped}
                onPick={onDayClick}
              />
            ))}
          </div>
          {mode === "range" && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-soft text-[12px] text-ink-muted">
              <span>Click departure then return date</span>
              <button
                type="button"
                onClick={() => { onChange({ from: null, to: null }); setPickingTo(false); }}
                className="font-semibold text-brand-700 hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function DateCell({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: Date | null;
  placeholder: string;
}) {
  return (
    <div className="flex-1 min-w-0 px-4">
      <div className="text-[11px] tracking-wide uppercase font-medium text-ink-muted">{label}</div>
      <div className="text-[15px] font-semibold text-ink truncate">
        {value ? formatDate(value) : <span className="text-ink-subtle">{placeholder}</span>}
      </div>
    </div>
  );
}

function Month({
  monthDate,
  value,
  min,
  onPick,
}: {
  monthDate: Date;
  value: DateRange;
  min: Date;
  onPick: (d: Date) => void;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(new Date(year, month, d));

  return (
    <div>
      <div className="text-center text-[15px] tracking-wide font-semibold text-ink mb-2">
        {MONTHS_FULL[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {DOW.map((d, i) => (
          <div key={i} className="h-8 grid place-items-center text-[11px] tracking-wide uppercase font-semibold text-ink-subtle">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const disabled = stripTime(d) < min;
          const isFrom = value.from && sameDay(d, value.from);
          const isTo = value.to && sameDay(d, value.to);
          const inRange = value.from && value.to && between(d, value.from, value.to);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onPick(d)}
              className={cn(
  "h-10 w-full rounded-full text-[13px] font-semibold transition-all duration-150",
  "flex items-center justify-center",

  disabled && "text-ink-subtle cursor-not-allowed",

  !disabled && !inRange && "hover:bg-brand-50 text-ink",

  inRange && !(isFrom || isTo) && "bg-brand-100 text-brand-700",

  (isFrom || isTo) &&
    "bg-brand-600 text-white shadow-md scale-105",

  (isFrom || isTo) && "rounded-full",

  // smooth range connection effect
  inRange && "relative z-0"
)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
