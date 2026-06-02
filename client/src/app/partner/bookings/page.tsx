"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError } from "@/lib/api";
import { partnerClient } from "@/lib/partnerClient";
import type { Booking } from "@/lib/customerClient";

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const items = await partnerClient.bookings();
        if (active) {
          setBookings(items);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Unable to load bookings.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-muted">Loading bookings…</p>;
  }
  if (error) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-600">
        {error}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        title="No bookings on your inventory yet"
        subtitle="When travellers book your listings, those bookings will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((booking) => (
        <article
          key={booking.id}
          className="flex items-center justify-between rounded-xl border border-border-soft bg-white p-4"
        >
          <div>
            <span className="text-[15px] font-semibold text-ink capitalize">{booking.productType}</span>
            <p className="text-[13px] text-ink-muted">
              {booking.pnr ? `PNR ${booking.pnr} · ` : ""}
              {booking.currency} {booking.amount.toLocaleString("en-IN")}
            </p>
          </div>
          <Badge tone="brand" size="sm">{booking.status}</Badge>
        </article>
      ))}
    </div>
  );
}
