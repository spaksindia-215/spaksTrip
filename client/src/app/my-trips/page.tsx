"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useBookingStore, type FlightBooking } from "@/state/bookingStore";
import { useHotelBookingStore, type HotelBooking } from "@/state/hotelBookingStore";
import { formatINR } from "@/lib/format";

type TabValue = "flights" | "hotels";

const STATUS_TONE: Record<string, "success" | "warn" | "info" | "danger"> = {
  CONFIRMED: "success",
  PAYMENT: "warn",
  TRAVELER: "info",
  GUEST: "info",
  CART: "info",
  SELECTED: "info",
  PASSENGER: "info",
};

function FlightCard({ b }: { b: FlightBooking }) {
  const seg = b.offer.segments[0];
  const origin = seg?.from ?? "—";
  const dest = b.offer.segments[b.offer.segments.length - 1]?.to ?? "—";
  const date = seg?.depart.slice(0, 10) ?? "";
  const status = b.status;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs) hover:shadow-(--shadow-sm) transition-shadow">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-brand-600">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-bold text-ink">
            {origin} → {dest}
          </p>
          <p className="text-[12px] text-ink-muted mt-0.5">
            {date} · {seg?.airlineCode ?? ""} · {b.fareFamily?.name ?? "Economy"}
          </p>
          {b.bookingReference && (
            <p className="text-[11px] font-mono text-ink-soft mt-0.5">Ref: {b.bookingReference}</p>
          )}
        </div>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5">
        <Badge tone={STATUS_TONE[status] ?? "info"} size="sm">{status}</Badge>
        <p className="text-[15px] font-extrabold text-ink">{formatINR(b.totalPrice)}</p>
      </div>
    </div>
  );
}

function HotelCard({ b }: { b: HotelBooking }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs) hover:shadow-(--shadow-sm) transition-shadow">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-50">
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-accent-600">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-bold text-ink">{b.hotel.name}</p>
          <p className="text-[12px] text-ink-muted mt-0.5">
            {b.checkIn} → {b.checkOut} · {b.nights} night{b.nights !== 1 ? "s" : ""} · {b.rooms} room{b.rooms !== 1 ? "s" : ""}
          </p>
          {b.bookingReference && (
            <p className="text-[11px] font-mono text-ink-soft mt-0.5">Ref: {b.bookingReference}</p>
          )}
        </div>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5">
        <Badge tone={STATUS_TONE[b.status] ?? "info"} size="sm">{b.status}</Badge>
        <p className="text-[15px] font-extrabold text-ink">{formatINR(b.totalPrice)}</p>
      </div>
    </div>
  );
}

export default function MyTripsPage() {
  const [tab, setTab] = useState<TabValue>("flights");

  const flightBookings = useBookingStore((s) => s.bookings);
  const hotelBookings = useHotelBookingStore((s) => s.bookings);

  const tabItems: Array<{ value: TabValue; label: string }> = [
    { value: "flights", label: `Flights (${flightBookings.length})` },
    { value: "hotels", label: `Hotels (${hotelBookings.length})` },
  ];

  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold text-ink">My Trips</h1>
          <p className="text-[14px] text-ink-muted mt-1">All your bookings in one place.</p>
        </div>

        <Tabs value={tab} onChange={setTab} items={tabItems} variant="underline" className="mb-6" />

        {tab === "flights" && (
          <>
            {flightBookings.length === 0 ? (
              <div className="rounded-xl bg-white border border-border-soft">
                <EmptyState
                  title="No flight bookings yet"
                  subtitle="Search for flights and complete a booking to see them here."
                  cta={
                    <Link href="/flight" className="inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-700 transition-colors">
                      Search Flights
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3" aria-live="polite">
                {flightBookings.map((b) => <FlightCard key={b.id} b={b} />)}
              </div>
            )}
          </>
        )}

        {tab === "hotels" && (
          <>
            {hotelBookings.length === 0 ? (
              <div className="rounded-xl bg-white border border-border-soft">
                <EmptyState
                  title="No hotel bookings yet"
                  subtitle="Find and book a hotel to see your reservations here."
                  cta={
                    <Link href="/hotel" className="inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-700 transition-colors">
                      Search Hotels
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3" aria-live="polite">
                {hotelBookings.map((b) => <HotelCard key={b.id} b={b} />)}
              </div>
            )}
          </>
        )}

      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
