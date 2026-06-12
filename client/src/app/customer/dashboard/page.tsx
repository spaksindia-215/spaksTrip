"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import DataTable, { type Column } from "@/components/dashboard/DataTable";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/state/authStore";
import { customerClient, type Booking, type BookingStatus, type ProductType } from "@/lib/customerClient";

const PRODUCT_LABELS: Record<ProductType, string> = {
  flight: "Flight",
  hotel: "Hotel",
  taxi: "Taxi",
  tour: "Tour",
  cruise: "Cruise",
  package: "Package",
};

const UPCOMING: BookingStatus[] = ["active", "held"];

function formatAmount(booking: Booking): string {
  return `${booking.currency} ${booking.amount.toLocaleString("en-IN")}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function CustomerDashboardPage() {
  const displayName = useAuthStore((state) => state.user?.displayName ?? "");
  const firstName = displayName.trim().split(/\s+/)[0] || "there";

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
        if (active) setError(err instanceof ApiError ? err.message : "Unable to load your trips.");
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
    return (
      <div className="flex flex-col gap-6">
        <div className="h-9 w-48 animate-pulse rounded-md bg-surface-sunken" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-md bg-surface-sunken" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-md bg-surface-sunken" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-600">
        {error}
      </div>
    );
  }

  const upcoming = bookings.filter((b) => UPCOMING.includes(b.status));
  const past = bookings
    .filter((b) => !UPCOMING.includes(b.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  const pastColumns: Column<Booking>[] = [
    { key: "product", header: "Trip", cell: (b) => PRODUCT_LABELS[b.productType] },
    {
      key: "pnr",
      header: "PNR",
      hideOnMobile: true,
      cell: (b) => <span className="font-mono text-[13px] text-ink-muted">{b.pnr ?? "—"}</span>,
    },
    {
      key: "date",
      header: "Booked",
      hideOnMobile: true,
      cell: (b) => <span className="text-ink-muted">{formatDate(b.createdAt)}</span>,
    },
    { key: "amount", header: "Amount", align: "right", cell: (b) => <span className="font-mono text-[13px]">{formatAmount(b)}</span> },
    { key: "status", header: "Status", align: "right", cell: (b) => <StatusBadge status={b.status} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xxl font-semibold text-ink">Hi, {firstName}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming" value={upcoming.length} />
        <StatCard label="Completed" value={completedCount} />
        <StatCard label="Cancelled" value={cancelledCount} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Upcoming trips</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-md border border-border-soft bg-surface">
            <EmptyState title="No upcoming trips" subtitle="Your active and held bookings will appear here." />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((b) => (
              <article key={b.id} className="flex flex-col gap-3 rounded-md border border-border-soft bg-surface p-5 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-medium text-ink">{PRODUCT_LABELS[b.productType]}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-[13px] text-ink-muted">
                  {b.pnr ? (
                    <>
                      PNR <span className="font-mono">{b.pnr}</span> ·{" "}
                    </>
                  ) : null}
                  {formatAmount(b)} · Booked {formatDate(b.createdAt)}
                </p>
                <div className="flex items-center gap-2">
                  {b.cancelRequestedAt ? (
                    <Badge tone="info" size="sm">
                      Cancellation requested
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={cancellingId === b.id}
                      onClick={() => handleCancelRequest(b.id)}
                    >
                      Request cancellation
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Past bookings</h2>
        <DataTable
          columns={pastColumns}
          rows={past.slice(0, 5)}
          rowKey={(b) => b.id}
          empty={{ title: "No past bookings", subtitle: "Completed and cancelled trips will appear here." }}
          footer={past.length > 0 ? <span>Showing {Math.min(5, past.length)} of {past.length}</span> : undefined}
        />
      </section>
    </div>
  );
}
