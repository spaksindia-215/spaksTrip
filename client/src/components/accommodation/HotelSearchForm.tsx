"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useToast } from "@/components/ui/Toast";
import { useHotelSearchStore } from "@/state/hotelSearchStore";
import { toIsoDate } from "@/lib/format";
import DestinationField from "./DestinationField";
import CitySelector from "./CitySelector";
import RoomsGuestsPopover from "./RoomsGuestsPopover";
import NationalitySelector from "./NationalitySelector";

export default function HotelSearchForm() {
  const router = useRouter();
  const toast = useToast();
  const {
    destination, checkIn, checkOut, rooms, adults, children, childrenAges, nationality,
    setDestination, setCheckIn, setCheckOut, setRooms, setAdults, setChildren, setChildrenAges, setNationality, pushRecent,
  } = useHotelSearchStore();

  const [submitting, setSubmitting] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{ code: string; name: string } | null>(
    destination?.kind === "country" ? destination.city ?? null : null
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkoutMinDate = checkIn
    ? new Date(new Date(checkIn).getTime() + 24 * 60 * 60 * 1000)
    : today;

  const onSearch = () => {
    if (!destination) {
      toast.push({ title: "Choose a country or enter a postal code", tone: "warn" });
      return;
    }
    if (!checkIn) { toast.push({ title: "Pick a check-in date", tone: "warn" }); return; }
    if (!checkOut) { toast.push({ title: "Pick a check-out date", tone: "warn" }); return; }
    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.push({ title: "Check-out must be after check-in", tone: "warn" });
      return;
    }
    setSubmitting(true);

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
      nationality,
    });
    if (childrenAges.length > 0) {
      params.set("childrenAges", childrenAges.join(","));
    }

    if (destination.kind === "country") {
      params.set("country", destination.code);
      // Prefer the standalone CitySelector selection; fall back to city embedded in DestinationField
      const effectiveCity = selectedCity ?? (destination.city ?? null);
      if (!effectiveCity) {
        setSubmitting(false);
        toast.push({ title: "Please select a city to search hotels", tone: "warn" });
        return;
      }
      params.set("city", effectiveCity.code);
      params.set("cityName", effectiveCity.name);
      const label = `${effectiveCity.name}, ${destination.name}`;
      pushRecent({
        id: `country-${destination.code}-${effectiveCity.code}-${checkIn}`,
        label: `${label} · ${checkIn}`,
        cityCode: effectiveCity.code,
        when: new Date().toISOString(),
      });
    } else {
      params.set("postalCode", destination.postalCode);
      pushRecent({
        id: `postal-${destination.postalCode}-${checkIn}`,
        label: `Postal ${destination.postalCode} · ${checkIn}`,
        cityCode: destination.postalCode,
        when: new Date().toISOString(),
      });
    }

    router.push(`/hotel/results?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-(--shadow-lg) md:p-6">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_1fr] lg:grid-cols-[1fr_1fr_1.5fr_1fr_auto]">

        <DestinationField 
          value={destination} 
          onChange={(dest) => {
            setDestination(dest);
            // Reset city when country changes
            if (dest?.kind === "country") {
              setSelectedCity(null);
            }
          }} 
        />
        <CitySelector
          countryCode={destination?.kind === "country" ? destination.code : null}
          countryName={destination?.kind === "country" ? destination.name : null}
          selectedCity={selectedCity}
          onChange={setSelectedCity}
        />
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-ink-muted">Check-in — Check-out</span>
          <div className="grid gap-2 sm:grid-cols-2">
            <DateRangePicker
              mode="single"
              value={{ from: checkIn ? new Date(checkIn) : null, to: null }}
              minDate={today}
              onChange={(v) => {
                const nextCheckIn = v.from ? toIsoDate(v.from) : null;
                setCheckIn(nextCheckIn);
                if (checkOut && nextCheckIn && new Date(checkOut) <= new Date(nextCheckIn)) {
                  setCheckOut(null);
                }
              }}
              labelFrom="Check-in"
              placeholderFrom="Add date"
            />
            <DateRangePicker
              mode="single"
              value={{ from: checkOut ? new Date(checkOut) : null, to: null }}
              minDate={checkoutMinDate}
              onChange={(v) => setCheckOut(v.from ? toIsoDate(v.from) : null)}
              labelFrom="Check-out"
              placeholderFrom="Add date"
            />
          </div>
        </div>
        <RoomsGuestsPopover
          rooms={rooms}
          adults={adults}
          children={children}
          childrenAges={childrenAges}
          onRoomsChange={setRooms}
          onAdultsChange={setAdults}
          onChildrenChange={setChildren}
          onChildrenAgesChange={setChildrenAges}
        />
        <div className="flex items-end">
          <Button onClick={onSearch} loading={submitting} size="xl" variant="accent" fullWidth>
            Search Hotels
          </Button>
        </div>
      </div>

      {/* Nationality row — passed as GuestNationality to TBO API */}
      <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-2">
        <div className="w-56">
          <NationalitySelector value={nationality} onChange={setNationality} />
        </div>
        <p className="self-end text-[11px] text-ink-muted pb-1 leading-tight max-w-xs">
          Affects hotel pricing and availability. International destinations require Indian nationality (TBO India).
        </p>
      </div>
    </div>
  );
}
