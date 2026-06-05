"use client";

import type { FlightFilters, TimeWindow } from "@/services/flights";
import { countActiveFilters } from "@/services/flights";
import { airlineName } from "@/lib/mock/flights";
import { formatINRShort, formatDuration } from "@/lib/format";

const WINDOW_LABEL: Record<TimeWindow, string> = {
  early: "Early",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

type Props = {
  filters: FlightFilters;
  onChange: (f: FlightFilters) => void;
};

/** A removable chip representing one active filter value. */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 pl-3 pr-1.5 py-1 text-[12px] font-semibold text-brand-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="grid h-4 w-4 place-items-center rounded-full text-brand-700/70 hover:bg-brand-100 hover:text-brand-700"
      >
        ✕
      </button>
    </span>
  );
}

export default function ActiveFilterChips({ filters, onChange }: Props) {
  if (countActiveFilters(filters) === 0) return null;

  const stopLabel = (s: 0 | 1 | 2) => (s === 0 ? "Non-stop" : s === 1 ? "1 stop" : "2+ stops");

  const removeFromArray = <T,>(key: keyof FlightFilters, value: T) => {
    const arr = (filters[key] as T[] | undefined) ?? [];
    const next = arr.filter((v) => v !== value);
    onChange({ ...filters, [key]: next.length ? next : undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {(filters.stops ?? []).map((s) => (
        <FilterChip key={`stop-${s}`} label={stopLabel(s)} onRemove={() => removeFromArray("stops", s)} />
      ))}

      {(filters.departureWindows ?? []).map((w) => (
        <FilterChip key={`dep-${w}`} label={`Departs ${WINDOW_LABEL[w]}`} onRemove={() => removeFromArray("departureWindows", w)} />
      ))}

      {(filters.arrivalWindows ?? []).map((w) => (
        <FilterChip key={`arr-${w}`} label={`Arrives ${WINDOW_LABEL[w]}`} onRemove={() => removeFromArray("arrivalWindows", w)} />
      ))}

      {(filters.airlines ?? []).map((code) => (
        <FilterChip key={`air-${code}`} label={airlineName(code)} onRemove={() => removeFromArray("airlines", code)} />
      ))}

      {typeof filters.maxPrice === "number" && (
        <FilterChip
          label={`Under ${formatINRShort(filters.maxPrice)}`}
          onRemove={() => onChange({ ...filters, maxPrice: undefined })}
        />
      )}

      {typeof filters.maxDurationMin === "number" && (
        <FilterChip
          label={`Under ${formatDuration(filters.maxDurationMin)}`}
          onRemove={() => onChange({ ...filters, maxDurationMin: undefined })}
        />
      )}

      {filters.refundableOnly && (
        <FilterChip label="Refundable" onRemove={() => onChange({ ...filters, refundableOnly: undefined })} />
      )}

      <button
        type="button"
        onClick={() => onChange({})}
        className="text-[12px] font-semibold text-ink-muted hover:text-ink hover:underline ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
