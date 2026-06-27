"use client";

import { useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Chip from "@/components/ui/Chip";
import MarketplaceGrid from "@/components/holiday-packages/MarketplaceGrid";
import type { PackageKind } from "@/lib/packagesClient";

const TABS: { key: PackageKind; label: string }[] = [
  { key: "holiday", label: "Holidays" },
  { key: "tour_package", label: "Tour Packages" },
  { key: "tour", label: "Tours" },
  { key: "taxi_package", label: "Taxi Packages" },
  { key: "taxi", label: "Taxis" },
];

export default function PackagesBrowsePage() {
  const [kind, setKind] = useState<PackageKind>("holiday");

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-[28px] font-extrabold">Packages</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Browse curated and partner-created packages. Each package lists the operators ready to run it, with their prices.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Chip key={t.key} active={kind === t.key} onClick={() => setKind(t.key)}>
              {t.label}
            </Chip>
          ))}
        </div>
        <div className="mt-8">
          <MarketplaceGrid kind={kind} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
