"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Chip from "@/components/ui/Chip";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { adminClient, type AdminPackage, type AdminEnquiry } from "@/lib/adminClient";

type Tab = "templates" | "enquiries";

const STATUS_TONE: Record<string, "neutral" | "success" | "warn" | "danger"> = {
  active: "success", draft: "neutral", paused: "warn", suspended: "danger",
};

const KINDS = [
  { value: "holiday", label: "Holiday" },
  { value: "tour_package", label: "Tour Package" },
  { value: "tour", label: "Tour" },
  { value: "taxi_package", label: "Taxi Package" },
  { value: "taxi", label: "Taxi" },
];

function TemplateModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("holiday");
  const [scope, setScope] = useState("domestic");
  const [destinations, setDestinations] = useState("");
  const [days, setDays] = useState("4");
  const [nights, setNights] = useState("3");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { toast.push({ title: "Enter a title", tone: "warn" }); return; }
    setSaving(true);
    try {
      const data = {
        title: title.trim(), kind, scope,
        description: description.trim() || undefined,
        highlights: highlights.split("\n").map((x) => x.trim()).filter(Boolean),
        route: { destinations: destinations.split(",").map((x) => x.trim()).filter(Boolean), durationDays: Number(days) || 1, durationNights: Number(nights) || 0 },
      };
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      if (images) Array.from(images).forEach((f) => form.append("images", f));
      await adminClient.packages.createTemplate(form);
      toast.push({ title: "Template created", tone: "success" });
      onSaved(); onClose();
      setTitle(""); setDestinations(""); setDescription(""); setHighlights(""); setImages(null);
    } catch (e) {
      toast.push({ title: "Could not create template", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New fixed template" size="lg"
      footer={<div className="flex justify-end gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" onClick={save} loading={saving}>Create</Button></div>}>
      <div className="flex flex-col gap-3 p-1">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Delhi to Ladakh 3N/4D" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</Select>
          <Select label="Scope" value={scope} onChange={(e) => setScope(e.target.value)}><option value="domestic">Domestic</option><option value="international">International</option></Select>
        </div>
        <Input label="Destinations (comma-separated)" value={destinations} onChange={(e) => setDestinations(e.target.value)} placeholder="Leh, Nubra, Pangong" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
          <Input label="Nights" type="number" value={nights} onChange={(e) => setNights(e.target.value)} />
        </div>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <Textarea label="Highlights (one per line)" value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} />
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-ink-soft">Images</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)} className="text-[13px]" />
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPackagesPage() {
  const toast = useToast();
  const [session, setSession] = useState<"checking" | "out" | "in">("checking");
  const [tab, setTab] = useState<Tab>("templates");
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    adminClient.me().then(() => setSession("in")).catch(() => setSession("out"));
  }, []);

  const refresh = useCallback(async () => {
    if (session !== "in") return;
    setLoading(true);
    try {
      if (tab === "templates") setPackages(await adminClient.packages.list());
      else setEnquiries(await adminClient.packages.enquiries());
    } catch (e) {
      toast.push({ title: "Failed to load", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    } finally { setLoading(false); }
  }, [tab, session, toast]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (session === "checking") return <div className="p-8 text-[14px] text-ink-muted">Checking session…</div>;
  if (session === "out") {
    return (
      <div className="p-8">
        <p className="text-[14px] text-ink-muted">You must sign in to the admin console first.</p>
        <Link href="/superadmin" className="text-[14px] font-semibold text-brand-600">Go to admin login →</Link>
      </div>
    );
  }

  const setStatus = async (p: AdminPackage, status: string) => {
    try { await adminClient.packages.setStatus(p.id, status); setPackages((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: status as AdminPackage["status"] } : x))); }
    catch (e) { toast.push({ title: "Update failed", description: e instanceof Error ? e.message : undefined, tone: "danger" }); }
  };

  const setEnquiryStatus = async (id: string, status: string) => {
    try { await adminClient.packages.updateEnquiry(id, { status }); setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status: status as AdminEnquiry["status"] } : e))); }
    catch (e) { toast.push({ title: "Update failed", description: e instanceof Error ? e.message : undefined, tone: "danger" }); }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink">Packages &amp; Enquiries</h1>
          <p className="text-[13px] text-ink-muted">Create fixed templates, moderate partner packages, and triage leads.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/superadmin" className="rounded-lg border border-border px-3 py-2 text-[13px] font-semibold text-ink-soft">← Admin</Link>
          {tab === "templates" && <Button variant="accent" onClick={() => setFormOpen(true)}>New Template</Button>}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {([["templates", "Packages"], ["enquiries", "Enquiries"]] as [Tab, string][]).map(([k, label]) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{label}</Chip>
        ))}
      </div>

      {loading && <div className="mt-5 h-40 animate-pulse rounded-xl bg-border-soft/60" />}

      {!loading && tab === "templates" && (
        <div className="mt-5 grid gap-3">
          {packages.length === 0 ? <p className="text-[14px] text-ink-muted">No packages yet.</p> : packages.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-white p-4">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-ink">{p.title}</p>
                <p className="text-[12px] text-ink-muted">{p.kind} · {p.scope} · {p.origin}{p.route.destinations.length ? ` · ${p.route.destinations.join(", ")}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[p.status] ?? "neutral"} size="sm">{p.status}</Badge>
                {p.status !== "active" && <Button variant="ghost" size="sm" onClick={() => setStatus(p, "active")}>Activate</Button>}
                {p.status === "active" && <Button variant="ghost" size="sm" onClick={() => setStatus(p, "suspended")}>Suspend</Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "enquiries" && (
        <div className="mt-5 grid gap-3">
          {enquiries.length === 0 ? <p className="text-[14px] text-ink-muted">No enquiries yet.</p> : enquiries.map((e) => (
            <div key={e.id} className="flex flex-col gap-2 rounded-xl border border-border-soft bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-bold text-ink">{typeof e.package === "object" ? e.package.title : "Package"}</p>
                <Badge tone={e.status === "new" ? "warn" : e.status === "converted" ? "success" : "neutral"} size="sm">{e.status}</Badge>
              </div>
              <p className="text-[13px] text-ink-soft">
                {e.contact.name} · {e.contact.phone}{e.contact.email ? ` · ${e.contact.email}` : ""}
                {" · operator: "}{typeof e.partner === "object" ? (e.partner.companyName || e.partner.name || "—") : "—"}
              </p>
              {e.message && <p className="text-[13px] text-ink-muted">“{e.message}”</p>}
              <div className="flex flex-wrap gap-2">
                {(["contacted", "converted", "closed", "spam"] as const).map((s) => (
                  <Button key={s} variant="ghost" size="sm" onClick={() => setEnquiryStatus(e.id, s)}>Mark {s}</Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={refresh} />
    </div>
  );
}
