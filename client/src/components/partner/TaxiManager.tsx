"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useSubmitForReview } from "./useSubmitForReview";
import { useToast } from "@/components/ui/Toast";
import { partnerClient, type TaxiListingApi } from "@/lib/partnerClient";
import {
  createEmptyTaxiListingDraft,
  createTaxiListingEditorDraft,
  buildTaxiListingFormData,
  buildTaxiUpdatePatch,
  taxiViewFromApi,
  validateTaxiListingDraft,
  validateTaxiListingEditorDraft,
} from "@/lib/taxiListing";
import {
  TAXI_VEHICLE_TYPES,
  TAXI_FUEL_TYPES,
  TAXI_TRANSMISSION_TYPES,
  TAXI_AVAILABLE_DAYS,
  TAXI_TIME_SLOTS,
  TAXI_AMENITIES,
  type TaxiListingDraft,
  type TaxiListingEditorDraft,
  type TaxiListingUploadFiles,
  type TaxiListingView,
  type TaxiAvailableDay,
  type TaxiTimeSlot,
  type TaxiVehicleType,
  type TaxiFuelType,
  type TaxiTransmissionType,
} from "@/types/taxiListing";

type Mode = "list" | "form";

const emptyFiles = (): TaxiListingUploadFiles => ({
  vehiclePhotos: [],
  rcBook: null,
  insurance: null,
  pollutionCertificate: null,
  drivingLicense: null,
});

function firstError(errors: Record<string, string | undefined>): string | null {
  for (const key of Object.keys(errors)) {
    const msg = errors[key];
    if (msg) return msg;
  }
  return null;
}

export default function TaxiManager() {
  const toast = useToast();
  const [taxis, setTaxis] = useState<TaxiListingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<TaxiListingDraft>(() => createEmptyTaxiListingDraft());
  const [editForm, setEditForm] = useState<TaxiListingEditorDraft | null>(null);
  const [files, setFiles] = useState<TaxiListingUploadFiles>(emptyFiles);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setTaxis(await partnerClient.taxis.list());
    } catch (error) {
      toast.push({
        title: "Could not load taxis",
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

  const { submittingId, submit: submitForReview } = useSubmitForReview("taxi", refresh);

  function setCreateField<K extends keyof TaxiListingDraft>(key: K, value: TaxiListingDraft[K]) {
    setCreateForm((current) => ({ ...current, [key]: value }));
  }
  function setEditField<K extends keyof TaxiListingEditorDraft>(key: K, value: TaxiListingEditorDraft[K]) {
    setEditForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function openCreate() {
    setEditingId(null);
    setEditForm(null);
    setCreateForm(createEmptyTaxiListingDraft());
    setFiles(emptyFiles());
    setMode("form");
  }

  function openEdit(taxi: TaxiListingApi) {
    setEditingId(taxi.id);
    setEditForm(createTaxiListingEditorDraft(taxiViewFromApi(taxi)));
    setMode("form");
  }

  function backToList() {
    if (saving) return;
    setMode("list");
    setEditingId(null);
    setEditForm(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId && editForm) {
        const error = firstError(validateTaxiListingEditorDraft(editForm));
        if (error) { toast.push({ title: "Please review the taxi", description: error, tone: "warn" }); return; }
        await partnerClient.taxis.update(editingId, buildTaxiUpdatePatch(editForm));
        toast.push({ title: "Taxi updated", tone: "success" });
      } else {
        const error = firstError(validateTaxiListingDraft(createForm));
        if (error) { toast.push({ title: "Please review the taxi", description: error, tone: "warn" }); return; }
        await partnerClient.taxis.create(buildTaxiListingFormData(createForm, files));
        toast.push({ title: "Taxi created", tone: "success" });
      }
      await refresh();
      backToList();
    } catch (error) {
      toast.push({
        title: editingId ? "Could not update taxi" : "Could not create taxi",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeTaxi(taxi: TaxiListingView) {
    if (!window.confirm(`Delete "${taxi.brand} ${taxi.model}"? This cannot be undone.`)) return;
    try {
      await partnerClient.taxis.remove(taxi.id);
      setTaxis((current) => current.filter((t) => t.id !== taxi.id));
      toast.push({ title: "Taxi deleted", tone: "success" });
    } catch (error) {
      toast.push({
        title: "Could not delete taxi",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    }
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  if (mode === "form") {
    const isEdit = Boolean(editingId);
    return (
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              {isEdit ? "Edit Taxi" : "New Taxi"}
            </p>
            <h1 className="mt-1 text-3xl font-black text-ink">
              {isEdit ? "Edit taxi" : "Add a taxi"}
            </h1>
          </div>
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>
            Back
          </Button>
        </div>

        {isEdit && editForm ? (
          <>
            <Section title="Operating area">
              <Input id="tx-city" label="Operating city" value={editForm.operatingCity} onChange={(e) => setEditField("operatingCity", e.target.value)} placeholder="Delhi" />
              <Input id="tx-areas" label="Service areas (comma separated)" value={editForm.serviceAreas} onChange={(e) => setEditField("serviceAreas", e.target.value)} placeholder="Noida, Gurgaon" />
              <Input id="tx-routes" label="Routes (comma separated)" value={editForm.availableRoutes} onChange={(e) => setEditField("availableRoutes", e.target.value)} placeholder="Delhi-Agra, Delhi-Jaipur" />
            </Section>
            <Section title="Pricing">
              <Input id="tx-minfare" label="Minimum fare" type="number" min="0" value={editForm.minimumFare} onChange={(e) => setEditField("minimumFare", e.target.value)} />
              <Input id="tx-perkm" label="Price per km" type="number" min="0" value={editForm.pricePerKm} onChange={(e) => setEditField("pricePerKm", e.target.value)} />
            </Section>
            <Section title="Availability">
              <CheckGroup label="Available days" options={TAXI_AVAILABLE_DAYS} selected={editForm.availableDays} onToggle={(d) => setEditField("availableDays", toggle(editForm.availableDays, d as TaxiAvailableDay))} />
              <CheckGroup label="Time slots" options={TAXI_TIME_SLOTS} selected={editForm.availableTimeSlots} onToggle={(s) => setEditField("availableTimeSlots", toggle(editForm.availableTimeSlots, s as TaxiTimeSlot))} />
            </Section>
            <Section title="Amenities & description">
              <CheckGroup label="Amenities" options={TAXI_AMENITIES} selected={editForm.amenities} onToggle={(a) => setEditField("amenities", toggle(editForm.amenities, a))} />
              <TextArea id="tx-desc" label="Description" value={editForm.description} onChange={(v) => setEditField("description", v)} placeholder="What makes this ride great." />
            </Section>
          </>
        ) : (
          <>
            <Section title="Contact">
              <Input id="tx-name" label="Full name" value={createForm.fullName} onChange={(e) => setCreateField("fullName", e.target.value)} placeholder="Ramesh Kumar" />
              <Input id="tx-mobile" label="Mobile number" value={createForm.mobileNumber} onChange={(e) => setCreateField("mobileNumber", e.target.value)} placeholder="+91 98765 43210" />
              <Input id="tx-email" label="Email" type="email" value={createForm.emailAddress} onChange={(e) => setCreateField("emailAddress", e.target.value)} placeholder="you@example.com" />
              <Input id="tx-business" label="Business name (optional)" value={createForm.businessName} onChange={(e) => setCreateField("businessName", e.target.value)} placeholder="Kumar Travels" />
            </Section>

            <Section title="Vehicle">
              <Select id="tx-type" label="Vehicle type" value={createForm.vehicleType} onChange={(e) => setCreateField("vehicleType", e.target.value as TaxiVehicleType)}>
                <option value="">Select type</option>
                {TAXI_VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Input id="tx-brand" label="Brand" value={createForm.brand} onChange={(e) => setCreateField("brand", e.target.value)} placeholder="Toyota" />
              <Input id="tx-model" label="Model" value={createForm.model} onChange={(e) => setCreateField("model", e.target.value)} placeholder="Innova Crysta" />
              <Input id="tx-reg" label="Registration number" value={createForm.registrationNumber} onChange={(e) => setCreateField("registrationNumber", e.target.value)} placeholder="DL01AB1234" />
              <Input id="tx-seats" label="Seating capacity" type="number" min="1" value={createForm.seatingCapacity} onChange={(e) => setCreateField("seatingCapacity", e.target.value)} />
              <Select id="tx-fuel" label="Fuel type" value={createForm.fuelType} onChange={(e) => setCreateField("fuelType", e.target.value as TaxiFuelType)}>
                <option value="">Select fuel</option>
                {TAXI_FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
              <Select id="tx-trans" label="Transmission" value={createForm.transmission} onChange={(e) => setCreateField("transmission", e.target.value as TaxiTransmissionType)}>
                <option value="">Select transmission</option>
                {TAXI_TRANSMISSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Input id="tx-year" label="Year of manufacture" type="number" min="1990" value={createForm.yearOfManufacture} onChange={(e) => setCreateField("yearOfManufacture", e.target.value)} />
              <Input id="tx-luggage" label="Luggage capacity (bags)" type="number" min="0" value={createForm.luggageCapacity} onChange={(e) => setCreateField("luggageCapacity", e.target.value)} />
              <div className="flex items-center pt-1">
                <Checkbox id="tx-ac" label="Air conditioning" checked={createForm.acAvailable} onChange={(e) => setCreateField("acAvailable", e.target.checked)} />
              </div>
            </Section>

            <Section title="Operating area">
              <Input id="tx-city-c" label="Operating city" value={createForm.operatingCity} onChange={(e) => setCreateField("operatingCity", e.target.value)} placeholder="Delhi" />
              <Input id="tx-areas-c" label="Service areas (comma separated)" value={createForm.serviceAreas} onChange={(e) => setCreateField("serviceAreas", e.target.value)} placeholder="Noida, Gurgaon" />
              <Input id="tx-routes-c" label="Routes (comma separated)" value={createForm.availableRoutes} onChange={(e) => setCreateField("availableRoutes", e.target.value)} placeholder="Delhi-Agra, Delhi-Jaipur" />
            </Section>

            <Section title="Pricing">
              <Input id="tx-minfare-c" label="Minimum fare" type="number" min="0" value={createForm.minimumFare} onChange={(e) => setCreateField("minimumFare", e.target.value)} />
              <Input id="tx-perkm-c" label="Price per km" type="number" min="0" value={createForm.pricePerKm} onChange={(e) => setCreateField("pricePerKm", e.target.value)} />
              <div className="flex flex-wrap gap-4 pt-1 sm:col-span-2">
                <Checkbox id="tx-driver" label="Driver included" checked={createForm.driverIncluded} onChange={(e) => setCreateField("driverIncluded", e.target.checked)} />
                <Checkbox id="tx-self" label="Self-drive available" checked={createForm.selfDriveAvailable} onChange={(e) => setCreateField("selfDriveAvailable", e.target.checked)} />
              </div>
            </Section>

            <Section title="Availability">
              <CheckGroup label="Available days" options={TAXI_AVAILABLE_DAYS} selected={createForm.availableDays} onToggle={(d) => setCreateField("availableDays", toggle(createForm.availableDays, d as TaxiAvailableDay))} />
              <CheckGroup label="Time slots" options={TAXI_TIME_SLOTS} selected={createForm.availableTimeSlots} onToggle={(s) => setCreateField("availableTimeSlots", toggle(createForm.availableTimeSlots, s as TaxiTimeSlot))} />
            </Section>

            <Section title="Amenities & description">
              <CheckGroup label="Amenities" options={TAXI_AMENITIES} selected={createForm.amenities} onToggle={(a) => setCreateField("amenities", toggle(createForm.amenities, a))} />
              <TextArea id="tx-desc-c" label="Description" value={createForm.description} onChange={(v) => setCreateField("description", v)} placeholder="What makes this ride great." />
            </Section>

            <Section title="Documents & photos">
              <FileField label="Vehicle photos" multiple onChange={(fl) => setFiles((c) => ({ ...c, vehiclePhotos: fl ? Array.from(fl) : [] }))} />
              <FileField label="RC book" onChange={(fl) => setFiles((c) => ({ ...c, rcBook: fl?.[0] ?? null }))} />
              <FileField label="Insurance" onChange={(fl) => setFiles((c) => ({ ...c, insurance: fl?.[0] ?? null }))} />
              <FileField label="Pollution certificate" onChange={(fl) => setFiles((c) => ({ ...c, pollutionCertificate: fl?.[0] ?? null }))} />
              <FileField label="Driving license" onChange={(fl) => setFiles((c) => ({ ...c, drivingLicense: fl?.[0] ?? null }))} />
            </Section>

            <Section title="Confirmation">
              <div className="sm:col-span-2">
                <Checkbox id="tx-terms" label="I confirm these vehicle and document details are accurate." checked={createForm.acceptTerms} onChange={(e) => setCreateField("acceptTerms", e.target.checked)} />
              </div>
            </Section>
          </>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border-soft pt-4">
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Save changes" : "Create taxi"}
          </Button>
        </div>
      </form>
    );
  }

  // ── List ─────────────────────────────────────────────────────────────────────
  const views = taxis.map(taxiViewFromApi);
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              Airport, city, and sightseeing cab inventory
            </p>
            <h1 className="mt-2 text-3xl font-black text-ink">Taxis</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Manage pricing, descriptions, and structured details for every taxi you publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatCard label="Taxis" value={String(views.length)} />
            <Button type="button" variant="accent" onClick={openCreate}>
              Create taxi
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-xl border border-border-soft bg-white p-10 text-center shadow-(--shadow-xs)">
          <p className="text-sm text-ink-muted">Loading your taxis…</p>
        </section>
      ) : views.length === 0 ? (
        <section className="rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
          <EmptyState
            title="No taxis yet"
            subtitle="Create your first taxi listing to start building inventory."
            cta={
              <Button type="button" variant="accent" onClick={openCreate}>
                Create taxi
              </Button>
            }
          />
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {views.map((taxi) => (
            <article key={taxi.id} className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
              {taxi.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={taxi.images[0]} alt={`${taxi.brand} ${taxi.model}`} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-surface-muted text-sm text-ink-muted">
                  No vehicle photo
                </div>
              )}
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand" size="sm">{taxi.vehicleType}</Badge>
                  <StatusBadge status={taxis.find((t) => t.id === taxi.id)?.status ?? "draft"} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">{taxi.brand} {taxi.model}</h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {taxi.operatingCity}
                    {taxi.serviceAreas.length ? ` • ${taxi.serviceAreas.slice(0, 3).join(", ")}` : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink">
                  ₹{taxi.minimumFare.toLocaleString("en-IN")} base • ₹{taxi.pricePerKm.toLocaleString("en-IN")}/km
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" variant="secondary" onClick={() => openEdit(taxis.find((t) => t.id === taxi.id)!)}>
                    Edit
                  </Button>
                  {["draft", "paused", "suspended"].includes(taxis.find((t) => t.id === taxi.id)?.status ?? "") && (
                    <Button
                      type="button"
                      variant="primary"
                      loading={submittingId === taxi.id}
                      onClick={() => submitForReview(taxi.id)}
                    >
                      Submit for review
                    </Button>
                  )}
                  <Button type="button" variant="danger" onClick={() => removeTaxi(taxi)}>
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

// ── Shared layout helpers (match TaxiPackageManager) ──────────────────────────
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

function TextArea({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
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

function FileField({ label, multiple, onChange }: { label: string; multiple?: boolean; onChange: (files: FileList | null) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <input type="file" accept="image/*,application/pdf" multiple={multiple} onChange={(e) => onChange(e.target.files)} className="text-[13px]" />
    </label>
  );
}

function CheckGroup({ label, options, selected, onToggle }: { label: string; options: readonly string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border bg-white text-ink-soft hover:border-brand-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
