"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useSubmitForReview, SUBMITTABLE_STATUSES } from "./useSubmitForReview";
import {
  servicePartnerApi,
  type ServiceModuleConfig,
  type ServiceListingApi,
  type ServiceEnquiryApi,
  type FieldDef,
} from "@/lib/serviceModules";

type Mode = "list" | "form" | "enquiries";
type FormState = Record<string, string | string[]>;

const ENQUIRY_STATUSES = ["new", "contacted", "quoted", "converted", "closed", "spam"] as const;

function titleCase(value: string): string {
  return value.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}
function fromCsv(value: string): string[] {
  return Array.from(new Set(value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)));
}
function toCsv(v: unknown): string {
  return Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : "";
}

export default function ServiceListingManager({ config }: { config: ServiceModuleConfig }) {
  const toast = useToast();
  const apiClient = useMemo(() => servicePartnerApi(config), [config]);
  const [items, setItems] = useState<ServiceListingApi[]>([]);
  const [enquiries, setEnquiries] = useState<ServiceEnquiryApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [list, leads] = await Promise.all([apiClient.list(), apiClient.enquiries()]);
      setItems(list);
      setEnquiries(leads);
    } catch (error) {
      toast.push({
        title: `Could not load ${config.plural.toLowerCase()}`,
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, config.plural, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const { submittingId, submit: submitForReview } = useSubmitForReview(config.vertical, refresh);

  function emptyForm(): FormState {
    const base: FormState = { title: "", status: "draft", description: "", tags: "", currency: "INR" };
    for (const f of config.fields) base[f.key] = f.kind === "csv" ? "" : "";
    return base;
  }

  function formFromApi(item: ServiceListingApi): FormState {
    const state: FormState = {
      title: item.title,
      status: item.status === "active" ? "active" : "draft",
      description: item.description ?? "",
      tags: toCsv(item.tags),
      currency: item.currency ?? "INR",
    };
    for (const f of config.fields) {
      const raw = item[f.key];
      state[f.key] = f.kind === "csv" ? toCsv(raw) : raw === undefined || raw === null ? "" : String(raw);
    }
    return state;
  }

  function setField(key: string, value: string) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFiles([]);
    setMode("form");
  }
  function openEdit(item: ServiceListingApi) {
    setEditingId(item.id);
    setForm(formFromApi(item));
    setFiles([]);
    setMode("form");
  }

  function buildData(): Record<string, unknown> {
    const data: Record<string, unknown> = {
      title: String(form.title ?? "").trim(),
      status: form.status,
      description: String(form.description ?? "").trim() || undefined,
      tags: fromCsv(String(form.tags ?? "")),
      currency: form.currency,
    };
    for (const f of config.fields) {
      const raw = form[f.key];
      if (f.kind === "csv") data[f.key] = fromCsv(String(raw ?? ""));
      else if (f.kind === "number") {
        const n = Number(raw);
        data[f.key] = String(raw ?? "").trim() === "" || !Number.isFinite(n) ? undefined : n;
      } else {
        data[f.key] = String(raw ?? "").trim() || undefined;
      }
    }
    return data;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!String(form.title ?? "").trim()) {
      toast.push({ title: "Title is required", tone: "warn" });
      return;
    }
    for (const f of config.fields) {
      if (f.kind === "select" && f.required && !String(form[f.key] ?? "").trim()) {
        toast.push({ title: `${f.label} is required`, tone: "warn" });
        return;
      }
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify(buildData()));
      files.forEach((file) => fd.append("images", file));
      if (editingId) await apiClient.update(editingId, fd);
      else await apiClient.create(fd);
      toast.push({ title: editingId ? "Listing updated" : "Listing created", tone: "success" });
      await refresh();
      setMode("list");
      setEditingId(null);
    } catch (err) {
      toast.push({
        title: "Could not save listing",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: ServiceListingApi) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await apiClient.remove(item.id);
      setItems((c) => c.filter((t) => t.id !== item.id));
      toast.push({ title: "Listing deleted", tone: "success" });
    } catch (error) {
      toast.push({
        title: "Could not delete",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    }
  }

  async function updateEnquiry(id: string, status: string) {
    try {
      const updated = await apiClient.updateEnquiry(id, { status });
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

  function renderField(f: FieldDef): ReactNode {
    const value = String(form[f.key] ?? "");
    if (f.kind === "select") {
      return (
        <Select key={f.key} id={`f-${f.key}`} label={f.label} value={value} onChange={(e) => setField(f.key, e.target.value)}>
          {f.options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </Select>
      );
    }
    if (f.kind === "textarea") {
      return (
        <label key={f.key} className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[13px] font-medium text-ink-soft">{f.label}</span>
          <textarea
            rows={3}
            value={value}
            onChange={(e) => setField(f.key, e.target.value)}
            className="rounded-md border border-border bg-white px-3.5 py-3 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
      );
    }
    return (
      <Input
        key={f.key}
        id={`f-${f.key}`}
        label={f.label}
        type={f.kind === "number" ? "number" : "text"}
        value={value}
        placeholder={"placeholder" in f ? f.placeholder : undefined}
        onChange={(e) => setField(f.key, e.target.value)}
      />
    );
  }

  // ── Form view ────────────────────────────────────────────────────────────────
  if (mode === "form") {
    return (
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              {editingId ? `Edit ${config.singular}` : `New ${config.singular}`}
            </p>
            <h1 className="mt-1 text-3xl font-black text-ink">
              {editingId ? String(form.title || "Edit") : `Create a ${config.singular.toLowerCase()}`}
            </h1>
          </div>
          <Button type="button" variant="ghost" onClick={() => !saving && setMode("list")} disabled={saving}>Back</Button>
        </div>

        <Section title="Basics">
          <Input id="f-title" label="Title" value={String(form.title ?? "")} onChange={(e) => setField("title", e.target.value)} />
          <Select id="f-status" label="Status" value={String(form.status ?? "draft")} onChange={(e) => setField("status", e.target.value)}>
            <option value="draft">Draft</option>
            <option value="active">Active (still needs admin approval to go live)</option>
          </Select>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[13px] font-medium text-ink-soft">Description</span>
            <textarea
              rows={3}
              value={String(form.description ?? "")}
              onChange={(e) => setField("description", e.target.value)}
              className="rounded-md border border-border bg-white px-3.5 py-3 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          <Input id="f-tags" label="Tags (comma separated)" value={String(form.tags ?? "")} onChange={(e) => setField("tags", e.target.value)} />
        </Section>

        <Section title="Details">
          {config.fields.map(renderField)}
        </Section>

        <Section title="Media">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[13px] font-medium text-ink-soft">Gallery images</span>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])} />
          </label>
          {editingId ? (
            <p className="text-[13px] text-ink-muted sm:col-span-2">
              Leave images empty to keep the current ones; choosing files replaces them.
            </p>
          ) : null}
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-border-soft pt-4">
          <Button type="button" variant="ghost" onClick={() => !saving && setMode("list")} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{editingId ? "Save changes" : "Create"}</Button>
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
            <EmptyState title="No enquiries yet" subtitle="Customer enquiries will appear here." />
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
                        {e.pax.adults} adults · {e.pax.children} children
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Partner {config.label}</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{config.plural}</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">{config.blurb}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatCard label={config.plural} value={String(items.length)} />
            <StatCard label="Active" value={String(items.filter((t) => t.status === "active").length)} />
            <Button type="button" variant="secondary" onClick={() => setMode("enquiries")}>Enquiries ({enquiries.length})</Button>
            <Button type="button" variant="accent" onClick={openCreate}>Create</Button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-xl border border-border-soft bg-white p-10 text-center shadow-(--shadow-xs)">
          <p className="text-sm text-ink-muted">Loading…</p>
        </section>
      ) : items.length === 0 ? (
        <section className="rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
          <EmptyState
            title={`No ${config.plural.toLowerCase()} yet`}
            subtitle="Create your first listing to get started."
            cta={<Button type="button" variant="accent" onClick={openCreate}>Create</Button>}
          />
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-(--shadow-xs)">
              {item.images[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.images[0].url} alt={item.title} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-surface-muted text-sm text-ink-muted">No image</div>
              )}
              <div className="space-y-3 p-5">
                <StatusBadge status={item.status} />
                <h2 className="text-lg font-bold text-ink">{item.title}</h2>
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
