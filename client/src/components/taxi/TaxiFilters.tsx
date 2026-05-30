"use client";

import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import { TAXI_CATEGORIES, defaultTaxiFilters } from "@/lib/taxiPackage";
import type { TaxiCabCategory, TaxiFilters as TaxiFiltersType } from "@/types/taxi";

type Props = {
  filters: TaxiFiltersType;
  onChange: (filters: TaxiFiltersType) => void;
};

export default function TaxiFilters({ filters, onChange }: Props) {
  function toggleCategory(category: TaxiCabCategory) {
    const exists = filters.categories.includes(category);
    onChange({
      ...filters,
      categories: exists ? filters.categories.filter((item) => item !== category) : [...filters.categories, category],
    });
  }

  return (
    <aside className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold text-ink">Filters</h2>
        <button type="button" onClick={() => onChange(defaultTaxiFilters)} className="text-[12px] font-bold text-brand-700">
          Reset
        </button>
      </div>

      <section>
        <h3 className="mb-3 text-[13px] font-bold text-ink">Price range</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filters.minPrice}
            min={0}
            onChange={(event) => onChange({ ...filters, minPrice: Number(event.target.value) || 0 })}
            className="h-10 rounded-md border border-border px-3 text-[13px] outline-none focus:border-brand-500"
            aria-label="Minimum price"
          />
          <input
            type="number"
            value={filters.maxPrice}
            min={0}
            onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value) || 0 })}
            className="h-10 rounded-md border border-border px-3 text-[13px] outline-none focus:border-brand-500"
            aria-label="Maximum price"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-bold text-ink">Cab type</h3>
        <div className="space-y-2">
          {TAXI_CATEGORIES.map((category) => (
            <Checkbox
              key={category.value}
              id={`filter-${category.value}`}
              label={category.label}
              checked={filters.categories.includes(category.value)}
              onChange={() => toggleCategory(category.value)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-bold text-ink">AC preference</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["all", "All"],
            ["ac", "AC"],
            ["non-ac", "Non-AC"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...filters, ac: value as TaxiFiltersType["ac"] })}
              className={`h-9 rounded-md border text-[12px] font-bold ${filters.ac === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-ink-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-bold text-ink">Minimum rating</h3>
        <select
          value={filters.minRating}
          onChange={(event) => onChange({ ...filters, minRating: Number(event.target.value) })}
          className="h-10 w-full rounded-md border border-border bg-white px-3 text-[13px] outline-none focus:border-brand-500"
        >
          <option value={0}>Any rating</option>
          <option value={4}>4.0+</option>
          <option value={4.5}>4.5+</option>
          <option value={4.8}>4.8+</option>
        </select>
      </section>

      <Checkbox
        id="popular-only"
        label="Popular packages only"
        checked={filters.popularOnly}
        onChange={(event) => onChange({ ...filters, popularOnly: event.target.checked })}
      />

      <Button type="button" variant="secondary" fullWidth onClick={() => onChange(filters)}>
        Apply Filters
      </Button>
    </aside>
  );
}
