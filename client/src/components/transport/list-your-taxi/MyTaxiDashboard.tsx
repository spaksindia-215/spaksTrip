"use client";

import { useState, useSyncExternalStore, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Drawer from "@/components/ui/Drawer";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  applyTaxiListingEditorDraft,
  createTaxiListingEditorDraft,
  getStoredTaxiListings,
  setTaxiListingAvailability,
  subscribeTaxiListings,
  taxiListingStorageKey,
  upsertTaxiListing,
  validateTaxiListingEditorDraft,
} from "@/lib/taxiListing";
import { cn } from "@/lib/cn";
import {
  TAXI_AMENITIES,
  TAXI_AVAILABLE_DAYS,
  TAXI_TIME_SLOTS,
  type TaxiAvailableDay,
  type TaxiListing,
  type TaxiListingEditorDraft,
  type TaxiTimeSlot,
} from "@/types/taxiListing";

type EditorErrors = Partial<Record<keyof TaxiListingEditorDraft, string>>;

export default function MyTaxiDashboard() {
  const toast = useToast();
  const listings = useSyncExternalStore(subscribeTaxiListings, getStoredTaxiListings, () => []);
  const [editing, setEditing] = useState<TaxiListing | null>(null);
  const [editDraft, setEditDraft] = useState<TaxiListingEditorDraft | null>(null);
  const [errors, setErrors] = useState<EditorErrors>({});
  const [saving, setSaving] = useState(false);

  function openEditor(listing: TaxiListing) {
    setEditing(listing);
    setEditDraft(createTaxiListingEditorDraft(listing));
    setErrors({});
  }

  function closeEditor() {
    if (saving) return;
    setEditing(null);
    setEditDraft(null);
    setErrors({});
  }

  function setDraft<Key extends keyof TaxiListingEditorDraft>(
    key: Key,
    value: TaxiListingEditorDraft[Key],
  ) {
    setEditDraft((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => {
      if (!current[key]) return current;
      return { ...current, [key]: undefined };
    });
  }

  function toggleAvailability(id: string, enabled: boolean) {
    setTaxiListingAvailability(id, enabled);
    toast.push({
      title: enabled ? "Taxi marked available" : "Taxi marked unavailable",
      tone: "success",
    });
  }

  function toggleDay(day: TaxiAvailableDay) {
    if (!editDraft) return;
    const next = editDraft.availableDays.includes(day)
      ? editDraft.availableDays.filter((item) => item !== day)
      : [...editDraft.availableDays, day];

    setDraft("availableDays", next);
  }

  function toggleTimeSlot(slot: TaxiTimeSlot) {
    if (!editDraft) return;
    const next = editDraft.availableTimeSlots.includes(slot)
      ? editDraft.availableTimeSlots.filter((item) => item !== slot)
      : [...editDraft.availableTimeSlots, slot];

    setDraft("availableTimeSlots", next);
  }

  function toggleAmenity(amenity: string) {
    if (!editDraft) return;
    const next = editDraft.amenities.includes(amenity)
      ? editDraft.amenities.filter((item) => item !== amenity)
      : [...editDraft.amenities, amenity];

    setDraft("amenities", next);
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !editDraft) return;

    const validation = validateTaxiListingEditorDraft(editDraft);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.push({
        title: "Please review the taxi details",
        description: "A few required fields still need attention before saving.",
        tone: "warn",
      });
      return;
    }

    setSaving(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      const nextListing = applyTaxiListingEditorDraft(editing, editDraft);
      upsertTaxiListing(nextListing);
      toast.push({
        title: "Taxi listing updated",
        description: `${editing.brand} ${editing.model} is ready with the latest details.`,
        tone: "success",
      });
      closeEditor();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              Partner Taxi Listings
            </p>
            <h1 className="mt-2 text-3xl font-black text-ink">My Taxis</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Review your submitted taxi listings, adjust availability, update coverage details,
              and monitor booking requests without affecting the existing customer taxi flows.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatCard label="Listed taxis" value={String(listings.length)} />
            <StatCard
              label="Active now"
              value={String(listings.filter((item) => item.availabilityEnabled).length)}
            />
            <Link
              href="/taxi-package/list-your-taxi"
              className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              List Another Taxi
            </Link>
          </div>
        </div>
      </section>

      {listings.length === 0 ? (
        <section className="rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
          <EmptyState
            title="No taxis listed yet"
            subtitle="Your submitted taxi listings will appear here with availability controls and booking requests."
            cta={
              <Link
                href="/taxi-package/list-your-taxi"
                className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                List Your Taxi
              </Link>
            }
          />
        </section>
      ) : (
        <section className="space-y-4">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent" size="md">
                      {listing.vehicleType}
                    </Badge>
                    <Badge tone={listing.availabilityEnabled ? "success" : "warn"} size="md">
                      {listing.availabilityEnabled ? "Available" : "Unavailable"}
                    </Badge>
                    <Badge tone="brand" size="md">
                      {listing.operatingCity}
                    </Badge>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-ink">
                      {listing.brand} {listing.model}
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      {listing.registrationNumber} • {listing.seatingCapacity} seats •{" "}
                      {listing.fuelType} • {listing.transmission}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoCard label="Owner" value={listing.fullName} />
                    <InfoCard label="Fare" value={`Rs. ${listing.minimumFare} min / Rs. ${listing.pricePerKm} per km`} />
                    <InfoCard
                      label="Service Areas"
                      value={listing.serviceAreas.join(", ")}
                    />
                    <InfoCard
                      label="Time Slots"
                      value={listing.availableTimeSlots.join(", ")}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-ink">Amenities</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {listing.amenities.map((amenity) => (
                        <Badge key={amenity} tone="neutral" size="sm">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-ink">Booking Requests</p>
                    <div className="mt-3 grid gap-3">
                      {listing.bookingRequests.map((request) => (
                        <div
                          key={request.id}
                          className="rounded-xl border border-border-soft bg-surface-muted p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-ink">
                                {request.riderName}
                              </p>
                              <p className="mt-1 text-sm text-ink-muted">
                                {request.route} • {new Date(request.pickupDate).toLocaleDateString("en-IN")} •{" "}
                                {request.passengers} passengers
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                tone={
                                  request.status === "completed"
                                    ? "success"
                                    : request.status === "confirmed"
                                      ? "info"
                                      : "warn"
                                }
                                size="sm"
                              >
                                {request.status}
                              </Badge>
                              <span className="text-sm font-semibold text-ink">
                                Rs. {request.quotedFare}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-3 lg:w-56">
                  <Button
                    type="button"
                    variant={listing.availabilityEnabled ? "outline" : "primary"}
                    onClick={() => toggleAvailability(listing.id, !listing.availabilityEnabled)}
                  >
                    {listing.availabilityEnabled ? "Pause Availability" : "Go Available"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => openEditor(listing)}>
                    Edit Listing
                  </Button>
                  <div className="rounded-xl border border-border-soft bg-surface-muted p-4 text-sm text-ink-muted">
                    Updated on {new Date(listing.updatedAt).toLocaleDateString("en-IN")}
                    <br />
                    Storage key: <span className="font-mono text-[12px]">{taxiListingStorageKey()}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <Drawer
        open={Boolean(editing && editDraft)}
        onClose={closeEditor}
        title={editing ? `Edit ${editing.brand} ${editing.model}` : "Edit Taxi"}
        width="560px"
      >
        {editDraft ? (
          <form onSubmit={saveChanges} className="flex h-full flex-col gap-5 p-5">
            <Input
              id="edit-operating-city"
              label="Operating City"
              value={editDraft.operatingCity}
              onChange={(event) => setDraft("operatingCity", event.target.value)}
              error={errors.operatingCity}
            />
            <Input
              id="edit-minimum-fare"
              label="Minimum Fare"
              type="number"
              min="1"
              value={editDraft.minimumFare}
              onChange={(event) => setDraft("minimumFare", event.target.value)}
              error={errors.minimumFare}
            />
            <Input
              id="edit-price-per-km"
              label="Price Per KM"
              type="number"
              min="1"
              value={editDraft.pricePerKm}
              onChange={(event) => setDraft("pricePerKm", event.target.value)}
              error={errors.pricePerKm}
            />
            <TextArea
              id="edit-service-areas"
              label="Service Areas"
              value={editDraft.serviceAreas}
              onChange={(event) => setDraft("serviceAreas", event.target.value)}
              error={errors.serviceAreas}
              placeholder="Delhi, Noida, Gurgaon"
            />
            <TextArea
              id="edit-available-routes"
              label="Available Routes"
              value={editDraft.availableRoutes}
              onChange={(event) => setDraft("availableRoutes", event.target.value)}
              error={errors.availableRoutes}
              placeholder="Delhi to Agra, Delhi Airport to Jaipur"
            />
            <TextArea
              id="edit-description"
              label="Description"
              value={editDraft.description}
              onChange={(event) => setDraft("description", event.target.value)}
              error={errors.description}
              placeholder="Describe the ride experience."
            />

            <EditorSelection title="Available Days" error={errors.availableDays}>
              <div className="grid gap-3 sm:grid-cols-2">
                {TAXI_AVAILABLE_DAYS.map((day) => (
                  <Checkbox
                    key={day}
                    id={`edit-day-${day}`}
                    checked={editDraft.availableDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    label={day}
                  />
                ))}
              </div>
            </EditorSelection>

            <EditorSelection title="Available Time Slots" error={errors.availableTimeSlots}>
              <div className="grid gap-3 sm:grid-cols-2">
                {TAXI_TIME_SLOTS.map((slot) => (
                  <Checkbox
                    key={slot}
                    id={`edit-slot-${slot}`}
                    checked={editDraft.availableTimeSlots.includes(slot)}
                    onChange={() => toggleTimeSlot(slot)}
                    label={slot}
                  />
                ))}
              </div>
            </EditorSelection>

            <EditorSelection title="Amenities" error={errors.amenities}>
              <div className="grid gap-3 sm:grid-cols-2">
                {TAXI_AMENITIES.map((amenity) => (
                  <Checkbox
                    key={amenity}
                    id={`edit-amenity-${amenity}`}
                    checked={editDraft.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    label={amenity}
                  />
                ))}
              </div>
            </EditorSelection>

            <div className="mt-auto flex items-center justify-end gap-3 border-t border-border-soft pt-4">
              <Button type="button" variant="ghost" onClick={closeEditor} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : null}
      </Drawer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "rounded-md border bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition-colors",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          error ? "border-danger-500" : "border-border",
        )}
      />
      {error ? <p className="text-[12px] font-medium text-danger-600">{error}</p> : null}
    </label>
  );
}

function EditorSelection({
  title,
  error,
  children,
}: {
  title: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-ink-soft">{title}</p>
      {children}
      {error ? <p className="mt-2 text-[12px] font-medium text-danger-600">{error}</p> : null}
    </div>
  );
}
