"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { taxiCities } from "@/data/taxi/packages";
import { TAXI_CATEGORIES, TAXI_MODES, defaultTaxiSearch, searchParamsToQuery } from "@/lib/taxiPackage";
import { cn } from "@/lib/cn";
import type { TaxiSearchParams, TaxiTripMode } from "@/types/taxi";
import { CalendarIcon, CarIcon, ClockIcon, MapPinIcon } from "./TaxiIcons";

type Props = {
  initial?: TaxiSearchParams;
  compact?: boolean;
};

export default function TaxiSearchForm({ initial = defaultTaxiSearch, compact }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<TaxiSearchParams>(initial);

  function setField<Key extends keyof TaxiSearchParams>(key: Key, value: TaxiSearchParams[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    const normalized = {
      ...form,
      pickupCity: form.pickupCity.trim() || defaultTaxiSearch.pickupCity,
      pickupLocation: form.pickupLocation.trim() || defaultTaxiSearch.pickupLocation,
      destination: form.destination.trim() || defaultTaxiSearch.destination,
    };
    router.push(`/taxi-package/results?${searchParamsToQuery(normalized).toString()}`);
  }

  return (
    <div className={cn("rounded-lg border border-border-soft bg-white shadow-[var(--shadow-lg)]", compact ? "p-4" : "p-4 sm:p-5")}>
      <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-muted p-1">
        {TAXI_MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => setField("mode", mode.value as TaxiTripMode)}
            className={cn(
              "min-h-12 rounded-md px-2 text-center text-[12px] font-semibold transition-colors sm:text-[13px]",
              form.mode === mode.value ? "bg-white text-brand-700 shadow-[var(--shadow-xs)]" : "text-ink-muted hover:text-ink",
            )}
          >
            <span className="block">{mode.label}</span>
            {!compact ? <span className="hidden text-[10px] font-medium text-ink-muted md:block">{mode.description}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="flex flex-col gap-1 xl:col-span-1">
          <span className="text-[12px] font-semibold text-ink-muted">Pickup city</span>
          <div className="relative">
            <MapPinIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
            <input
              value={form.pickupCity}
              onChange={(event) => setField("pickupCity", event.target.value)}
              list="taxi-cities"
              className="h-11 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="Delhi"
            />
          </div>
        </label>

        <Input
          label="Pickup location"
          value={form.pickupLocation}
          onChange={(event) => setField("pickupLocation", event.target.value)}
          placeholder="Hotel, airport, address"
          className="xl:col-span-2"
        />

        <Input
          label={form.mode === "local" ? "Package area" : "Destination"}
          value={form.destination}
          onChange={(event) => setField("destination", event.target.value)}
          placeholder={form.mode === "airport" ? "City / hotel drop" : "Agra, Pune, Jaipur"}
          className="xl:col-span-1"
        />

        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-ink-muted">Pickup date</span>
          <div className="relative">
            <CalendarIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
            <input
              type="date"
              value={form.pickupDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setField("pickupDate", event.target.value)}
              className="h-11 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-ink-muted">Pickup time</span>
          <div className="relative">
            <ClockIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
            <input
              type="time"
              value={form.pickupTime}
              onChange={(event) => setField("pickupTime", event.target.value)}
              className="h-11 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-ink-muted">Cab type</span>
          <div className="relative">
            <CarIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
            <select
              value={form.cabType}
              onChange={(event) => setField("cabType", event.target.value as TaxiSearchParams["cabType"])}
              className="h-11 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="any">Any cab type</option>
              {TAXI_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </label>
        <Button type="button" size="lg" variant="accent" onClick={submit} className="self-end md:min-w-44">
          Search Cabs
        </Button>
      </div>

      <datalist id="taxi-cities">
        {taxiCities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </div>
  );
}
