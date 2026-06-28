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
        // Hotels live in their own collection (/api/partner/hotels), not in the
        // generic PartnerResource store the other verticals use — so fetch them
        // separately and adapt into the same Row shape.
        // Hotels, SightSeeing and the four enquiry-first service modules live in
        // their own typed collections (not the generic PartnerResource store the
        // other verticals use) — fetch them separately and adapt into the Row shape.
        const SERVICE_TYPES: ResourceType[] = ["transfer", "self_drive", "islandhopper", "visa"];
        const TYPED = new Set<ResourceType>(["hotel", "sightseeing", ...SERVICE_TYPES]);
        const [entries, hotelListings, sightseeingListings, serviceEntries] = await Promise.all([
          Promise.all(
            RESOURCE_TYPES.filter((type) => !TYPED.has(type)).map(async (type) => {
              const items = await partnerClient.list(type);
              return [type, items] as const;
            }),
          ),
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

        const hotelRows: Row[] = hotelListings.map((h) => ({
          id: h.id,
          partnerId: "",
          type: "hotel",
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
          type: "sightseeing",
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

        const countMap = Object.fromEntries([
          ...entries.map(([type, items]) => [type, items.length]),
          ["hotel", hotelListings.length],
          ["sightseeing", sightseeingListings.length],
          ...serviceEntries.map(([type, items]) => [type, items.length]),
        ]) as Record<ResourceType, number>;

        const allRows: Row[] = entries.flatMap(([type, items]) =>
          items.map((item) => ({ ...item, typeLabel: META[type].label })),
        );
        allRows.push(...hotelRows, ...sightseeingRows, ...serviceRows);
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
