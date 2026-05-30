"use client";

import { useEffect, useMemo, useState } from "react";
import { taxiPackages } from "@/data/taxi/packages";
import { defaultTaxiFilters } from "@/lib/taxiPackage";
import type { TaxiFilters, TaxiPackage, TaxiSearchParams, TaxiSort } from "@/types/taxi";

export function useTaxiSearch(search: TaxiSearchParams) {
  const [status, setStatus] = useState<"loading" | "success">("loading");
  const [filters, setFilters] = useState<TaxiFilters>(defaultTaxiFilters);
  const [sort, setSort] = useState<TaxiSort>("recommended");

  useEffect(() => {
    setStatus("loading");
    const timer = window.setTimeout(() => setStatus("success"), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const packages = useMemo(() => {
    const pickup = search.pickupCity.trim().toLowerCase();
    const destination = search.destination.trim().toLowerCase();

    const filtered = taxiPackages.filter((pkg) => {
      const routeMatches =
        !pickup ||
        pkg.pickupCity.toLowerCase().includes(pickup) ||
        pickup.includes(pkg.pickupCity.toLowerCase()) ||
        pkg.destination.toLowerCase().includes(destination) ||
        destination.includes(pkg.destination.toLowerCase());

      if (pkg.mode !== search.mode && routeMatches === false) return false;
      if (search.cabType !== "any" && pkg.category !== search.cabType) return false;
      if (pkg.price < filters.minPrice || pkg.price > filters.maxPrice) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(pkg.category)) return false;
      if (filters.ac === "ac" && !pkg.ac) return false;
      if (filters.ac === "non-ac" && pkg.ac) return false;
      if (pkg.rating < filters.minRating) return false;
      if (filters.popularOnly && !pkg.popular) return false;
      return true;
    });

    return sortTaxiPackages(filtered, sort);
  }, [filters, search, sort]);

  return { status, packages, filters, setFilters, sort, setSort };
}

function sortTaxiPackages(packages: TaxiPackage[], sort: TaxiSort): TaxiPackage[] {
  const ranked = [...packages];
  if (sort === "price-asc") return ranked.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return ranked.sort((a, b) => b.price - a.price);
  if (sort === "rating-desc") return ranked.sort((a, b) => b.rating - a.rating);

  return ranked.sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)) || Number(Boolean(b.popular)) - Number(Boolean(a.popular)) || b.rating - a.rating);
}

