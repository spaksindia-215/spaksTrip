"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import DataTable, { type Column } from "@/components/dashboard/DataTable";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/state/authStore";
import { partnerClient, type PartnerResource, type ResourceType } from "@/lib/partnerClient";
import { SERVICE_MODULES, servicePartnerApi } from "@/lib/serviceModules";

// Per-vertical delete — each type lives in its own collection/endpoint.
const REMOVE: Record<ResourceType, (id: string) => Promise<void>> = {
  hotel: (id) => partnerClient.hotels.remove(id),
  taxi: (id) => partnerClient.taxis.remove(id),
  taxi_package: (id) => partnerClient.taxiPackages.remove(id),
  tour: (id) => partnerClient.tours.remove(id),
  tour_package: (id) => partnerClient.tourPackages.remove(id),
  cruise: (id) => partnerClient.cruises.remove(id),
  sightseeing: (id) => partnerClient.sightseeing.remove(id),
  transfer: (id) => servicePartnerApi(SERVICE_MODULES.transfer).remove(id),
  self_drive: (id) => servicePartnerApi(SERVICE_MODULES.self_drive).remove(id),
  islandhopper: (id) => servicePartnerApi(SERVICE_MODULES.islandhopper).remove(id),
  visa: (id) => servicePartnerApi(SERVICE_MODULES.visa).remove(id),
};

const RESOURCE_TYPES: ResourceType[] = [
  "hotel",
  "taxi",
  "taxi_package",
  "tour",
  "tour_package",
  "cruise",
  "sightseeing",
  "transfer",
  "self_drive",
  "islandhopper",
  "visa",
];

const META: Record<ResourceType, { label: string; href: string }> = {
  hotel: { label: "Hotels", href: "/partner/hotels" },
  taxi: { label: "Taxis", href: "/partner/taxis" },
  taxi_package: { label: "Taxi Packages", href: "/partner/taxi-packages" },
  tour: { label: "Tours", href: "/partner/tours" },
  tour_package: { label: "Tour Packages", href: "/partner/tour-packages" },
  cruise: { label: "Cruises", href: "/partner/cruises" },
  sightseeing: { label: "SightSeeing", href: "/partner/sightseeing" },
  transfer: { label: "Transfers", href: "/partner/transfer" },
  self_drive: { label: "Self-Drive", href: "/partner/self-drive" },
  islandhopper: { label: "Islandhopper", href: "/partner/islandhopper" },
  visa: { label: "Visa Consultancy", href: "/partner/visa" },
};

function IconBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
      {children}
    </div>
  );
}

const HotelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 22V12h6v10M9 7h1m5 0h1M9 11h1m5 0h1" />
  </svg>
);

const CarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h10l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const ShipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 21c.6.5 1.2 1 2.5 1C7 22 7 20 9.5 20s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1" />
    <path d="M19.38 20A11.6 11.6 0 0021 14l-9-4-9 4a11.6 11.6 0 001.62 6" />
    <path d="M10 14L9 7h6l-1 7" />
    <path d="M12 7V3" />
    <path d="M10 3H8" />
  </svg>
);

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const PlaneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2a1 1 0 00-.6 1.7l2.3 2.3L2 14l2.3 1.4 1.4-2.8 2.8-1.4L10 14l1.4 2.3L14 18l-1.4 1.4 2.3 2.3a1 1 0 001.7-.6z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const SteeringIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 9V3M9.5 11.5L4.2 8M14.5 11.5L19.8 8" />
  </svg>
);

const PackageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16.5 9.4l-9-5.19" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </svg>
);

const CompassIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
  </svg>
);

const BackpackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 20V10a4 4 0 014-4h8a4 4 0 014 4v10" />
    <path d="M4 10h16" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    <path d="M9 14h6" />
  </svg>
);

const TransferIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
    <path d="M21 15a2 2 0 01-2 2H9a2 2 0 01-2-2v-5a2 2 0 012-2h10a2 2 0 012 2v5z" />
  </svg>
);

const ICONS: Record<ResourceType, React.ReactNode> = {
  hotel:        <IconBadge color="bg-blue-50 text-blue-600"><HotelIcon /></IconBadge>,
  taxi:         <IconBadge color="bg-amber-50 text-amber-600"><CarIcon /></IconBadge>,
  taxi_package: <IconBadge color="bg-orange-50 text-orange-600"><PackageIcon /></IconBadge>,
  tour:         <IconBadge color="bg-green-50 text-green-600"><CompassIcon /></IconBadge>,
  tour_package: <IconBadge color="bg-teal-50 text-teal-600"><BackpackIcon /></IconBadge>,
  cruise:       <IconBadge color="bg-sky-50 text-sky-600"><ShipIcon /></IconBadge>,
  sightseeing:  <IconBadge color="bg-purple-50 text-purple-600"><CameraIcon /></IconBadge>,
  transfer:     <IconBadge color="bg-indigo-50 text-indigo-600"><TransferIcon /></IconBadge>,
  self_drive:   <IconBadge color="bg-lime-50 text-lime-600"><SteeringIcon /></IconBadge>,
  islandhopper: <IconBadge color="bg-pink-50 text-pink-600"><PlaneIcon /></IconBadge>,
  visa:         <IconBadge color="bg-rose-50 text-rose-600"><GlobeIcon /></IconBadge>,
};

const QUICK_ACTIONS: { label: string; href: string }[] = [
  { label: "Add hotel", href: "/partner/hotels/new" },
  { label: "Add taxi", href: "/partner/taxis" },
  { label: "Add tour", href: "/partner/tours" },
  { label: "Add package", href: "/partner/tour-packages" },
];

type Row = PartnerResource & { typeLabel: string };

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

function resourceStatus(item: PartnerResource): string {
  const s = item.metadata?.status;
  return typeof s === "string" ? s : "active";
}

export default function PartnerDashboardPage() {
  const toast = useToast();
  const displayName = useAuthStore((state) => state.user?.displayName ?? "");
  const firstName = displayName.trim().split(/\s+/)[0] || "Partner";

  const [counts, setCounts] = useState<Record<ResourceType, number> | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(row: Row) {
    if (!window.confirm(`Delete "${row.title || "this listing"}"? This cannot be undone.`)) return;
    setDeletingId(row.id);
    try {
      await REMOVE[row.type](row.id);
      setRecent((prev) => prev.filter((r) => r.id !== row.id));
      setCounts((prev) =>
        prev ? { ...prev, [row.type]: Math.max(0, (prev[row.type] ?? 1) - 1) } : prev,
      );
      toast.push({ title: "Listing deleted", tone: "success" });
    } catch (err) {
      toast.push({
        title: "Could not delete",
        description: err instanceof ApiError ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Every vertical has its own typed collection — fetch them directly.
        // The generic partnerClient.list(type) queries /api/partner/resources which
        // is a separate catch-all store; taxis/packages/tours/cruises are NOT in it.
        const SERVICE_TYPES: ResourceType[] = ["transfer", "self_drive", "islandhopper", "visa"];
        const [
          taxiListings,
          taxiPackages,
          tourListings,
          tourPackages,
          cruiseListings,
          hotelListings,
          sightseeingListings,
          serviceEntries,
        ] = await Promise.all([
          partnerClient.taxis.list(),
          partnerClient.taxiPackages.list(),
          partnerClient.tours.list(),
          partnerClient.tourPackages.list(),
          partnerClient.cruises.list(),
          partnerClient.hotels.list(),
          partnerClient.sightseeing.list(),
          Promise.all(
            SERVICE_TYPES.map(async (type) => {
              const key = type === "self_drive" ? "self_drive" : type;
              const items = await servicePartnerApi(SERVICE_MODULES[key as keyof typeof SERVICE_MODULES]).list();
              return [type, items] as const;
            }),
          ),
        ]);

        if (!active) return;

        const taxiRows: Row[] = taxiListings.map((t) => ({
          id: t.id,
          partnerId: t.partner,
          type: "taxi" as const,
          title: `${t.vehicle.make} ${t.vehicle.model}`,
          description: t.description ?? "",
          price: 0,
          metadata: { status: t.status },
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          typeLabel: META.taxi.label,
        }));

        const taxiPackageRows: Row[] = taxiPackages.map((p) => ({
          id: p.id,
          partnerId: p.partner,
          type: "taxi_package" as const,
          title: p.title,
          description: p.description ?? "",
          price: p.pricing.basePrice,
          metadata: { status: p.status },
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          typeLabel: META.taxi_package.label,
        }));

        const tourRows: Row[] = tourListings.map((t) => ({
          id: t.id,
          partnerId: t.partner,
          type: "tour" as const,
          title: t.title,
          description: t.description ?? "",
          price: 0,
          metadata: { status: t.status },
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          typeLabel: META.tour.label,
        }));

        const tourPackageRows: Row[] = tourPackages.map((p) => ({
          id: p.id,
          partnerId: p.partner,
          type: "tour_package" as const,
          title: p.title,
          description: p.description ?? "",
          price: p.pricing.basePrice,
          metadata: { status: p.status },
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          typeLabel: META.tour_package.label,
        }));

        const cruiseRows: Row[] = cruiseListings.map((c) => ({
          id: c.id,
          partnerId: c.partner,
          type: "cruise" as const,
          title: c.cruiseName,
          description: c.description ?? "",
          price: 0,
          metadata: { status: c.status },
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          typeLabel: META.cruise.label,
        }));

        const hotelRows: Row[] = hotelListings.map((h) => ({
          id: h.id,
          partnerId: "",
          type: "hotel" as const,
          title: h.name,
          description: "",
          price: 0,
          metadata: { status: h.status },
          createdAt: h.createdAt,
          updatedAt: h.updatedAt,
          typeLabel: META.hotel.label,
        }));

        const sightseeingRows: Row[] = sightseeingListings.map((s) => ({
          id: s.id,
          partnerId: "",
          type: "sightseeing" as const,
          title: s.title,
          description: "",
          price: 0,
          metadata: { status: s.status },
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          typeLabel: META.sightseeing.label,
        }));

        const serviceRows: Row[] = serviceEntries.flatMap(([type, items]) =>
          items.map((s) => ({
            id: s.id,
            partnerId: "",
            type,
            title: s.title,
            description: "",
            price: 0,
            metadata: { status: s.status },
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            typeLabel: META[type].label,
          })),
        );

        const countMap: Record<ResourceType, number> = {
          taxi: taxiListings.length,
          taxi_package: taxiPackages.length,
          tour: tourListings.length,
          tour_package: tourPackages.length,
          cruise: cruiseListings.length,
          hotel: hotelListings.length,
          sightseeing: sightseeingListings.length,
          ...Object.fromEntries(serviceEntries.map(([type, items]) => [type, items.length])),
        } as Record<ResourceType, number>;

        const allRows: Row[] = [
          ...taxiRows, ...taxiPackageRows, ...tourRows, ...tourPackageRows, ...cruiseRows,
          ...hotelRows, ...sightseeingRows, ...serviceRows,
        ];
        allRows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        setCounts(countMap);
        setRecent(allRows.slice(0, 5));
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Unable to load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-9 w-64 animate-pulse rounded-md bg-surface-sunken" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-md bg-surface-sunken" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-md bg-surface-sunken" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  const columns: Column<Row>[] = [
    { key: "type", header: "Type", cell: (r) => <span className="text-ink-muted">{r.typeLabel}</span> },
    { key: "name", header: "Name", cell: (r) => <span className="font-medium text-ink">{r.title || "Untitled"}</span> },
    {
      key: "updated",
      header: "Updated",
      hideOnMobile: true,
      cell: (r) => <span className="text-ink-muted">{timeAgo(r.updatedAt)}</span>,
    },
    { key: "status", header: "Status", align: "right", cell: (r) => <StatusBadge status={resourceStatus(r)} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <Button
          variant="danger"
          size="sm"
          loading={deletingId === r.id}
          onClick={() => handleDelete(r)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xxl font-semibold text-ink">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-ink-muted">Partner workspace</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCE_TYPES.map((type) => (
          <StatCard
            key={type}
            label={META[type].label}
            value={counts?.[type] ?? 0}
            href={META[type].href}
            icon={ICONS[type]}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Recent activity</h2>
        </div>
        <DataTable
          columns={columns}
          rows={recent}
          rowKey={(r) => r.id}
          empty={{
            title: "No listings yet",
            subtitle: "Add your first hotel, taxi, or tour to get started.",
          }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href + action.label} href={action.href}>
              <Button variant="accent" size="sm" leading={<span aria-hidden>+</span>}>
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
