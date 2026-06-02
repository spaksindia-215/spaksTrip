"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import ErrorState from "@/components/ui/ErrorState";
import { ApiError } from "@/lib/api";
import { formatINRShort } from "@/lib/format";
import { partnerClient, type ResourceType } from "@/lib/partnerClient";

const RESOURCE_TYPES: ResourceType[] = [
  "hotel",
  "cruise",
  "taxi",
  "taxi_package",
  "tour",
  "tour_package",
];

const COPY: Record<
  ResourceType,
  { label: string; tint: string; blurb: string; href: string; badge: "brand" | "accent" | "success" | "info" }
> = {
  hotel: {
    label: "Hotels",
    tint: "hsl(265 60% 52%)",
    blurb: "Property listings with rooms, amenities, and rates",
    href: "/partner/hotels",
    badge: "brand",
  },
  cruise: {
    label: "Cruises",
    tint: "hsl(204 78% 48%)",
    blurb: "Cruise sailings and cabin inventory",
    href: "/partner/cruises",
    badge: "info",
  },
  taxi: {
    label: "Taxis",
    tint: "hsl(32 78% 48%)",
    blurb: "Airport transfers, outstation, and local rides",
    href: "/partner/taxis",
    badge: "accent",
  },
  taxi_package: {
    label: "Taxi Packages",
    tint: "hsl(32 60% 40%)",
    blurb: "Multi-day cab bundles and sightseeing circuits",
    href: "/partner/taxi-packages",
    badge: "accent",
  },
  tour: {
    label: "Tours",
    tint: "hsl(152 62% 40%)",
    blurb: "Destination activities and guided experiences",
    href: "/partner/tours",
    badge: "success",
  },
  tour_package: {
    label: "Tour Packages",
    tint: "hsl(347 74% 54%)",
    blurb: "Complete trip bundles and itineraries",
    href: "/partner/tour-packages",
    badge: "brand",
  },
};

export default function PartnerDashboardPage() {
  const [counts, setCounts] = useState<Record<ResourceType, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const entries = await Promise.all(
        RESOURCE_TYPES.map(async (type) => {
          const items = await partnerClient.list(type);
          return [type, items.length] as const;
        }),
      );

      setCounts(Object.fromEntries(entries) as Record<ResourceType, number>);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to load dashboard metrics.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadInitialCounts() {
      try {
        const entries = await Promise.all(
          RESOURCE_TYPES.map(async (type) => {
            const items = await partnerClient.list(type);
            return [type, items.length] as const;
          }),
        );

        if (!active) return;
        setCounts(Object.fromEntries(entries) as Record<ResourceType, number>);
        setError(null);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : "Unable to load dashboard metrics.";
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialCounts();

    return () => {
      active = false;
    };
  }, []);

  const total = useMemo(() => {
    if (!counts) return 0;
    return RESOURCE_TYPES.reduce((sum, type) => sum + counts[type], 0);
  }, [counts]);

  const busiestType = useMemo(() => {
    if (!counts) return null;

    return RESOURCE_TYPES.reduce((best, type) => {
      if (!best || counts[type] > counts[best]) return type;
      return best;
    }, null as ResourceType | null);
  }, [counts]);

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-10 w-72 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-4 w-80 animate-pulse rounded bg-slate-100" />
        </section>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadCounts()} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
              Partner Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black text-ink">Inventory snapshot</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              You currently manage {total} active listings across every partner inventory category.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                Total listings
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink">{total}</p>
            </div>
            <div className="rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                Largest section
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink">
                {busiestType ? COPY[busiestType].label : "None"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {RESOURCE_TYPES.map((type) => (
          <Link
            key={type}
            href={COPY[type].href}
            className="flex flex-col gap-4 rounded-xl border border-border-soft bg-white p-4 shadow-(--shadow-xs) transition-shadow hover:shadow-(--shadow-sm) sm:flex-row sm:items-center"
          >
            <div
              className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl text-[22px] font-black text-white"
              style={{ background: COPY[type].tint }}
              aria-hidden
            >
              {COPY[type].label[0]}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Badge tone={COPY[type].badge} size="sm">
                    {COPY[type].label}
                  </Badge>
                  <h2 className="mt-2 text-[16px] font-bold text-ink">
                    {COPY[type].label} inventory
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-muted">{COPY[type].blurb}</p>
                </div>

                <div className="flex flex-col items-end gap-0.5">
                  <p className="text-[24px] font-extrabold leading-tight text-ink">
                    {counts?.[type] ?? 0}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    est. {formatINRShort((counts?.[type] ?? 0) * 2500)}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
