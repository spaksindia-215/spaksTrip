"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";
import {
  listPackages,
  type PackageKind,
  type PackageScope,
  type PackageSummary,
} from "@/lib/packagesClient";

// Data-driven package grid backed by the marketplace API. Replaces the hardcoded
// marketing arrays on the tour/taxi/holiday listing pages. Each card links to the
// shared detail page (/packages/[slug]) where the operator list + enquiry live.

type Props = {
  kind?: PackageKind;
  scope?: PackageScope;
  emptyHint?: string;
};

function PackageCard({ pkg }: { pkg: PackageSummary }) {
  const img = pkg.thumbnail ?? pkg.images?.[0]?.url ?? "/placeholder.jpg";
  const duration =
    pkg.route.durationDays > 0
      ? `${pkg.route.durationNights}N / ${pkg.route.durationDays}D`
      : undefined;
  return (
    <Link
      href={`/packages/${pkg.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border-soft bg-white shadow-(--shadow-xs) transition-shadow hover:shadow-(--shadow-sm)"
    >
      <div className="relative overflow-hidden">
        <img src={img} alt={pkg.title} loading="lazy" className="h-52 w-full object-cover transition-transform duration-500 hover:scale-105" />
        {pkg.origin === "platform" && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">Curated</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[15px] font-bold leading-snug text-ink">{pkg.title}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-ink-muted">
          {duration && <span>{duration}</span>}
          {pkg.route.destinations.length > 0 && <span>{pkg.route.destinations.slice(0, 3).join(" · ")}</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border-soft pt-3">
          <div>
            {pkg.fromPrice != null ? (
              <>
                <p className="text-[11px] text-ink-muted">From · {pkg.operatorCount} operator{pkg.operatorCount === 1 ? "" : "s"}</p>
                <p className="text-[18px] font-extrabold leading-tight text-ink">{formatINR(pkg.fromPrice)}</p>
              </>
            ) : (
              <p className="text-[12px] text-ink-muted">Enquire for pricing</p>
            )}
          </div>
          <span className="rounded-lg bg-accent-500 px-4 py-2 text-[13px] font-bold text-white">View</span>
        </div>
      </div>
    </Link>
  );
}

export default function MarketplaceGrid({ kind, scope, emptyHint }: Props) {
  const [items, setItems] = useState<PackageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listPackages({ kind, scope, limit: 50 })
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load packages");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, scope]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-xl bg-border-soft/60" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No listings found"
        emoji="🍂"
        subtitle={emptyHint ?? "Try adjusting your search or category filters."}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} />
      ))}
    </div>
  );
}
