"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import {
  partnerClient,
  type PartnerResource,
  type PartnerResourceUpdate,
  type ResourceType,
} from "@/lib/partnerClient";

type Props = {
  type: ResourceType;
};

type FormState = {
  title: string;
  description: string;
  price: string;
  metadata: string;
};

const TYPE_COPY: Record<
  ResourceType,
  {
    singular: string;
    plural: string;
    eyebrow: string;
    tint: string;
    badge: "brand" | "accent" | "success" | "info";
  }
> = {
  hotel: {
    singular: "Hotel",
    plural: "Hotels",
    eyebrow: "Property listings with rooms and amenities",
    tint: "hsl(265 60% 52%)",
    badge: "brand",
  },
  cruise: {
    singular: "Cruise",
    plural: "Cruises",
    eyebrow: "Cruise sailings and cabin inventory",
    tint: "hsl(204 78% 48%)",
    badge: "info",
  },
  taxi: {
    singular: "Taxi",
    plural: "Taxis",
    eyebrow: "Airport, city, and sightseeing cab inventory",
    tint: "hsl(32 78% 48%)",
    badge: "accent",
  },
  taxi_package: {
    singular: "Taxi Package",
    plural: "Taxi Packages",
    eyebrow: "Multi-day cab bundles and sightseeing circuits",
    tint: "hsl(32 60% 40%)",
    badge: "accent",
  },
  tour: {
    singular: "Tour",
    plural: "Tours",
    eyebrow: "Curated local and destination experiences",
    tint: "hsl(152 62% 40%)",
    badge: "success",
  },
  tour_package: {
    singular: "Tour Package",
    plural: "Tour Packages",
    eyebrow: "Holiday bundles and long-form itineraries",
    tint: "hsl(347 74% 54%)",
    badge: "brand",
  },
  // SightSeeing + the four service modules use their own dedicated managers; these
  // entries exist only to satisfy the exhaustive Record<ResourceType> contract.
  sightseeing: {
    singular: "Activity",
    plural: "Activities",
    eyebrow: "Tours, activities and experiences",
    tint: "hsl(188 70% 42%)",
    badge: "info",
  },
  transfer: { singular: "Transfer", plural: "Transfers", eyebrow: "Airport & inter-city transfers", tint: "hsl(210 70% 45%)", badge: "info" },
  self_drive: { singular: "Rental", plural: "Rentals", eyebrow: "Self-drive vehicle rentals", tint: "hsl(140 60% 40%)", badge: "success" },
  islandhopper: { singular: "Route", plural: "Routes", eyebrow: "Inter-island flights & ferries", tint: "hsl(200 75% 45%)", badge: "info" },
  visa: { singular: "Consultancy", plural: "Consultancies", eyebrow: "Visa consultancy services", tint: "hsl(265 55% 50%)", badge: "brand" },
};

// Valid per-type skeletons so the details editor starts from a correct shape
// (server validates these fields per type). Typed form fields replace this JSON
// editor in a follow-up step.
const DETAIL_TEMPLATES: Record<ResourceType, Record<string, unknown>> = {
  hotel: {
    starRating: 3,
    propertyType: "hotel",
    city: "",
    country: "",
    address: "",
    amenities: [],
    rooms: [
      {
        name: "",
        type: "standard",
        bedType: "double",
        maxOccupancy: 2,
        basePrice: 0,
        refundable: true,
        breakfast: false,
      },
    ],
  },
  cruise: {
    cruiseLine: "",
    ship: "",
    departurePort: "",
    route: "",
    durationNights: 1,
    cabinTypes: [],
    amenities: [],
  },
  taxi: {
    vehicleType: "Sedan",
    brand: "",
    model: "",
    registrationNumber: "",
    seatingCapacity: 4,
    fuelType: "Petrol",
    transmission: "Manual",
    acAvailable: true,
    operatingCity: "",
    serviceAreas: [],
    minimumFare: 0,
    pricePerKm: 0,
    driverIncluded: true,
    selfDriveAvailable: false,
    amenities: [],
  },
  taxi_package: {
    vehicleType: "Sedan",
    seatingCapacity: 4,
    operatingCity: "",
    durationDays: 1,
    durationNights: 0,
    itinerary: [],
    inclusions: [],
  },
  tour: {
    destination: "",
    languages: [],
    inclusions: [],
  },
  tour_package: {
    destinations: [],
    durationDays: 1,
    durationNights: 0,
    itinerary: [],
    inclusions: [],
  },
  // Not used by this generic manager (these verticals have dedicated managers);
  // kept only to satisfy the exhaustive Record<ResourceType> contract.
  sightseeing: {
    category: "tour",
    island: "",
    inclusions: [],
  },
  transfer: {},
  self_drive: {},
  islandhopper: {},
  visa: {},
};

function buildInitialForm(type: ResourceType, item?: PartnerResource | null): FormState {
  return {
    title: item?.title ?? "",
    description: item?.description ?? "",
    price: item ? String(item.price) : "",
    metadata: JSON.stringify(item ? item.metadata : DETAIL_TEMPLATES[type], null, 2),
  };
}

function metadataPreview(value: Record<string, unknown>): string {
  const entries = Object.entries(value);
  if (entries.length === 0) return "No metadata";

  return entries
    .slice(0, 3)
    .map(([key, entryValue]) => `${key}: ${String(entryValue)}`)
    .join(" · ");
}

export default function ResourceManager({ type }: Props) {
  const toast = useToast();
  const copy = TYPE_COPY[type];
  const [items, setItems] = useState<PartnerResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PartnerResource | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PartnerResource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildInitialForm(type));

  const isEditing = Boolean(editing);
  const sectionTitle = useMemo(() => copy.plural, [copy.plural]);
  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await partnerClient.list(type);
      setItems(response);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : `Unable to load ${copy.plural.toLowerCase()}.`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadInitialItems() {
      try {
        const response = await partnerClient.list(type);
        if (!active) return;
        setItems(response);
        setError(null);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : `Unable to load ${copy.plural.toLowerCase()}.`;
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialItems();

    return () => {
      active = false;
    };
  }, [copy.plural, type]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildInitialForm(type));
    setDrawerOpen(true);
  };

  const openEdit = (item: PartnerResource) => {
    setEditing(item);
    setForm(buildInitialForm(type, item));
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
    setEditing(null);
    setForm(buildInitialForm(type));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    const price = Number(form.price);

    if (!title) {
      toast.push({ title: "Title is required", tone: "warn" });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.push({
        title: "Enter a valid price",
        description: "Price must be a non-negative number.",
        tone: "warn",
      });
      return;
    }

    let metadata: Record<string, unknown>;
    try {
      const parsed = JSON.parse(form.metadata || "{}") as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Metadata must be an object");
      }
      metadata = parsed as Record<string, unknown>;
    } catch {
      toast.push({
        title: "Metadata must be valid JSON",
        description: "Use an object like {\"seats\":4}.",
        tone: "warn",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        type,
        title,
        description,
        price,
        metadata,
      };

      const saved = editing
        ? await partnerClient.update(editing.id, payload satisfies PartnerResourceUpdate)
        : await partnerClient.create(payload);

      setItems((current) => {
        if (editing) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }

        return [saved, ...current];
      });

      toast.push({
        title: editing ? `${copy.singular} updated` : `${copy.singular} created`,
        description: saved.title,
        tone: "success",
      });
      closeDrawer();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : `Unable to save ${copy.singular.toLowerCase()}.`;
      toast.push({
        title: editing ? `Could not update ${copy.singular.toLowerCase()}` : `Could not create ${copy.singular.toLowerCase()}`,
        description: message,
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setDeleting(true);

    try {
      await partnerClient.remove(pendingDelete.id);
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
      toast.push({
        title: `${copy.singular} deleted`,
        description: pendingDelete.title,
        tone: "success",
      });
      setPendingDelete(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : `Unable to delete ${copy.singular.toLowerCase()}.`;
      toast.push({
        title: `Could not delete ${copy.singular.toLowerCase()}`,
        description: message,
        tone: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              {copy.eyebrow}
            </p>
            <h1 className="text-3xl font-black text-ink">{sectionTitle}</h1>
            <p className="max-w-2xl text-sm text-ink-muted">
              Manage pricing, descriptions, and structured metadata for every {copy.singular.toLowerCase()} you publish.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                Active listings
              </p>
              <p className="mt-1 text-xl font-extrabold text-ink">{items.length}</p>
            </div>
            <div className="rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                Total tagged value
              </p>
              <p className="mt-1 text-xl font-extrabold text-ink">{formatINR(totalValue)}</p>
            </div>
            <Button type="button" variant="accent" onClick={openCreate}>
              Add {copy.singular}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
        {loading ? (
          <div className="flex flex-col gap-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-md bg-surface-sunken" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void loadItems()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={`No ${copy.plural.toLowerCase()} yet`}
            subtitle={`Create your first ${copy.singular.toLowerCase()} listing to start building inventory.`}
            cta={
              <Button type="button" variant="accent" onClick={openCreate}>
                Create {copy.singular}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3 p-4 md:p-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-border-soft bg-white p-4 shadow-(--shadow-xs) transition-shadow hover:shadow-(--shadow-sm) sm:flex-row sm:items-center"
              >
                <div
                  className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl text-[22px] font-black text-white"
                  style={{ background: copy.tint }}
                  aria-hidden
                >
                  {copy.singular[0]}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="mb-2">
                        <Badge tone={copy.badge} size="sm">
                          {copy.singular}
                        </Badge>
                      </div>
                      <h2 className="text-[16px] font-bold text-ink">{item.title}</h2>
                      <p className="mt-1 text-[13px] text-ink-muted">
                        {item.description || "No description added yet."}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-0.5">
                      <p className="text-[22px] font-extrabold leading-tight text-ink">
                        {formatINR(item.price)}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        Updated {new Date(item.updatedAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(item.metadata).length > 0 ? (
                      Object.entries(item.metadata)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <Badge key={key} tone="neutral" size="sm">
                            {key}: {String(value)}
                          </Badge>
                        ))
                    ) : (
                      <Badge tone="neutral" size="sm">
                        No metadata
                      </Badge>
                    )}
                  </div>

                  <p className="mt-3 text-[12px] text-ink-muted">
                    {metadataPreview(item.metadata)}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setPendingDelete(item)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={isEditing ? `Edit ${copy.singular}` : `Add ${copy.singular}`}
        width="520px"
      >
        <form onSubmit={handleSave} className="flex h-full flex-col gap-5 p-5">
          <Input
            id={`${type}-title`}
            label="Title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder={`Enter ${copy.singular.toLowerCase()} title`}
          />

          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-ink-soft">Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={5}
              placeholder="Describe what the customer gets."
              className="min-h-[130px] rounded-md border border-border bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>

          <Input
            id={`${type}-price`}
            label="Price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            placeholder="0.00"
          />

          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-ink-soft">Metadata JSON</span>
            <textarea
              value={form.metadata}
              onChange={(event) =>
                setForm((current) => ({ ...current, metadata: event.target.value }))
              }
              rows={8}
              spellCheck={false}
              placeholder='{"seats":4}'
              className="min-h-[180px] rounded-md border border-border bg-white px-3.5 py-3 font-mono text-[13px] text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>

          <div className="mt-auto flex items-center justify-end gap-3 border-t border-border-soft pt-4">
            <Button type="button" variant="ghost" onClick={closeDrawer} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {isEditing ? "Save Changes" : `Create ${copy.singular}`}
            </Button>
          </div>
        </form>
      </Drawer>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        title={`Delete ${copy.singular}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            {pendingDelete
              ? `Are you sure you want to delete "${pendingDelete.title}"? This action cannot be undone.`
              : ""}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
