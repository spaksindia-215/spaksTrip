"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { partnerClient, type CruiseListingApi } from "@/lib/partnerClient";
import {
  buildCruiseFormData,
  cruiseFormFromApi,
  emptyCabinRow,
  emptyCruiseForm,
  validateCruiseForm,
  CABIN_TYPES,
  CRUISE_CURRENCIES,
  CRUISE_DEPARTURE_STATUS,
  CRUISE_TYPES,
  type CruiseCabinRow,
  type CruiseDepartureRow,
  type CruiseFiles,
  type CruiseFormState,
  type CruiseStopRow,
} from "@/lib/cruiseForm";

type Mode = "list" | "form";

function titleCase(value: string): string {
  return value.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export default function CruiseManager() {
  const toast = useToast();
  const [cruises, setCruises] = useState<CruiseListingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CruiseFormState>(() => emptyCruiseForm());
  const [files, setFiles] = useState<CruiseFiles>({ vesselImages: [] });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setCruises(await partnerClient.cruises.list());
    } catch (error) {
      toast.push({
        title: "Could not load cruises",
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

  function setField<K extends keyof CruiseFormState>(key: K, value: CruiseFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyCruiseForm());
    setFiles({ vesselImages: [] });
    setMode("form");
  }
  function openEdit(c: CruiseListingApi) {
    setEditingId(c.id);
    setForm(cruiseFormFromApi(c));
    setFiles({ vesselImages: [] });
    setMode("form");
  }
  function backToList() {
    if (saving) return;
    setMode("list");
    setEditingId(null);
  }

  function setStop(index: number, key: keyof CruiseStopRow, value: string) {
    setForm((c) => ({ ...c, stops: c.stops.map((r, i) => (i === index ? { ...r, [key]: value } : r)) }));
  }
  function setCabin(index: number, key: keyof CruiseCabinRow, value: string | boolean) {
    setForm((c) => ({ ...c, cabins: c.cabins.map((r, i) => (i === index ? { ...r, [key]: value } : r)) }));
  }
  function setDeparture(index: number, key: keyof CruiseDepartureRow, value: string) {
    setForm((c) => ({ ...c, departures: c.departures.map((r, i) => (i === index ? { ...r, [key]: value } : r)) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateCruiseForm(form);
    if (error) {
      toast.push({ title: "Please review the cruise", description: error, tone: "warn" });
      return;
    }
    setSaving(true);
    try {
      const data = buildCruiseFormData(form, files);
      if (editingId) await partnerClient.cruises.update(editingId, data);
      else await partnerClient.cruises.create(data);
      toast.push({ title: editingId ? "Cruise updated" : "Cruise created", tone: "success" });
      await refresh();
      setMode("list");
      setEditingId(null);
    } catch (err) {
      toast.push({
        title: editingId ? "Could not update cruise" : "Could not create cruise",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeCruise(c: CruiseListingApi) {
    if (!window.confirm(`Delete "${c.cruiseName}"? This cannot be undone.`)) return;
    try {
      await partnerClient.cruises.remove(c.id);
      setCruises((cur) => cur.filter((x) => x.id !== c.id));
      toast.push({ title: "Cruise deleted", tone: "success" });
    } catch (error) {
      toast.push({
        title: "Could not delete cruise",
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
              {editingId ? "Edit Cruise" : "New Cruise"}
            </p>
            <h1 className="mt-1 text-3xl font-black text-ink">
              {editingId ? form.cruiseName || "Edit cruise" : "Create a cruise"}
            </h1>
          </div>
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>Back</Button>
        </div>

        <Section title="Basics">
          <Input id="c-name" label="Cruise name" value={form.cruiseName} onChange={(e) => setField("cruiseName", e.target.value)} placeholder="Kerala Backwater Luxury" />
          <Select id="c-type" label="Cruise type" value={form.cruiseType} onChange={(e) => setField("cruiseType", e.target.value)}>
            {CRUISE_TYPES.map((t) => (<option key={t} value={t}>{titleCase(t)}</option>))}
          </Select>
          <Select id="c-status" label="Status" value={form.status} onChange={(e) => setField("status", e.target.value as CruiseFormState["status"])}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </Select>
          <Input id="c-tags" label="Tags (comma separated)" value={form.tags} onChange={(e) => setField("tags", e.target.value)} />
          <TextArea id="c-desc" label="Description" value={form.description} onChange={(v) => setField("description", v)} />
          <Input id="c-highlights" label="Highlights (comma separated)" value={form.highlights} onChange={(e) => setField("highlights", e.target.value)} />
        </Section>

        <Section title="Vessel">
          <Input id="c-vname" label="Vessel name" value={form.vesselName} onChange={(e) => setField("vesselName", e.target.value)} />
          <Input id="c-voper" label="Operator" value={form.vesselOperator} onChange={(e) => setField("vesselOperator", e.target.value)} />
          <Input id="c-vdecks" label="Total decks" type="number" min="1" value={form.vesselTotalDecks} onChange={(e) => setField("vesselTotalDecks", e.target.value)} />
          <Input id="c-vyear" label="Built year" type="number" value={form.vesselBuiltYear} onChange={(e) => setField("vesselBuiltYear", e.target.value)} />
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[13px] font-medium text-ink-soft">Vessel images</span>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles({ vesselImages: e.target.files ? Array.from(e.target.files) : [] })} />
          </label>
          {editingId ? <p className="text-[13px] text-ink-muted sm:col-span-2">Leave images empty to keep current ones; choosing files replaces them.</p> : null}
        </Section>

        <Section title="Route">
          <Input id="c-dep" label="Departure port" value={form.departurePort} onChange={(e) => setField("departurePort", e.target.value)} placeholder="Alleppey" />
          <Input id="c-arr" label="Arrival port" value={form.arrivalPort} onChange={(e) => setField("arrivalPort", e.target.value)} />
          <Input id="c-days" label="Duration (days)" type="number" min="1" value={form.durationDays} onChange={(e) => setField("durationDays", e.target.value)} />
          <Input id="c-nights" label="Duration (nights)" type="number" min="0" value={form.durationNights} onChange={(e) => setField("durationNights", e.target.value)} />
          <div className="space-y-3 sm:col-span-2">
            <p className="text-[13px] font-medium text-ink-soft">Stops</p>
            {form.stops.map((row, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-border-soft bg-surface-muted p-4 sm:grid-cols-[1fr_140px_140px_auto]">
                <Input id={`c-st-port-${index}`} label="Port" value={row.port} onChange={(e) => setStop(index, "port", e.target.value)} />
                <Input id={`c-st-arr-${index}`} label="Arrival" value={row.arrivalTime} onChange={(e) => setStop(index, "arrivalTime", e.target.value)} placeholder="11:00" />
                <Input id={`c-st-dep-${index}`} label="Departure" value={row.departureTime} onChange={(e) => setStop(index, "departureTime", e.target.value)} placeholder="12:30" />
                <div className="flex items-end">
                  <Button type="button" variant="ghost" onClick={() => setForm((c) => ({ ...c, stops: c.stops.filter((_, i) => i !== index) }))}>Remove</Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setForm((c) => ({ ...c, stops: [...c.stops, { port: "", arrivalTime: "", departureTime: "" }] }))}>Add stop</Button>
          </div>
        </Section>

        <Section title="Cabins">
          <Select id="c-cur" label="Currency (all cabins)" value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
            {CRUISE_CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </Select>
          <div />
          <div className="space-y-4 sm:col-span-2">
            {form.cabins.map((row, index) => (
              <div key={index} className="rounded-xl border border-border-soft bg-surface-muted p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Cabin {index + 1}</p>
                  {form.cabins.length > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => setForm((c) => ({ ...c, cabins: c.cabins.filter((_, i) => i !== index) }))}>Remove</Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select id={`c-cb-type-${index}`} label="Type" value={row.type} onChange={(e) => setCabin(index, "type", e.target.value)}>
                    {CABIN_TYPES.map((t) => (<option key={t} value={t}>{titleCase(t)}</option>))}
                  </Select>
                  <Input id={`c-cb-label-${index}`} label="Label" value={row.label} onChange={(e) => setCabin(index, "label", e.target.value)} placeholder="Deluxe Balcony" />
                  <Input id={`c-cb-price-${index}`} label="Price per person" type="number" min="0" value={row.pricePerPerson} onChange={(e) => setCabin(index, "pricePerPerson", e.target.value)} />
                  <Input id={`c-cb-occ-${index}`} label="Max occupancy" type="number" min="1" value={row.maxOccupancy} onChange={(e) => setCabin(index, "maxOccupancy", e.target.value)} />
                  <Input id={`c-cb-total-${index}`} label="Total cabins" type="number" min="0" value={row.totalCabins} onChange={(e) => setCabin(index, "totalCabins", e.target.value)} />
                  <Input id={`c-cb-amen-${index}`} label="Amenities (comma separated)" value={row.amenities} onChange={(e) => setCabin(index, "amenities", e.target.value)} />
                  <div className="flex items-center">
                    <Checkbox id={`c-cb-ref-${index}`} label="Refundable" checked={row.isRefundable} onChange={(e) => setCabin(index, "isRefundable", e.target.checked)} />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setForm((c) => ({ ...c, cabins: [...c.cabins, emptyCabinRow()] }))}>Add cabin</Button>
          </div>
        </Section>

        <Section title="Amenities & Dining">
          <Input id="c-ship" label="Ship amenities (comma separated)" value={form.shipAmenities} onChange={(e) => setField("shipAmenities", e.target.value)} placeholder="pool, spa, gym" />
          <Input id="c-dining" label="Dining options (comma separated)" value={form.diningOptions} onChange={(e) => setField("diningOptions", e.target.value)} />
          <div className="flex flex-wrap items-end gap-4 sm:col-span-2">
            <Checkbox id="c-mb" label="Breakfast included" checked={form.mealBreakfast} onChange={(e) => setField("mealBreakfast", e.target.checked)} />
            <Checkbox id="c-ml" label="Lunch included" checked={form.mealLunch} onChange={(e) => setField("mealLunch", e.target.checked)} />
            <Checkbox id="c-md" label="Dinner included" checked={form.mealDinner} onChange={(e) => setField("mealDinner", e.target.checked)} />
          </div>
        </Section>

        <Section title="Departures">
          <div className="space-y-4 sm:col-span-2">
            {form.departures.map((row, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-border-soft bg-surface-muted p-4 sm:grid-cols-[200px_200px_auto]">
                <Input id={`c-dp-date-${index}`} label="Date" type="date" value={row.date} onChange={(e) => setDeparture(index, "date", e.target.value)} />
                <Select id={`c-dp-status-${index}`} label="Status" value={row.status} onChange={(e) => setDeparture(index, "status", e.target.value)}>
                  {CRUISE_DEPARTURE_STATUS.map((s) => (<option key={s} value={s}>{titleCase(s)}</option>))}
                </Select>
                <div className="flex items-end">
                  <Button type="button" variant="ghost" onClick={() => setForm((c) => ({ ...c, departures: c.departures.filter((_, i) => i !== index) }))}>Remove</Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setForm((c) => ({ ...c, departures: [...c.departures, { date: "", status: "open" }] }))}>Add departure</Button>
          </div>
        </Section>

        <Section title="Policies">
          <Input id="c-free" label="Free cancellation (days before)" type="number" min="0" value={form.freeCancelDays} onChange={(e) => setField("freeCancelDays", e.target.value)} />
          <Input id="c-charge" label="Cancellation charge (%)" type="number" min="0" max="100" value={form.chargePercent} onChange={(e) => setField("chargePercent", e.target.value)} />
          <Input id="c-minage" label="Min boarding age" type="number" min="0" value={form.minAge} onChange={(e) => setField("minAge", e.target.value)} />
          <Input id="c-maxage" label="Max boarding age" type="number" min="0" value={form.maxAge} onChange={(e) => setField("maxAge", e.target.value)} />
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-border-soft pt-4">
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{editingId ? "Save changes" : "Create cruise"}</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Partner Cruises</p>
            <h1 className="mt-2 text-3xl font-black text-ink">Cruises</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              List cruise sailings with vessel details, cabin types, departures, and policies.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatCard label="Cruises" value={String(cruises.length)} />
            <StatCard label="Active" value={String(cruises.filter((c) => c.status === "active").length)} />
            <Button type="button" variant="accent" onClick={openCreate}>Create cruise</Button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-xl border border-border-soft bg-white p-10 text-center shadow-(--shadow-xs)">
          <p className="text-sm text-ink-muted">Loading your cruises…</p>
        </section>
      ) : cruises.length === 0 ? (
        <section className="rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
          <EmptyState
            title="No cruises yet"
            subtitle="Create your first cruise with vessel details, cabins, and departures."
            cta={<Button type="button" variant="accent" onClick={openCreate}>Create cruise</Button>}
          />
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {cruises.map((c) => (
            <article key={c.id} className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
              {c.vessel.images[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.vessel.images[0].url} alt={c.cruiseName} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-surface-muted text-sm text-ink-muted">No vessel image</div>
              )}
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={c.status === "active" ? "success" : "warn"} size="sm">{c.status}</Badge>
                  <Badge tone="accent" size="sm">{titleCase(c.cruiseType)}</Badge>
                  <Badge tone="brand" size="sm">{c.route.durationDays}D{c.route.durationNights ? `/${c.route.durationNights}N` : ""}</Badge>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">{c.cruiseName}</h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {c.route.departurePort}{c.route.arrivalPort ? ` → ${c.route.arrivalPort}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {c.cabins[0] ? `From ${c.cabins[0].currency} ${Math.min(...c.cabins.map((cb) => cb.pricePerPerson)).toLocaleString("en-IN")}` : "—"}
                  </p>
                  <span className="text-[13px] text-ink-muted">{c.cabins.length} cabin types</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="secondary" onClick={() => openEdit(c)}>Edit</Button>
                  <Button type="button" variant="danger" onClick={() => removeCruise(c)}>Delete</Button>
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
      <textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-border bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
    </label>
  );
}
