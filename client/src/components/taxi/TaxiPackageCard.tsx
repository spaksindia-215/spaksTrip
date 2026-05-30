"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { categoryLabel, formatCurrency } from "@/lib/taxiPackage";
import type { TaxiPackage, TaxiSearchParams } from "@/types/taxi";
import { CarIcon, CheckIcon, StarIcon, UsersIcon } from "./TaxiIcons";

type Props = {
  pkg: TaxiPackage;
  search: TaxiSearchParams;
  onCompare?: (pkg: TaxiPackage) => void;
};

export default function TaxiPackageCard({ pkg, search, onCompare }: Props) {
  const bookHref = `/taxi-package/${pkg.slug}/book?pickupDate=${search.pickupDate}&pickupTime=${search.pickupTime}`;
  return (
    <article className="overflow-hidden rounded-lg border border-border-soft bg-white shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-sm)]">
      <div className="grid md:grid-cols-[230px_1fr_auto]">
        <Link href={`/taxi-package/${pkg.slug}`} className="relative block min-h-48 overflow-hidden md:min-h-full">
          <img src={pkg.image} alt={pkg.cabName} className="absolute inset-0 h-full w-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {pkg.recommended ? <Badge tone="accent">Recommended</Badge> : null}
            {pkg.popular ? <Badge tone="brand">Popular</Badge> : null}
          </div>
        </Link>
        <div className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link href={`/taxi-package/${pkg.slug}`} className="text-lg font-extrabold text-ink hover:text-brand-700">
                {pkg.title}
              </Link>
              <p className="mt-1 text-[13px] text-ink-muted">{pkg.cabName} · {categoryLabel(pkg.category)}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-[12px] font-bold text-success-700">
              <StarIcon className="h-3.5 w-3.5" /> {pkg.rating}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-ink-muted sm:grid-cols-4">
            <span className="inline-flex items-center gap-1.5"><UsersIcon className="h-4 w-4" /> {pkg.seats} seats</span>
            <span className="inline-flex items-center gap-1.5"><CarIcon className="h-4 w-4" /> {pkg.ac ? "AC" : "Non-AC"}</span>
            <span>{pkg.includedKm} km included</span>
            <span>Extra {formatCurrency(pkg.extraKmCharge)}/km</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {pkg.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} tone="neutral">{tag}</Badge>
            ))}
          </div>

          <div className="mt-4 grid gap-2 text-[13px] text-ink-muted sm:grid-cols-2">
            {pkg.inclusions.slice(0, 2).map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-success-600" /> {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between border-t border-border-soft p-4 md:min-w-52 md:border-l md:border-t-0">
          <div className="md:text-right">
            {pkg.strikePrice ? <p className="text-[12px] text-ink-subtle line-through">{formatCurrency(pkg.strikePrice)}</p> : null}
            <p className="text-2xl font-extrabold text-ink">{formatCurrency(pkg.price)}</p>
            <p className="text-[12px] text-ink-muted">Driver allowance {formatCurrency(pkg.driverAllowance)}</p>
            <p className="mt-1 text-[12px] text-ink-muted">{pkg.reviewCount.toLocaleString("en-IN")} reviews</p>
          </div>
          <div className="mt-5 grid gap-2">
            <Link href={`/taxi-package/${pkg.slug}`}>
              <Button type="button" variant="outline" fullWidth>View Details</Button>
            </Link>
            <Link href={bookHref}>
              <Button type="button" variant="accent" fullWidth>Book Now</Button>
            </Link>
            {onCompare ? (
              <button type="button" onClick={() => onCompare(pkg)} className="text-[12px] font-bold text-brand-700 hover:text-brand-800">
                Compare cab
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
