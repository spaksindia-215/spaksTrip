"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useSubmitForReview, SUBMITTABLE_STATUSES } from "./useSubmitForReview";
import { partnerClient, type TaxiListingApi, type TaxiPackageApi } from "@/lib/partnerClient";
import {
  buildTaxiPackageFormData,
  emptyItineraryRow,
  emptyTaxiPackageForm,
  taxiPackageFormFromApi,
  validateTaxiPackageForm,
  type TaxiPackageFiles,
  type TaxiPackageFormState,
  type TaxiPackageItineraryRow,
} from "@/lib/taxiPackageForm";

type Mode = "list" | "form";

const CURRENCIES = ["INR", "USD", "EUR", "AED", "GBP"];

export default function TaxiPackageManager() {
  const toast = useToast();
  const [packages, setPackages] = useState<TaxiPackageApi[]>([]);
  const [vehicles, setVehicles] = useState<TaxiListingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaxiPackageFormState>(() => emptyTaxiPackageForm());
  const [files, setFiles] = useState<TaxiPackageFiles>({ thumbnail: null, images: [] });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [pkgs, taxis] = await Promise.all([
        partnerClient.taxiPackages.list(),
        partnerClient.taxis.list().catch(() => [] as TaxiListingApi[]),
      ]);
      setPackages(pkgs);
      setVehicles(taxis);
    } catch (error) {
      toast.push({
        title: "Could not load taxi packages",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const { submittingId, submit: submitForReview } = useSubmitForReview("taxi_package", refresh);

  function setField<K extends keyof TaxiPackageFormState>(key: K, value: TaxiPackageFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyTaxiPackageForm());
    setFiles({ thumbnail: null, images: [] });
    setMode("form");
  }

  function openEdit(pkg: TaxiPackageApi) {
    setEditingId(pkg.id);
    setForm(taxiPackageFormFromApi(pkg));
    setFiles({ thumbnail: null, images: [] });
    setMode("form");
  }

  function backToList() {
    if (saving) return;
    setMode("list");
    setEditingId(null);
  }

  // ── Itinerary row helpers ──────────────────────────────────────────────────
  function setItineraryRow(index: number, key: keyof TaxiPackageItineraryRow, value: string) {
    setForm((current) => {
      const itinerary = current.itinerary.map((row, i) =>
        i === index ? { ...row, [key]: value } : row,
      );
      return { ...current, itinerary };
    });
  }

  function addItineraryRow() {
    setForm((current) => ({
      ...current,
      itinerary: [...current.itinerary, emptyItineraryRow(current.itinerary.length + 1)],
    }));
  }

  function removeItineraryRow(index: number) {
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary.filter((_, i) => i !== index),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateTaxiPackageForm(form);
    if (validationError) {
      toast.push({ title: "Please review the package", description: validationError, tone: "warn" });
      return;
    }

    setSaving(true);
    try {
      const formData = buildTaxiPackageFormData(form, files);
      if (editingId) {
        await partnerClient.taxiPackages.update(editingId, formData);
      } else {
        await partnerClient.taxiPackages.create(formData);
      }
      toast.push({
        title: editingId ? "Taxi package updated" : "Taxi package created",
        tone: "success",
      });
      await refresh();
      setMode("list");
      setEditingId(null);
    } catch (error) {
      toast.push({
        title: editingId ? "Could not update package" : "Could not create package",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removePackage(pkg: TaxiPackageApi) {
    if (!window.confirm(`Delete "${pkg.title}"? This cannot be undone.`)) return;
    try {
      await partnerClient.taxiPackages.remove(pkg.id);
      setPackages((current) => current.filter((p) => p.id !== pkg.id));
      toast.push({ title: "Taxi package deleted", tone: "success" });
    } catch (error) {
      toast.push({
        title: "Could not delete package",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (mode === "form") {
    return (
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              {editingId ? "Edit Taxi Package" : "New Taxi Package"}
            </p>
            <h1 className="mt-1 text-3xl font-black text-ink">
              {editingId ? form.title || "Edit package" : "Create a taxi package"}
            </h1>
          </div>
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>
            Back
          </Button>
        </div>

        <Section title="Basics">
          <Input id="tp-title" label="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Delhi–Shimla–Manali 6D/5N" />
          <Select id="tp-status" label="Status" value={form.status} onChange={(e) => setField("status", e.target.value as TaxiPackageFormState["status"])}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </Select>
          <TextArea id="tp-description" label="Description" value={form.description} onChange={(v) => setField("description", v)} placeholder="What makes this circuit special." />
          <Input id="tp-highlights" label="Highlights (comma separated)" value={form.highlights} onChange={(e) => setField("highlights", e.target.value)} placeholder="Hill stations, Snow points" />
          <Input id="tp-tags" label="Tags (comma separated)" value={form.tags} onChange={(e) => setField("tags", e.target.value)} placeholder="himachal, family" />
        </Section>

        <Section title="Route">
          <Input id="tp-origin" label="Origin" value={form.origin} onChange={(e) => setField("origin", e.target.value)} placeholder="Delhi" />
          <Input id="tp-destinations" label="Destinations (comma separated)" value={form.destinations} onChange={(e) => setField("destinations", e.target.value)} placeholder="Shimla, Manali" />
          <Input id="tp-totalkm" label="Total KM" type="number" min="0" value={form.totalKm} onChange={(e) => setField("totalKm", e.target.value)} />
          <Input id="tp-days" label="Duration (days)" type="number" min="1" value={form.durationDays} onChange={(e) => setField("durationDays", e.target.value)} />
          <Input id="tp-nights" label="Duration (nights)" type="number" min="0" value={form.durationNights} onChange={(e) => setField("durationNights", e.target.value)} />
        </Section>

        <Section title="Vehicle">
          <Select id="tp-vehicle" label="Linked taxi (optional)" value={form.vehicle} onChange={(e) => setField("vehicle", e.target.value)}>
            <option value="">No linked vehicle</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicle.make} {v.vehicle.model}
                {v.vehicle.registrationNumber ? ` • ${v.vehicle.registrationNumber}` : ""}
              </option>
            ))}
          </Select>
          {vehicles.length === 0 ? (
            <p className="text-[13px] text-ink-muted">
              You have no taxi listings yet — you can still create the package and link a vehicle later.
            </p>
          ) : null}
        </Section>

        <Section title="Itinerary">
          <div className="space-y-4">
            {form.itinerary.map((row, index) => (
              <div key={index} className="rounded-xl border border-border-soft bg-surface-muted p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Day {row.day || index + 1}</p>
                  {form.itinerary.length > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => removeItineraryRow(index)}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input id={`tp-it-day-${index}`} label="Day" type="number" min="1" value={row.day} onChange={(e) => setItineraryRow(index, "day", e.target.value)} />
                  <Input id={`tp-it-title-${index}`} label="Title" value={row.title} onChange={(e) => setItineraryRow(index, "title", e.target.value)} placeholder="Delhi to Shimla" />
                  <Input id={`tp-it-overnight-${index}`} label="Overnight at" value={row.overnight} onChange={(e) => setItineraryRow(index, "overnight", e.target.value)} placeholder="Shimla" />
                  <Input id={`tp-it-distance-${index}`} label="Distance (km)" type="number" min="0" value={row.distance} onChange={(e) => setItineraryRow(index, "distance", e.target.value)} />
                  <Input id={`tp-it-activities-${index}`} label="Activities (comma separated)" value={row.activities} onChange={(e) => setItineraryRow(index, "activities", e.target.value)} placeholder="Mall Road, Ridge" />
                  <Input id={`tp-it-desc-${index}`} label="Description" value={row.description} onChange={(e) => setItineraryRow(index, "description", e.target.value)} />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addItineraryRow}>
              Add day
            </Button>
          </div>
        </Section>

        <Section title="Pricing">
          <Input id="tp-baseprice" label="Base price" type="number" min="0" value={form.basePrice} onChange={(e) => setField("basePrice", e.target.value)} />
          <Select id="tp-currency" label="Currency" value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Input id="tp-maxpersons" label="Max persons" type="number" min="1" value={form.maxPersons} onChange={(e) => setField("maxPersons", e.target.value)} />
          <Input id="tp-extra" label="Extra person charge" type="number" min="0" value={form.extraPersonCharge} onChange={(e) => setField("extraPersonCharge", e.target.value)} />
          <div className="flex flex-wrap gap-4 pt-1">
            <Checkbox id="tp-tolls" label="Tolls included" checked={form.tollsIncluded} onChange={(e) => setField("tollsIncluded", e.target.checked)} />
            <Checkbox id="tp-driver" label="Driver allowance included" checked={form.driverAllowance} onChange={(e) => setField("driverAllowance", e.target.checked)} />
            <Checkbox id="tp-fuel" label="Fuel included" checked={form.fuelIncluded} onChange={(e) => setField("fuelIncluded", e.target.checked)} />
          </div>
        </Section>

        <Section title="Inclusions & Exclusions">
          <TextArea id="tp-inclusions" label="Inclusions (comma or newline separated)" value={form.inclusions} onChange={(v) => setField("inclusions", v)} placeholder="Fuel, Driver, Parking" />
          <TextArea id="tp-exclusions" label="Exclusions (comma or newline separated)" value={form.exclusions} onChange={(v) => setField("exclusions", v)} placeholder="Meals, Entry tickets" />
        </Section>

        <Section title="Availability">
          <Input id="tp-startdates" label="Start dates (YYYY-MM-DD, comma separated)" value={form.startDates} onChange={(e) => setField("startDates", e.target.value)} placeholder="2026-07-01, 2026-08-15" />
          <Input id="tp-blackout" label="Blackout dates (YYYY-MM-DD, comma separated)" value={form.blackoutDates} onChange={(e) => setField("blackoutDates", e.target.value)} />
          <Input id="tp-advance" label="Advance booking days" type="number" min="0" value={form.advanceBookingDays} onChange={(e) => setField("advanceBookingDays", e.target.value)} />
        </Section>

        <Section title="Media">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-ink-soft">Thumbnail (cover image)</span>
            <input type="file" accept="image/*" onChange={(e) => setFiles((c) => ({ ...c, thumbnail: e.target.files?.[0] ?? null }))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-ink-soft">Gallery images</span>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles((c) => ({ ...c, images: e.target.files ? Array.from(e.target.files) : [] }))} />
          </label>
          {editingId ? (
            <p className="text-[13px] text-ink-muted">
              Leave media empty to keep the current images; choosing files replaces them.
            </p>
          ) : null}
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-border-soft pt-4">
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {editingId ? "Save changes" : "Create package"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              Partner Taxi Packages
            </p>
            <h1 className="mt-2 text-3xl font-black text-ink">Taxi Packages</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Build fixed-route multi-day cab bundles with day-wise itineraries, pricing, and a
              linked vehicle. Everything is saved to your partner catalogue.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatCard label="Packages" value={String(packages.length)} />
            <StatCard label="Active" value={String(packages.filter((p) => p.status === "active").length)} />
            <Button type="button" variant="accent" onClick={openCreate}>
              Create package
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-xl border border-border-soft bg-white p-10 text-center shadow-(--shadow-xs)">
          <p className="text-sm text-ink-muted">Loading your taxi packages…</p>
        </section>
      ) : packages.length === 0 ? (
        <section className="rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
          <EmptyState
            title="No taxi packages yet"
            subtitle="Create your first fixed-route cab bundle with a day-wise itinerary and pricing."
            cta={
              <Button type="button" variant="accent" onClick={openCreate}>
                Create package
              </Button>
            }
          />
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {packages.map((pkg) => (
            <article key={pkg.id} className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
              {pkg.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pkg.thumbnail} alt={pkg.title} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-surface-muted text-sm text-ink-muted">
                  No cover image
                </div>
              )}
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={pkg.status} />
                  <Badge tone="brand" size="sm">
                    {pkg.route.durationDays}D/{pkg.route.durationNights}N
                  </Badge>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">{pkg.title}</h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {pkg.route.origin} → {pkg.route.destinations.join(" → ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {pkg.pricing.currency} {pkg.pricing.basePrice.toLocaleString("en-IN")}
                  </p>
                  {pkg.vehicleSnapshot?.make ? (
                    <span className="text-[13px] text-ink-muted">
                      {pkg.vehicleSnapshot.make} {pkg.vehicleSnapshot.model}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" variant="secondary" onClick={() => openEdit(pkg)}>
                    Edit
                  </Button>
                  {SUBMITTABLE_STATUSES.includes(pkg.status) && (
                    <Button type="button" variant="primary" loading={submittingId === pkg.id} onClick={() => submitForReview(pkg.id)}>
                      Submit for review
                    </Button>
                  )}
                  <Button type="button" variant="danger" onClick={() => removePackage(pkg)}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] border border-border-soft bg-white p-6 shadow-(--shadow-xs)">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 sm:col-span-2">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-border bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}
