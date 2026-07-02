"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { adminClient, type AdminPackage, type AdminEnquiry, type PackageComparison } from "@/lib/adminClient";
import PackageTemplateModal from "@/components/superadmin/PackageTemplateModal";

type Tab = "templates" | "enquiries";

const STATUS_TONE: Record<string, "neutral" | "success" | "warn" | "danger"> = {
  active: "success", draft: "neutral", pending: "warn", paused: "warn", suspended: "danger",
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending review" },
  { value: "active", label: "Live" },
  { value: "", label: "All" },
];

const FIELD_LABELS: Record<string, string> = {
  title: "Title", description: "Description", highlights: "Highlights",
  inclusions: "Inclusions", exclusions: "Exclusions", destinations: "Destinations",
  duration: "Duration", itinerary: "Itinerary", referencePrice: "Reference price",
};

// §5.3 — side-by-side review of a partner submission vs the closest platform
// template. Surfaces a duplicate warning so the reviewer rejects unmodified copies.
function CompareModal({
  pkg, onClose, onApprove, onReject,
}: {
  pkg: AdminPackage | null;
  onClose: () => void;
  onApprove: (p: AdminPackage) => void;
  onReject: (p: AdminPackage) => void;
}) {
  const toast = useToast();
  const [data, setData] = useState<PackageComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!pkg) { setData(null); return; }
    setLoading(true);
    adminClient.packages
      .compare(pkg.id)
      .then(setData)
      .catch((e) => toast.push({ title: "Could not load comparison", description: e instanceof Error ? e.message : undefined, tone: "danger" }))
      .finally(() => setLoading(false));
  }, [pkg, toast]);

  const act = async (fn: (p: AdminPackage) => void) => {
    if (!pkg) return;
    setActing(true);
    try { fn(pkg); onClose(); } finally { setActing(false); }
  };

  return (
    <Modal open={!!pkg} onClose={onClose} title="Review partner submission" size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => act(onReject)} loading={acting} disabled={!pkg}>Reject (back to draft)</Button>
          <Button variant="accent" onClick={() => act(onApprove)} loading={acting} disabled={!pkg}>Approve &amp; publish</Button>
        </div>
      }>
      {loading && <div className="h-40 animate-pulse rounded-xl bg-border-soft/60" />}
      {!loading && data && (
        <div className="flex flex-col gap-3 p-1">
          {data.template ? (
            <div className={`rounded-lg border p-3 text-[13px] ${data.likelyDuplicate ? "border-red-300 bg-red-50 text-red-700" : "border-border-soft bg-surface-soft text-ink-soft"}`}>
              {data.likelyDuplicate
                ? `⚠ Likely duplicate — ${Math.round(data.similarity * 100)}% identical to template “${data.template.title}”. Reject unless the partner genuinely modified it.`
                : `${Math.round(data.similarity * 100)}% similar to the closest template “${data.template.title}”.`}
            </div>
          ) : (
            <div className="rounded-lg border border-border-soft bg-surface-soft p-3 text-[13px] text-ink-soft">
              No comparable platform template for this kind — this is an original partner package.
            </div>
          )}
          <div className="grid grid-cols-[120px_1fr_1fr] gap-x-3 gap-y-1 text-[12px]">
            <div className="font-bold text-ink">Field</div>
            <div className="font-bold text-ink">Partner submission</div>
            <div className="font-bold text-ink">Closest template</div>
            {data.fields.map((f) => (
              <div key={f.field} className="contents">
                <div className="py-1.5 font-semibold text-ink-soft">{FIELD_LABELS[f.field] ?? f.field}</div>
                <div className={`py-1.5 wrap-break-word ${f.identical ? "text-red-600" : "text-ink"}`}>{f.partnerValue || <span className="text-ink-muted">—</span>}</div>
                <div className="py-1.5 wrap-break-word text-ink-muted">{f.templateValue || "—"}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-muted">Fields shown in red are identical to the template.</p>
        </div>
      )}
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
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [reviewPkg, setReviewPkg] = useState<AdminPackage | null>(null);

  useEffect(() => {
    adminClient.me().then(() => setSession("in")).catch(() => setSession("out"));
  }, []);

  const refresh = useCallback(async () => {
    if (session !== "in") return;
    setLoading(true);
    try {
      if (tab === "templates") setPackages(await adminClient.packages.list({ status: statusFilter || undefined }));
      else setEnquiries(await adminClient.packages.enquiries());
    } catch (e) {
      toast.push({ title: "Failed to load", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    } finally { setLoading(false); }
  }, [tab, session, statusFilter, toast]);

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
    try {
      await adminClient.packages.setStatus(p.id, status);
      setPackages((prev) =>
        statusFilter && status !== statusFilter
          ? prev.filter((x) => x.id !== p.id) // fell out of the current filter view
          : prev.map((x) => (x.id === p.id ? { ...x, status: status as AdminPackage["status"] } : x)),
      );
    } catch (e) { toast.push({ title: "Update failed", description: e instanceof Error ? e.message : undefined, tone: "danger" }); }
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

      {tab === "templates" && (
        <div className="mt-4 flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <Chip key={f.value || "all"} active={statusFilter === f.value} onClick={() => setStatusFilter(f.value)}>{f.label}</Chip>
          ))}
        </div>
      )}

      {loading && <div className="mt-5 h-40 animate-pulse rounded-xl bg-border-soft/60" />}

      {!loading && tab === "templates" && (
        <div className="mt-5 grid gap-3">
          {packages.length === 0 ? <p className="text-[14px] text-ink-muted">No packages in this view.</p> : packages.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-white p-4">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-ink">{p.title}</p>
                <p className="text-[12px] text-ink-muted">
                  {p.kind} · {p.scope} · {p.origin}
                  {p.kind === "bundle" && p.components ? ` · ${p.components.length} component(s)` : ""}
                  {p.route.destinations.length ? ` · ${p.route.destinations.join(", ")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {p.kind === "bundle" && <Badge tone="neutral" size="sm">Bundle</Badge>}
                {p.origin === "partner" && <Badge tone="info" size="sm">Partner</Badge>}
                <Badge tone={STATUS_TONE[p.status] ?? "neutral"} size="sm">{p.status}</Badge>
                {/* Partner submissions get the §5.3 review (diff vs template) as the primary action. */}
                {p.origin === "partner" && p.status === "pending" && (
                  <Button variant="accent" size="sm" onClick={() => setReviewPkg(p)}>Review</Button>
                )}
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

      <PackageTemplateModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={refresh} />
      <CompareModal
        pkg={reviewPkg}
        onClose={() => setReviewPkg(null)}
        onApprove={(p) => setStatus(p, "active")}
        onReject={(p) => setStatus(p, "draft")}
      />
    </div>
  );
}
