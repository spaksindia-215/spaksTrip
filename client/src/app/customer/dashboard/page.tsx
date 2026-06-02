"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError } from "@/lib/api";
import {
  customerClient,
  type Booking,
  type BookingStatus,
  type ProductType,
} from "@/lib/customerClient";

const PRODUCT_LABELS: Record<ProductType, string> = {
  flight: "Flight",
  hotel: "Hotel",
  taxi: "Taxi",
  tour: "Tour",
  cruise: "Cruise",
  package: "Package",
};

const STATUS_TONE: Record<BookingStatus, "success" | "warn" | "danger" | "neutral"> = {
  active: "success",
  held: "warn",
  cancelled: "danger",
  completed: "neutral",
};

const UPCOMING: BookingStatus[] = ["active", "held"];

function formatAmount(booking: Booking): string {
  return `${booking.currency} ${booking.amount.toLocaleString("en-IN")}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CustomerDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const items = await customerClient.bookings();
        if (active) {
          setBookings(items);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Unable to load your trips.");
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

  const handleCancelRequest = async (id: string) => {
    setCancellingId(id);
    try {
      const updated = await customerClient.requestCancel(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to request cancellation.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-muted">Loading your trips…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-600">
        {error}
      </div>
    );
  }

  const upcoming = bookings.filter((b) => UPCOMING.includes(b.status));
  const history = bookings.filter((b) => !UPCOMING.includes(b.status));
  const cancelRequests = bookings.filter((b) => b.cancelRequestedAt);

  const renderCard = (booking: Booking, showCancel: boolean) => (
    <article
      key={booking.id}
      className="flex flex-col gap-3 rounded-xl border border-border-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-ink">
            {PRODUCT_LABELS[booking.productType]}
          </span>
          <Badge tone={STATUS_TONE[booking.status]} size="sm">
            {booking.status}
          </Badge>
          {booking.cancelRequestedAt ? (
            <Badge tone="info" size="sm">
              Cancellation requested
            </Badge>
          ) : null}
        </div>
        <p className="text-[13px] text-ink-muted">
          {booking.pnr ? `PNR ${booking.pnr} · ` : ""}
          {formatAmount(booking)} · Booked {formatDate(booking.createdAt)}
        </p>
      </div>
      {showCancel && !booking.cancelRequestedAt ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={cancellingId === booking.id}
          onClick={() => handleCancelRequest(booking.id)}
        >
          Request Cancellation
        </Button>
      ) : null}
    </article>
  );

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-[16px] font-bold text-ink">Upcoming Trips</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming trips" subtitle="Your active and held bookings will appear here." />
        ) : (
          <div className="flex flex-col gap-3">{upcoming.map((b) => renderCard(b, true))}</div>
        )}
      </section>

      {cancelRequests.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">Cancellation Requests</h2>
          <div className="flex flex-col gap-3">{cancelRequests.map((b) => renderCard(b, false))}</div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-[16px] font-bold text-ink">Booking History</h2>
        {history.length === 0 ? (
          <EmptyState title="No past bookings" subtitle="Completed and cancelled trips will appear here." />
        ) : (
          <div className="flex flex-col gap-3">{history.map((b) => renderCard(b, false))}</div>
        )}
      </section>
    </div>
  );
}
