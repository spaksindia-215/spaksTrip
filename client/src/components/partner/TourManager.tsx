"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { partnerClient, type TourListingApi } from "@/lib/partnerClient";
import {
  buildTourFormData,
  emptyPricingRow,
  emptyTourForm,
  tourFormFromApi,
  validateTourForm,
  TOUR_CATEGORIES,
  TOUR_CURRENCIES,
  TOUR_OPERATING_DAYS,
  type TourFiles,
  type TourFormState,
  type TourItineraryRow,
  type TourPickupRow,
  type TourPricingRow,
} from "@/lib/tourForm";

type Mode = "list" | "form";

const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function titleCase(value: string): string {
  return value
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default function TourManager() {
  const toast = useToast();
  const [tours, setTours] = useState<TourListingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TourFormState>(() => emptyTourForm());
  const [files, setFiles] = useState<TourFiles>({ images: [] });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setTours(await partnerClient.tours.list());
    } catch (error) {
      toast.push({
        title: "Could not load tours",
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

  function setField<K extends keyof TourFormState>(key: K, value: TourFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyTourForm());
    setFiles({ images: [] });
    setMode("form");
  }

  function openEdit(tour: TourListingApi) {
    setEditingId(tour.id);
    setForm(tourFormFromApi(tour));
    setFiles({ images: [] });
    setMode("form");
  }

  function backToList() {
    if (saving) return;
    setMode("list");
    setEditingId(null);
  }

  function toggleDay(day: string) {
    setForm((current) => ({
      ...current,
      operatingDays: current.operatingDays.includes(day)
        ? current.operatingDays.filter((d) => d !== day)
        : [...current.operatingDays, day],
    }));
  }

  // ── Dynamic row helpers ────────────────────────────────────────────────────
  function setItinerary(index: number, key: keyof TourItineraryRow, value: string) {
    setForm((c) => ({
      ...c,
      itinerary: c.itinerary.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    }));
  }
  function setPricing(index: number, key: keyof TourPricingRow, value: string) {
    setForm((c) => ({
      ...c,
      pricing: c.pricing.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    }));
  }
  function setPickup(index: number, key: keyof TourPickupRow, value: string) {
    setForm((c) => ({
      ...c,
      pickupPoints: c.pickupPoints.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateTourForm(form);
    if (error) {
      toast.push({ title: "Please review the tour", description: error, tone: "warn" });
      return;
    }
    setSaving(true);
    try {
      const data = buildTourFormData(form, files);
      if (editingId) await partnerClient.tours.update(editingId, data);
      else await partnerClient.tours.create(data);
      toast.push({ title: editingId ? "Tour updated" : "Tour created", tone: "success" });
      await refresh();
      setMode("list");
      setEditingId(null);
    } catch (err) {
      toast.push({
        title: editingId ? "Could not update tour" : "Could not create tour",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeTour(tour: TourListingApi) {
    if (!window.confirm(`Delete "${tour.title}"? This cannot be undone.`)) return;
    try {
      await partnerClient.tours.remove(tour.id);
      setTours((c) => c.filter((t) => t.id !== tour.id));
      toast.push({ title: "Tour deleted", tone: "success" });
    } catch (error) {
      toast.push({
        title: "Could not delete tour",
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
              {editingId ? "Edit Tour" : "New Tour"}
            </p>
            <h1 className="mt-1 text-3xl font-black text-ink">
              {editingId ? form.title || "Edit tour" : "Create a tour"}
            </h1>
          </div>
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>
            Back
          </Button>
        </div>

        <Section title="Basics">
          <Input id="t-title" label="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Jaipur City Tour by AC Coach" />
          <Select id="t-category" label="Category" value={form.category} onChange={(e) => setField("category", e.target.value)}>
            {TOUR_CATEGORIES.map((c) => (
              <option key={c} value={c}>{titleCase(c)}</option>
            ))}
          </Select>
          <Select id="t-status" label="Status" value={form.status} onChange={(e) => setField("status", e.target.value as TourFormState["status"])}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </Select>
          <Input id="t-languages" label="Languages (comma separated)" value={form.languages} onChange={(e) => setField("languages", e.target.value)} placeholder="English, Hindi" />
          <TextArea id="t-description" label="Description" value={form.description} onChange={(v) => setField("description", v)} />
          <Input id="t-highlights" label="Highlights (comma separated)" value={form.highlights} onChange={(e) => setField("highlights", e.target.value)} />
          <Input id="t-tags" label="Tags (comma separated)" value={form.tags} onChange={(e) => setField("tags", e.target.value)} />
        </Section>

        <Section title="Location & Duration">
          <Input id="t-basedin" label="Based in" value={form.basedIn} onChange={(e) => setField("basedIn", e.target.value)} placeholder="Jaipur" />
          <Input id="t-covers" label="Covers cities (comma separated)" value={form.coversCities} onChange={(e) => setField("coversCities", e.target.value)} placeholder="Jaipur, Amer" />
          <Input id="t-lat" label="Latitude" type="number" value={form.latitude} onChange={(e) => setField("latitude", e.target.value)} />
          <Input id="t-lng" label="Longitude" type="number" value={form.longitude} onChange={(e) => setField("longitude", e.target.value)} />
          <Input id="t-dh" label="Duration (hours)" type="number" min="0" value={form.durationHours} onChange={(e) => setField("durationHours", e.target.value)} />
          <Input id="t-dd" label="Duration (days)" type="number" min="0" value={form.durationDays} onChange={(e) => setField("durationDays", e.target.value)} />
          <Input id="t-dn" label="Duration (nights)" type="number" min="0" value={form.durationNights} onChange={(e) => setField("durationNights", e.target.value)} />
        </Section>

        <Section title="Itinerary">
          <div className="space-y-4 sm:col-span-2">
            {form.itinerary.map((row, index) => (
              <div key={index} className="rounded-xl border border-border-soft bg-surface-muted p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Stop {index + 1}</p>
                  {form.itinerary.length > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => setForm((c) => ({ ...c, itinerary: c.itinerary.filter((_, i) => i !== index) }))}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input id={`t-it-time-${index}`} label="Time" value={row.time} onChange={(e) => setItinerary(index, "time", e.target.value)} placeholder="09:00 AM" />
                  <Input id={`t-it-title-${index}`} label="Title" value={row.title} onChange={(e) => setItinerary(index, "title", e.target.value)} />
                  <Input id={`t-it-loc-${index}`} label="Location" value={row.location} onChange={(e) => setItinerary(index, "location", e.target.value)} />
                  <Input id={`t-it-desc-${index}`} label="Description" value={row.description} onChange={(e) => setItinerary(index, "description", e.target.value)} />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setForm((c) => ({ ...c, itinerary: [...c.itinerary, { time: "", title: "", description: "", location: "" }] }))}>
              Add stop
            </Button>
          </div>
        </Section>

        <Section title="Pricing tiers">
          <Select id="t-currency" label="Currency" value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
            {TOUR_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <div className="space-y-4 sm:col-span-2">
            {form.pricing.map((row, index) => (
              <div key={index} className="rounded-xl border border-border-soft bg-surface-muted p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Tier {index + 1}</p>
                  {form.pricing.length > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => setForm((c) => ({ ...c, pricing: c.pricing.filter((_, i) => i !== index) }))}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input id={`t-pr-label-${index}`} label="Label" value={row.label} onChange={(e) => setPricing(index, "label", e.target.value)} placeholder="Adult" />
                  <Input id={`t-pr-price-${index}`} label="Price" type="number" min="0" value={row.price} onChange={(e) => setPricing(index, "price", e.target.value)} />
                  <Input id={`t-pr-min-${index}`} label="Min age" type="number" min="0" value={row.minAge} onChange={(e) => setPricing(index, "minAge", e.target.value)} />
                  <Input id={`t-pr-max-${index}`} label="Max age" type="number" min="0" value={row.maxAge} onChange={(e) => setPricing(index, "maxAge", e.target.value)} />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setForm((c) => ({ ...c, pricing: [...c.pricing, emptyPricingRow()] }))}>
              Add tier
            </Button>
          </div>
        </Section>

        <Section title="Group & Private">
          <Input id="t-mingroup" label="Min group size" type="number" min="1" value={form.minGroupSize} onChange={(e) => setField("minGroupSize", e.target.value)} />
          <Input id="t-maxgroup" label="Max group size" type="number" min="1" value={form.maxGroupSize} onChange={(e) => setField("maxGroupSize", e.target.value)} />
          <div className="flex items-center pt-6">
            <Checkbox id="t-private" label="Private tour available" checked={form.privateAvailable} onChange={(e) => setField("privateAvailable", e.target.checked)} />
          </div>
          <Input id="t-privateprice" label="Private price" type="number" min="0" value={form.privatePrice} onChange={(e) => setField("privatePrice", e.target.value)} />
        </Section>

        <Section title="Inclusions & Pickup">
          <TextArea id="t-inclusions" label="Inclusions (comma or newline)" value={form.inclusions} onChange={(v) => setField("inclusions", v)} />
          <TextArea id="t-exclusions" label="Exclusions (comma or newline)" value={form.exclusions} onChange={(v) => setField("exclusions", v)} />
          <div className="flex items-center sm:col-span-2">
            <Checkbox id="t-pickup" label="Pickup included" checked={form.pickupIncluded} onChange={(e) => setField("pickupIncluded", e.target.checked)} />
          </div>
          <div className="space-y-4 sm:col-span-2">
            {form.pickupPoints.map((row, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-border-soft bg-surface-muted p-4 sm:grid-cols-[1fr_1fr_auto]">
                <Input id={`t-pp-name-${index}`} label="Pickup point" value={row.name} onChange={(e) => setPickup(index, "name", e.target.value)} />
                <Input id={`t-pp-time-${index}`} label="Time" value={row.time} onChange={(e) => setPickup(index, "time", e.target.value)} />
                <div className="flex items-end">
                  <Button type="button" variant="ghost" onClick={() => setForm((c) => ({ ...c, pickupPoints: c.pickupPoints.filter((_, i) => i !== index) }))}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setForm((c) => ({ ...c, pickupPoints: [...c.pickupPoints, { name: "", time: "" }] }))}>
              Add pickup point
            </Button>
          </div>
        </Section>

        <Section title="Availability">
          <div className="sm:col-span-2">
            <p className="mb-2 text-[13px] font-medium text-ink-soft">Operating days</p>
            <div className="flex flex-wrap gap-3">
              {TOUR_OPERATING_DAYS.map((day) => (
                <Checkbox key={day} id={`t-day-${day}`} label={DAY_LABELS[day]} checked={form.operatingDays.includes(day)} onChange={() => toggleDay(day)} />
              ))}
            </div>
          </div>
          <Input id="t-starttimes" label="Start times (comma separated)" value={form.startTimes} onChange={(e) => setField("startTimes", e.target.value)} placeholder="09:00, 14:00" />
          <Input id="t-advance" label="Advance booking (hours)" type="number" min="0" value={form.advanceBookingHrs} onChange={(e) => setField("advanceBookingHrs", e.target.value)} />
          <Input id="t-blackout" label="Blackout dates (YYYY-MM-DD, comma separated)" value={form.blackoutDates} onChange={(e) => setField("blackoutDates", e.target.value)} />
        </Section>

        <Section title="Media">
          <Input id="t-video" label="Video URL" value={form.videoUrl} onChange={(e) => setField("videoUrl", e.target.value)} placeholder="https://youtu.be/…" />
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[13px] font-medium text-ink-soft">Gallery images</span>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles({ images: e.target.files ? Array.from(e.target.files) : [] })} />
          </label>
          {editingId ? (
            <p className="text-[13px] text-ink-muted sm:col-span-2">
              Leave images empty to keep the current ones; choosing files replaces them.
            </p>
          ) : null}
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-border-soft pt-4">
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {editingId ? "Save changes" : "Create tour"}
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Partner Tours</p>
            <h1 className="mt-2 text-3xl font-black text-ink">Tours</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              List guided day or multi-day tours with itineraries, pricing tiers, and availability.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatCard label="Tours" value={String(tours.length)} />
            <StatCard label="Active" value={String(tours.filter((t) => t.status === "active").length)} />
            <Button type="button" onClick={openCreate}>Create tour</Button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-xl border border-border-soft bg-white p-10 text-center shadow-(--shadow-xs)">
          <p className="text-sm text-ink-muted">Loading your tours…</p>
        </section>
      ) : tours.length === 0 ? (
        <section className="rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
          <EmptyState
            title="No tours yet"
            subtitle="Create your first guided tour with an itinerary and pricing tiers."
            cta={<Button type="button" onClick={openCreate}>Create tour</Button>}
          />
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {tours.map((tour) => (
            <article key={tour.id} className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
              {tour.images[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tour.images[0].url} alt={tour.title} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-surface-muted text-sm text-ink-muted">No image</div>
              )}
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <Badge tone={tour.status === "active" ? "success" : "warn"} size="sm">{tour.status}</Badge>
                  <Badge tone="accent" size="sm">{titleCase(tour.category)}</Badge>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">{tour.title}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{tour.basedIn}</p>
                </div>
                <p className="text-sm font-semibold text-ink">
                  From {tour.pricing[0]?.currency ?? "INR"}{" "}
                  {(tour.pricing.length ? Math.min(...tour.pricing.map((p) => p.price)) : 0).toLocaleString("en-IN")}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="secondary" onClick={() => openEdit(tour)}>Edit</Button>
                  <Button type="button" variant="danger" onClick={() => removeTour(tour)}>Delete</Button>
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 sm:col-span-2">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}
