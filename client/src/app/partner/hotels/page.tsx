"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { partnerClient, type HotelListingApi } from "@/lib/partnerClient";

// Statuses a partner can push into the review queue from here.
const SUBMITTABLE = new Set(["draft", "paused", "suspended"]);

function timeAgo(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function PartnerHotelsPage() {
  const toast = useToast();
  const [hotels, setHotels] = useState<HotelListingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const items = await partnerClient.hotels.list();
        if (active) setHotels(items);
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Unable to load your hotels.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const submitForReview = async (hotel: HotelListingApi) => {
    setSubmitting(hotel.id);
    try {
      const updated = await partnerClient.hotels.submit(hotel.id);
      setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, status: updated.status } : h)));
      toast.push({
        title: "Submitted for review",
        description: `${hotel.name} is now pending admin approval.`,
        tone: "success",
      });
    } catch (err) {
      toast.push({
        title: "Could not submit",
        description: err instanceof ApiError ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const deleteHotel = async (hotel: HotelListingApi) => {
    if (!window.confirm(`Delete "${hotel.name}"? This cannot be undone.`)) return;
    setDeleting(hotel.id);
    try {
      await partnerClient.hotels.remove(hotel.id);
      setHotels((prev) => prev.filter((h) => h.id !== hotel.id));
      toast.push({ title: "Hotel deleted", tone: "success" });
    } catch (err) {
      toast.push({
        title: "Could not delete",
        description: err instanceof ApiError ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xxl font-semibold text-ink">My Hotels</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your listings, edit details, and submit drafts for approval.
          </p>
        </div>
        <Link href="/partner/hotels/new">
          <Button variant="accent" leading={<span aria-hidden>+</span>}>
            Add hotel
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-surface-sunken" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : hotels.length === 0 ? (
        <EmptyState
          title="No hotels yet"
          subtitle="List your first property to start receiving enquiries."
          cta={
            <Link href="/partner/hotels/new">
              <Button variant="accent" size="sm">Add hotel</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {hotels.map((hotel) => (
            <article
              key={hotel.id}
              className="flex flex-col gap-3 rounded-xl border border-border-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-ink">{hotel.name}</span>
                  <StatusBadge status={hotel.status} />
                </div>
                <p className="text-[13px] text-ink-muted">
                  {hotel.address?.city || "—"} · {hotel.type} · updated {timeAgo(hotel.updatedAt)}
                </p>
                {hotel.status === "pending" && (
                  <p className="text-[12px] text-warn-600">Awaiting admin approval.</p>
                )}
                {hotel.status === "active" && (
                  <p className="text-[12px] text-success-600">Live and visible in search.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link href={`/partner/hotels/${hotel.id}/edit`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                {SUBMITTABLE.has(hotel.status) && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={submitting === hotel.id}
                    onClick={() => submitForReview(hotel)}
                  >
                    Submit for review
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleting === hotel.id}
                  onClick={() => deleteHotel(hotel)}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
