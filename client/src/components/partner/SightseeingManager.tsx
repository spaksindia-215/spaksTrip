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
import { partnerClient, type SightseeingListingApi, type ServiceEnquiryApi } from "@/lib/partnerClient";
import {
  buildSightseeingFormData,
  emptySightseeingForm,
  sightseeingFormFromApi,
  validateSightseeingForm,
  SIGHTSEEING_CATEGORIES,
  SIGHTSEEING_DIFFICULTY,
  SIGHTSEEING_PRICING_MODELS,
  SIGHTSEEING_DURATION_UNITS,
  SIGHTSEEING_CANCELLATION_POLICIES,
  SIGHTSEEING_OPERATING_DAYS,
  SIGHTSEEING_CURRENCIES,
  CATEGORY_LABELS,
  POLICY_LABELS,
  type SightseeingFiles,
  type SightseeingFormState,
} from "@/lib/sightseeingForm";

type Mode = "list" | "form" | "enquiries";

const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

const ENQUIRY_STATUSES = ["new", "contacted", "quoted", "converted", "closed", "spam"] as const;

function titleCase(value: string): string {
  return value.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export default function SightseeingManager() {
  const toast = useToast();
  const [items, setItems] = useState<SightseeingListingApi[]>([]);
  const [enquiries, setEnquiries] = useState<ServiceEnquiryApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SightseeingFormState>(() => emptySightseeingForm());
  const [files, setFiles] = useState<SightseeingFiles>({ images: [] });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [list, leads] = await Promise.all([
        partnerClient.sightseeing.list(),
        partnerClient.sightseeing.enquiries(),
      ]);
      setItems(list);
      setEnquiries(leads);
    } catch (error) {
      toast.push({
        title: "Could not load activities",
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

  const { submittingId, submit: submitForReview } = useSubmitForReview("sightseeing", refresh);

  function setField<K extends keyof SightseeingFormState>(key: K, value: SightseeingFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptySightseeingForm());
    setFiles({ images: [] });
    setMode("form");
  }

  function openEdit(item: SightseeingListingApi) {
    setEditingId(item.id);
    setForm(sightseeingFormFromApi(item));
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
      availableDays: current.availableDays.includes(day)
        ? current.availableDays.filter((d) => d !== day)
        : [...current.availableDays, day],
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateSightseeingForm(form);
    if (error) {
      toast.push({ title: "Please review the activity", description: error, tone: "warn" });
      return;
    }
    setSaving(true);
    try {
      const data = buildSightseeingFormData(form, files);
      if (editingId) await partnerClient.sightseeing.update(editingId, data);
      else await partnerClient.sightseeing.create(data);
      toast.push({ title: editingId ? "Activity updated" : "Activity created", tone: "success" });
      await refresh();
      setMode("list");
      setEditingId(null);
    } catch (err) {
      toast.push({
        title: editingId ? "Could not update activity" : "Could not create activity",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: SightseeingListingApi) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await partnerClient.sightseeing.remove(item.id);
      setItems((c) => c.filter((t) => t.id !== item.id));
      toast.push({ title: "Activity deleted", tone: "success" });
    } catch (error) {
      toast.push({
        title: "Could not delete activity",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    }
  }

  async function updateEnquiry(id: string, status: string) {
    try {
      const updated = await partnerClient.sightseeing.updateEnquiry(id, { status });
      setEnquiries((c) => c.map((e) => (e.id === id ? updated : e)));
      toast.push({ title: "Enquiry updated", tone: "success" });
    } catch (error) {
      toast.push({
        title: "Could not update enquiry",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    }
  }

  // ── Form view ────────────────────────────────────────────────────────────────
  if (mode === "form") {
    return (
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              {editingId ? "Edit Activity" : "New Activity"}
            </p>
            <h1 className="mt-1 text-3xl font-black text-ink">
              {editingId ? form.title || "Edit activity" : "Create an activity"}
            </h1>
          </div>
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>Back</Button>
        </div>

        <Section title="Basics">
          <Input id="s-title" label="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Sunset Dolphin Cruise" />
          <Select id="s-category" label="Category" value={form.category} onChange={(e) => setField("category", e.target.value)}>
            {SIGHTSEEING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] ?? titleCase(c)}</option>
            ))}
          </Select>
          <Select id="s-status" label="Status" value={form.status} onChange={(e) => setField("status", e.target.value as SightseeingFormState["status"])}>
            <option value="draft">Draft</option>
            <option value="active">Active (still needs admin approval to go live)</option>
          </Select>
          <Input id="s-languages" label="Languages (comma separated)" value={form.languages} onChange={(e) => setField("languages", e.target.value)} placeholder="English, Hindi" />
          <TextArea id="s-description" label="Description" value={form.description} onChange={(v) => setField("description", v)} />
          <Input id="s-highlights" label="Highlights (comma separated)" value={form.highlights} onChange={(e) => setField("highlights", e.target.value)} />
          <Input id="s-tags" label="Tags (comma separated)" value={form.tags} onChange={(e) => setField("tags", e.target.value)} />
        </Section>

        <Section title="Location & Meeting Point">
          <Input id="s-island" label="Island / City" value={form.island} onChange={(e) => setField("island", e.target.value)} placeholder="Havelock" />
          <Input id="s-address" label="Address" value={form.address} onChange={(e) => setField("address", e.target.value)} />
          <TextArea id="s-meeting" label="Meeting point instructions" value={form.meetingInstructions} onChange={(v) => setField("meetingInstructions", v)} />
        </Section>

        <Section title="Duration & Group">
          <Input id="s-dur" label="Duration value" type="number" min="0" value={form.durationValue} onChange={(e) => setField("durationValue", e.target.value)} placeholder="2" />
          <Select id="s-durunit" label="Duration unit" value={form.durationUnit} onChange={(e) => setField("durationUnit", e.target.value)}>
            {SIGHTSEEING_DURATION_UNITS.map((u) => (<option key={u} value={u}>{titleCase(u)}</option>))}
          </Select>
          <Select id="s-difficulty" label="Difficulty (optional)" value={form.difficulty} onChange={(e) => setField("difficulty", e.target.value)}>
            <option value="">—</option>
            {SIGHTSEEING_DIFFICULTY.map((d) => (<option key={d} value={d}>{titleCase(d)}</option>))}
          </Select>
          <Input id="s-minage" label="Min age" type="number" min="0" value={form.minAge} onChange={(e) => setField("minAge", e.target.value)} />
          <Input id="s-maxage" label="Max age" type="number" min="0" value={form.maxAge} onChange={(e) => setField("maxAge", e.target.value)} />
          <Input id="s-mingroup" label="Min participants" type="number" min="1" value={form.minGroupSize} onChange={(e) => setField("minGroupSize", e.target.value)} />
          <Input id="s-maxgroup" label="Max participants" type="number" min="1" value={form.maxGroupSize} onChange={(e) => setField("maxGroupSize", e.target.value)} />
        </Section>

        <Section title="Pricing">
          <Select id="s-pmodel" label="Pricing model" value={form.pricingModel} onChange={(e) => setField("pricingModel", e.target.value)}>
            {SIGHTSEEING_PRICING_MODELS.map((m) => (<option key={m} value={m}>{titleCase(m)}</option>))}
          </Select>
          <Select id="s-currency" label="Currency" value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
            {SIGHTSEEING_CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </Select>
          <Input id="s-padult" label="Adult price" type="number" min="0" value={form.priceAdult} onChange={(e) => setField("priceAdult", e.target.value)} />
          <Input id="s-pchild" label="Child price" type="number" min="0" value={form.priceChild} onChange={(e) => setField("priceChild", e.target.value)} />
          <Input id="s-pinfant" label="Infant price" type="number" min="0" value={form.priceInfant} onChange={(e) => setField("priceInfant", e.target.value)} />
          <Input id="s-pgroup" label="Group price" type="number" min="0" value={form.priceGroup} onChange={(e) => setField("priceGroup", e.target.value)} />
        </Section>

        <Section title="Inclusions">
          <TextArea id="s-incl" label="Inclusions (comma or newline)" value={form.inclusions} onChange={(v) => setField("inclusions", v)} />
          <TextArea id="s-excl" label="Exclusions (comma or newline)" value={form.exclusions} onChange={(v) => setField("exclusions", v)} />
          <TextArea id="s-bring" label="What to bring (comma or newline)" value={form.whatToBring} onChange={(v) => setField("whatToBring", v)} />
          <Input id="s-access" label="Accessibility (comma separated)" value={form.accessibility} onChange={(e) => setField("accessibility", e.target.value)} placeholder="Wheelchair accessible" />
        </Section>

        <Section title="Availability">
          <div className="sm:col-span-2">
            <p className="mb-2 text-[13px] font-medium text-ink-soft">Available days</p>
            <div className="flex flex-wrap gap-3">
              {SIGHTSEEING_OPERATING_DAYS.map((day) => (
                <Checkbox key={day} id={`s-day-${day}`} label={DAY_LABELS[day]} checked={form.availableDays.includes(day)} onChange={() => toggleDay(day)} />
              ))}
            </div>
          </div>
          <Input id="s-slots" label="Time slots (comma separated)" value={form.timeSlots} onChange={(e) => setField("timeSlots", e.target.value)} placeholder="09:00, 14:00" />
          <Input id="s-cutoff" label="Booking cutoff (hours before)" type="number" min="0" value={form.bookingCutoffHours} onChange={(e) => setField("bookingCutoffHours", e.target.value)} />
          <Input id="s-blackout" label="Blackout dates (YYYY-MM-DD, comma separated)" value={form.blackoutDates} onChange={(e) => setField("blackoutDates", e.target.value)} />
        </Section>

        <Section title="Policy & Media">
          <Select id="s-cancel" label="Cancellation policy" value={form.cancellationPolicy} onChange={(e) => setField("cancellationPolicy", e.target.value)}>
            {SIGHTSEEING_CANCELLATION_POLICIES.map((p) => (<option key={p} value={p}>{POLICY_LABELS[p] ?? titleCase(p)}</option>))}
          </Select>
          <Input id="s-video" label="Video URL" value={form.videoUrl} onChange={(e) => setField("videoUrl", e.target.value)} placeholder="https://youtu.be/…" />
          <TextArea id="s-terms" label="Terms & conditions" value={form.termsAndConditions} onChange={(v) => setField("termsAndConditions", v)} />
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[13px] font-medium text-ink-soft">Gallery images (min 3 recommended)</span>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles({ images: e.target.files ? Array.from(e.target.files) : [] })} />
          </label>
          {editingId ? (
            <p className="text-[13px] text-ink-muted sm:col-span-2">
              Leave images empty to keep the current ones; choosing files replaces them.
            </p>
          ) : null}
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-border-soft pt-4">
          <Button type="button" variant="ghost" onClick={backToList} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{editingId ? "Save changes" : "Create activity"}</Button>
        </div>
      </form>
    );
  }

  // ── Enquiries view ──────────────────────────────────────────────────────────
  if (mode === "enquiries") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Leads</p>
            <h1 className="mt-1 text-3xl font-black text-ink">Enquiries</h1>
          </div>
          <Button type="button" variant="ghost" onClick={() => setMode("list")}>Back</Button>
        </div>
        {enquiries.length === 0 ? (
          <section className="rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
            <EmptyState title="No enquiries yet" subtitle="Customer enquiries for your activities will appear here." />
          </section>
        ) : (
          <section className="space-y-4">
            {enquiries.map((e) => {
              const listingTitle = typeof e.listing === "string" ? "" : e.listing.title;
              return (
                <article key={e.id} className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink">{e.contact.name} · {e.contact.phone}</p>
                      {e.contact.email ? <p className="text-sm text-ink-muted">{e.contact.email}</p> : null}
                      {listingTitle ? <p className="mt-1 text-sm text-ink-soft">For: {listingTitle}</p> : null}
                      <p className="mt-1 text-sm text-ink-muted">
                        {e.pax.adults} adults · {e.pax.children} children · {e.pax.infants} infants
                        {e.travelDate ? ` · ${new Date(e.travelDate).toLocaleDateString()}` : ""}
                      </p>
                      {e.message ? <p className="mt-2 text-sm text-ink">{e.message}</p> : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone="info" size="sm">{e.status}</Badge>
                      <Select id={`enq-${e.id}`} label="" value={e.status} onChange={(ev) => updateEnquiry(e.id, ev.target.value)}>
                        {ENQUIRY_STATUSES.map((s) => (<option key={s} value={s}>{titleCase(s)}</option>))}
                      </Select>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Partner SightSeeing</p>
            <h1 className="mt-2 text-3xl font-black text-ink">Activities</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              List tours, activities and attractions with pricing, availability and meeting points.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatCard label="Activities" value={String(items.length)} />
            <StatCard label="Active" value={String(items.filter((t) => t.status === "active").length)} />
            <Button type="button" variant="secondary" onClick={() => setMode("enquiries")}>
              Enquiries ({enquiries.length})
            </Button>
            <Button type="button" variant="accent" onClick={openCreate}>Create activity</Button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-xl border border-border-soft bg-white p-10 text-center shadow-(--shadow-xs)">
          <p className="text-sm text-ink-muted">Loading your activities…</p>
        </section>
      ) : items.length === 0 ? (
        <section className="rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
          <EmptyState
            title="No activities yet"
            subtitle="Create your first tour or activity with pricing and availability."
            cta={<Button type="button" variant="accent" onClick={openCreate}>Create activity</Button>}
          />
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const headline = item.pricing.adult ?? item.pricing.groupPrice ?? 0;
            return (
              <article key={item.id} className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
                {item.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.images[0].url} alt={item.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-surface-muted text-sm text-ink-muted">No image</div>
                )}
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <Badge tone="accent" size="sm">{CATEGORY_LABELS[item.category] ?? titleCase(item.category)}</Badge>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-ink">{item.title}</h2>
                    <p className="mt-1 text-sm text-ink-muted">{item.location?.island ?? "—"}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    From {item.currency} {headline.toLocaleString("en-IN")}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="button" variant="secondary" onClick={() => openEdit(item)}>Edit</Button>
                    {SUBMITTABLE_STATUSES.includes(item.status) && (
                      <Button type="button" variant="primary" loading={submittingId === item.id} onClick={() => submitForReview(item.id)}>
                        Submit for review
                      </Button>
                    )}
                    <Button type="button" variant="danger" onClick={() => removeItem(item)}>Delete</Button>
                  </div>
                </div>
              </article>
            );
          })}
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
