"use client";

import Combobox, { type ComboOption } from "@/components/ui/Combobox";
import { useAirportSearch } from "@/hooks/useAirportSearch";
import { getAirport, type Airport } from "@/lib/mock/airports";

type Props = {
  label: string;
  placeholder?: string;
  value: Airport | null;
  onChange: (a: Airport | null) => void;
};

export default function AirportField({ label, placeholder, value, onChange }: Props) {
  const search = useAirportSearch();

  const option: ComboOption | null = value
    ? {
        value: value.code,
        label: `${value.city} (${value.code})`,
        sublabel: value.name,
        badge: value.countryCode,
      }
    : null;

  return (
    <Combobox
      label={label}
      placeholder={placeholder ?? "Search city or airport"}
      value={option}
      onChange={(o) => onChange(o ? getAirport(o.value) : null)}
      search={search}
      minQuery={0}
      renderValue={(o) => (
        <span className=" shadow-sm flex flex-col">
          <span className="text-[15px] font-bold text-ink leading-tight">
            {o.value}{" "}
            <span className="text-[13px] font-semibold text-ink-soft">
              {o.label.replace(` (${o.value})`, "")}
            </span>
          </span>
          <span className="text-[11px] text-ink-muted truncate">{o.sublabel}</span>
        </span>
      )}
      renderOption={(o) => (
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-ink truncate">
              {o.label.replace(` (${o.value})`, "")}
            </span>
            <span className="text-[11px] text-ink-muted truncate">{o.sublabel}</span>
          </div>
          <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">
            {o.value}
          </span>
        </div>
      )}
    />
  );
}
