"use client";

import { useMemo } from "react";
import Checkbox from "@/components/ui/Checkbox";
import Chip from "@/components/ui/Chip";
import RangeSlider from "@/components/ui/Slider";
import type { FlightOffer } from "@/lib/mock/flights";
import type { FlightFilters, TimeWindow } from "@/services/flights";
import { airlineName } from "@/lib/mock/flights";
import { formatINRShort, formatDuration } from "@/lib/format";

type Props = {
  offers: FlightOffer[];
  filters: FlightFilters;
  onChange: (f: FlightFilters) => void;
  priceRange: [number, number];
};

const WINDOWS: Array<{ v: TimeWindow; label: string; time: string }> = [
  { v: "early",     label: "Early",     time: "Before 6 AM" },
  { v: "morning",   label: "Morning",   time: "6 AM – 12 PM" },
  { v: "afternoon", label: "Afternoon", time: "12 PM – 6 PM" },
  { v: "evening",   label: "Evening",   time: "6 PM – 9 PM" },
  { v: "night",     label: "Night",     time: "After 9 PM" },
];

export default function FlightFiltersPanel({ offers, filters, onChange, priceRange }: Props) {
  const airlines = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of offers) {
      const code = o.segments[0].airlineCode;
      map.set(code, Math.min(map.get(code) ?? Infinity, o.basePrice));
    }
    return Array.from(map.entries())
      .map(([code, minPrice]) => ({ code, name: airlineName(code), minPrice }))
      .sort((a, b) => a.minPrice - b.minPrice);
  }, [offers]);

  const durationRange = useMemo<[number, number]>(() => {
    if (offers.length === 0) return [0, 0];
    const durations = offers.map((o) => o.totalDurationMin);
    return [Math.min(...durations), Math.max(...durations)];
  }, [offers]);

  const toggleStop = (s: 0 | 1 | 2) => {
    const cur = new Set(filters.stops ?? []);
    if (cur.has(s)) cur.delete(s);
    else cur.add(s);
    onChange({ ...filters, stops: Array.from(cur) });
  };

  const toggleAirline = (c: string) => {
    const cur = new Set(filters.airlines ?? []);
    if (cur.has(c)) cur.delete(c);
    else cur.add(c);
    onChange({ ...filters, airlines: Array.from(cur) });
  };

  const toggleWindow = (
    key: "departureWindows" | "arrivalWindows",
    w: TimeWindow,
  ) => {
    const cur = new Set(filters[key] ?? []);
    if (cur.has(w)) cur.delete(w);
    else cur.add(w);
    onChange({ ...filters, [key]: Array.from(cur) });
  };

  return (
    <aside className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-ink">Filters</h3>
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-[12px] font-semibold text-brand-700 hover:underline"
        >
          Clear all
        </button>
      </div>

      <Section title="Stops">
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((s) => (
            <Chip
              key={s}
              active={(filters.stops ?? []).includes(s as 0 | 1 | 2)}
              onClick={() => toggleStop(s as 0 | 1 | 2)}
            >
              {s === 0 ? "Non-stop" : s === 1 ? "1 stop" : "2+ stops"}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Price">
        <RangeSlider
          min={priceRange[0]}
          max={priceRange[1] || priceRange[0] + 1}
          step={100}
          value={[
            priceRange[0],
            filters.maxPrice ?? (priceRange[1] || priceRange[0] + 1),
          ]}
          onChange={([, v]) => onChange({ ...filters, maxPrice: v })}
          formatLabel={(n) => formatINRShort(n)}
        />
      </Section>

      <Section title="Departure time">
        <WindowGrid
          selected={filters.departureWindows ?? []}
          onToggle={(w) => toggleWindow("departureWindows", w)}
        />
      </Section>

      <Section title="Arrival time">
        <WindowGrid
          selected={filters.arrivalWindows ?? []}
          onToggle={(w) => toggleWindow("arrivalWindows", w)}
        />
      </Section>

      {durationRange[1] > durationRange[0] && (
        <Section title="Trip duration">
          <RangeSlider
            min={durationRange[0]}
            max={durationRange[1]}
            step={15}
            value={[durationRange[0], filters.maxDurationMin ?? durationRange[1]]}
            onChange={([, v]) => onChange({ ...filters, maxDurationMin: v })}
            formatLabel={(n) => formatDuration(n)}
          />
        </Section>
      )}

      <Section title="Airlines">
        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto scrollbar-thin">
          {airlines.map((a) => (
            <label key={a.code} className="flex items-center justify-between gap-2 cursor-pointer">
              <Checkbox
                checked={(filters.airlines ?? []).includes(a.code)}
                onChange={() => toggleAirline(a.code)}
                label={a.name}
              />
              <span className="text-[12px] font-semibold text-ink-muted">
                {formatINRShort(a.minPrice)}
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Fare type">
        <Checkbox
          checked={Boolean(filters.refundableOnly)}
          onChange={(e) => onChange({ ...filters, refundableOnly: e.target.checked })}
          label="Refundable only"
        />
      </Section>
    </aside>
  );
}

function WindowGrid({
  selected,
  onToggle,
}: {
  selected: TimeWindow[];
  onToggle: (w: TimeWindow) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {WINDOWS.map((w) => {
        const active = selected.includes(w.v);
        return (
          <button
            key={w.v}
            type="button"
            onClick={() => onToggle(w.v)}
            className={
              "rounded-md border text-left px-3 py-2 transition-colors " +
              (active
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-border bg-white text-ink-soft hover:bg-surface-muted")
            }
          >
            <div className="text-[12px] font-semibold">{w.label}</div>
            <div className="text-[10px] text-ink-muted">{w.time}</div>
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[13px] font-bold uppercase tracking-wide text-ink-muted mb-2">
        {title}
      </div>
      {children}
    </section>
  );
}
