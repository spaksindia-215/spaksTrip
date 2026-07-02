"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import Modal from "@/components/ui/Modal";
import Checkbox from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/format";
import {
  partnerPackagesClient as client,
  type PackageSummary,
  type PartnerOffer,
  type PartnerEnquiry,
  type OfferInput,
  type MyServiceGroup,
} from "@/lib/partnerPackagesClient";
import type { PackageKind, PackageScope, PackageComponent } from "@/lib/packagesClient";

type Tab = "mine" | "catalog" | "offers" | "enquiries";

const KINDS: { value: PackageKind; label: string }[] = [
  { value: "holiday", label: "Holiday" },
  { value: "tour_package", label: "Tour Package" },
  { value: "tour", label: "Tour" },
  { value: "taxi_package", label: "Taxi Package" },
  { value: "taxi", label: "Taxi" },
  { value: "cruise", label: "Cruise" },
  { value: "sightseeing", label: "Sightseeing" },
  { value: "transfer", label: "Transfer" },
  { value: "self_drive", label: "Self-Drive" },
  { value: "islandhopper", label: "Islandhopper" },
  { value: "visa", label: "Visa Consultancy" },
];

const STATUS_TONE: Record<string, "neutral" | "success" | "warn" | "danger"> = {
  active: "success",
  draft: "neutral",
  paused: "warn",
  suspended: "danger",
};

function packageTitle(p: PartnerOffer["package"]): string {
  return typeof p === "object" ? p.title : "Package";
}

// ── Offer modal (create/edit a price on a package) ──────────────────────────────
function OfferModal({
  open, onClose, packageId, packageLabel, existing, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  packageId: string;
  packageLabel: string;
  existing?: PartnerOffer | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [price, setPrice] = useState("");
  const [perPerson, setPerPerson] = useState(true);
  const [pricingNote, setPricingNote] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPrice(existing ? String(existing.price) : "");
    setPerPerson(existing ? existing.perPerson : true);
    setPricingNote(existing?.pricingNote ?? "");
    setShowContact(existing?.showDirectContact ?? false);
    setPhone(existing?.directContact?.phone ?? "");
    setWhatsapp(existing?.directContact?.whatsapp ?? "");
    setEmail(existing?.directContact?.email ?? "");
  }, [open, existing]);

  const save = async () => {
    const n = Number(price);
    if (!Number.isFinite(n) || n < 0) { toast.push({ title: "Enter a valid price", tone: "warn" }); return; }
    setSaving(true);
    try {
      const payload: OfferInput = {
        packageId,
        price: n,
        perPerson,
        pricingNote: pricingNote.trim() || undefined,
        showDirectContact: showContact,
        directContact: showContact ? { phone: phone.trim() || undefined, whatsapp: whatsapp.trim() || undefined, email: email.trim() || undefined } : undefined,
      };
      if (existing) await client.updateOffer(existing.id, payload);
      else await client.upsertOffer(payload);
      toast.push({ title: "Offer saved", tone: "success" });
      onSaved();
      onClose();
    } catch (e) {
      toast.push({ title: "Could not save offer", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Your offer · ${packageLabel}`} size="md"
      footer={<div className="flex justify-end gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" onClick={save} loading={saving}>Save Offer</Button></div>}>
      <div className="flex flex-col gap-3 p-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Your operating price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 24999" />
          <div className="flex items-end pb-1"><Checkbox label="Per person" checked={perPerson} onChange={(e) => setPerPerson(e.target.checked)} /></div>
        </div>
        <Input label="Pricing note (optional)" value={pricingNote} onChange={(e) => setPricingNote(e.target.value)} placeholder="e.g. up to 4 pax, includes tolls" />
        <Checkbox label="Share my direct contact with customers" checked={showContact} onChange={(e) => setShowContact(e.target.checked)} />
        {showContact && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Create-package modal ────────────────────────────────────────────────────────
function PackageFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<PackageKind>("holiday");
  const [scope, setScope] = useState<PackageScope>("domestic");
  const [destinations, setDestinations] = useState("");
  const [days, setDays] = useState("4");
  const [nights, setNights] = useState("3");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  const save = async () => {
    if (!title.trim()) { toast.push({ title: "Enter a title", tone: "warn" }); return; }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        kind,
        scope,
        description: description.trim() || undefined,
        highlights: lines(highlights),
        inclusions: lines(inclusions),
        exclusions: lines(exclusions),
        route: {
          destinations: destinations.split(",").map((x) => x.trim()).filter(Boolean),
          durationDays: Number(days) || 1,
          durationNights: Number(nights) || 0,
        },
      };
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      if (images) Array.from(images).forEach((f) => form.append("images", f));
      await client.create(form);
      toast.push({ title: "Package created", tone: "success" });
      onSaved();
      onClose();
      setTitle(""); setDestinations(""); setDescription(""); setHighlights(""); setInclusions(""); setExclusions(""); setImages(null);
    } catch (e) {
      toast.push({ title: "Could not create package", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New package" size="lg"
      footer={<div className="flex justify-end gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" onClick={save} loading={saving}>Create</Button></div>}>
      <div className="flex flex-col gap-3 p-1">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Delhi to Ladakh 3N/4D" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value as PackageKind)}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </Select>
          <Select label="Scope" value={scope} onChange={(e) => setScope(e.target.value as PackageScope)}>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </Select>
        </div>
        <Input label="Destinations (comma-separated)" value={destinations} onChange={(e) => setDestinations(e.target.value)} placeholder="Leh, Nubra, Pangong" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
          <Input label="Nights" type="number" value={nights} onChange={(e) => setNights(e.target.value)} />
        </div>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <Textarea label="Highlights (one per line)" value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Textarea label="Inclusions (one per line)" value={inclusions} onChange={(e) => setInclusions(e.target.value)} rows={3} />
          <Textarea label="Exclusions (one per line)" value={exclusions} onChange={(e) => setExclusions(e.target.value)} rows={3} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-ink-soft">Images</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)} className="text-[13px]" />
        </div>
      </div>
    </Modal>
  );
}

// ── Bundle builder modal (compose several of your services into one package) ─────
function BundleBuilderModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<PackageScope>("domestic");
  const [destinations, setDestinations] = useState("");
  const [days, setDays] = useState("4");
  const [nights, setNights] = useState("3");
  const [description, setDescription] = useState("");
  const [components, setComponents] = useState<PackageComponent[]>([]);
  const [images, setImages] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  const [groups, setGroups] = useState<MyServiceGroup[]>([]);
  const [loadingSvc, setLoadingSvc] = useState(false);
  const [pickGroup, setPickGroup] = useState("");
  const [pickItem, setPickItem] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(""); setScope("domestic"); setDestinations(""); setDays("4"); setNights("3");
    setDescription(""); setComponents([]); setImages(null); setPickGroup(""); setPickItem("");
    setLoadingSvc(true);
    client.myServices()
      .then((g) => { setGroups(g); if (g[0]) setPickGroup(g[0].refModel); })
      .catch((e) => toast.push({ title: "Couldn't load your services", description: e instanceof Error ? e.message : undefined, tone: "danger" }))
      .finally(() => setLoadingSvc(false));
  }, [open, toast]);

  const activeGroup = groups.find((g) => g.refModel === pickGroup);

  const addFromService = () => {
    const item = activeGroup?.items.find((i) => i.id === pickItem);
    if (!item) { toast.push({ title: "Pick a service to add", tone: "warn" }); return; }
    if (components.some((c) => c.ref === item.id)) { toast.push({ title: "Already added", tone: "warn" }); return; }
    setComponents((prev) => [...prev, {
      category: item.category, refModel: item.refModel, ref: item.id,
      title: item.title, quantity: 1, included: true,
    }]);
    setPickItem("");
  };

  const addCustom = () => {
    setComponents((prev) => [...prev, { category: "Other", title: "", quantity: 1, included: true }]);
  };

  const patchComponent = (idx: number, patch: Partial<PackageComponent>) => {
    setComponents((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };
  const removeComponent = (idx: number) => setComponents((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    if (!title.trim()) { toast.push({ title: "Enter a title", tone: "warn" }); return; }
    const cleaned = components.filter((c) => c.title.trim());
    if (cleaned.length === 0) { toast.push({ title: "Add at least one component", tone: "warn" }); return; }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        kind: "bundle" as PackageKind,
        scope,
        description: description.trim() || undefined,
        route: {
          destinations: destinations.split(",").map((x) => x.trim()).filter(Boolean),
          durationDays: Number(days) || 1,
          durationNights: Number(nights) || 0,
        },
        components: cleaned.map((c) => ({ ...c, title: c.title.trim(), category: c.category.trim() || "Other" })),
      };
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      if (images) Array.from(images).forEach((f) => form.append("images", f));
      await client.create(form);
      toast.push({ title: "Bundle created", tone: "success" });
      onSaved();
      onClose();
    } catch (e) {
      toast.push({ title: "Could not create bundle", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New bundle" size="lg"
      footer={<div className="flex justify-end gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" onClick={save} loading={saving}>Create Bundle</Button></div>}>
      <div className="flex flex-col gap-4 p-1">
        <p className="text-[13px] text-ink-muted">Combine several of your services — stays, transfers, sightseeing, and more — into one sellable package with a single price.</p>

        <Input label="Bundle title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Andaman Explorer 4N/5D" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Scope" value={scope} onChange={(e) => setScope(e.target.value as PackageScope)}>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </Select>
          <Input label="Destinations (comma-separated)" value={destinations} onChange={(e) => setDestinations(e.target.value)} placeholder="Port Blair, Havelock" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
          <Input label="Nights" type="number" value={nights} onChange={(e) => setNights(e.target.value)} />
        </div>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

        {/* Component picker */}
        <div className="rounded-xl border border-border-soft bg-surface-muted/40 p-3">
          <p className="mb-2 text-[13px] font-bold text-ink">Add from your services</p>
          {loadingSvc ? (
            <div className="h-9 animate-pulse rounded-lg bg-border-soft/60" />
          ) : groups.length === 0 ? (
            <p className="text-[12px] text-ink-muted">You have no active services yet. Create listings (taxi, stay, sightseeing…) first, or add custom items below.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Select value={pickGroup} onChange={(e) => { setPickGroup(e.target.value); setPickItem(""); }}>
                {groups.map((g) => <option key={g.refModel} value={g.refModel}>{g.category} ({g.items.length})</option>)}
              </Select>
              <Select value={pickItem} onChange={(e) => setPickItem(e.target.value)}>
                <option value="">Select a service…</option>
                {activeGroup?.items.map((i) => <option key={i.id} value={i.id}>{i.title}{i.status !== "active" ? ` · ${i.status}` : ""}</option>)}
              </Select>
              <Button variant="secondary" size="sm" onClick={addFromService}>Add</Button>
            </div>
          )}
          <button type="button" onClick={addCustom} className="mt-2 text-[12px] font-semibold text-brand-600 hover:text-brand-700">+ Add a custom item</button>
        </div>

        {/* Component list */}
        {components.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-bold text-ink">Bundle components ({components.length})</p>
            {components.map((c, idx) => {
              const isLinked = Boolean(c.ref);
              return (
                <div key={idx} className="flex flex-col gap-2 rounded-xl border border-border-soft bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      {isLinked ? (
                        <p className="truncate text-[13px] font-bold text-ink">{c.title}</p>
                      ) : (
                        <Input value={c.title} onChange={(e) => patchComponent(idx, { title: e.target.value })} placeholder="Item title (e.g. Welcome dinner)" />
                      )}
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral" size="sm">{c.category}</Badge>
                        {!isLinked && (
                          <Input value={c.category} onChange={(e) => patchComponent(idx, { category: e.target.value })} placeholder="Category" className="max-w-35" />
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeComponent(idx)} className="text-[12px] font-semibold text-danger-600 hover:text-danger-700">Remove</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                      Qty
                      <input type="number" min={1} value={c.quantity} onChange={(e) => patchComponent(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="w-16 rounded-md border border-border-soft px-2 py-1 text-[12px]" />
                    </label>
                    <Checkbox label="Included in price" checked={c.included} onChange={(e) => patchComponent(idx, { included: e.target.checked })} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-ink-soft">Images</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)} className="text-[13px]" />
        </div>
      </div>
    </Modal>
  );
}

export default function PartnerPackagesPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("mine");
  const [mine, setMine] = useState<PackageSummary[]>([]);
  const [catalog, setCatalog] = useState<PackageSummary[]>([]);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [enquiries, setEnquiries] = useState<PartnerEnquiry[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [offerTarget, setOfferTarget] = useState<{ id: string; label: string; existing?: PartnerOffer | null } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "mine") setMine(await client.listMine());
      else if (tab === "catalog") setCatalog(await client.browseCatalog());
      else if (tab === "offers") setOffers(await client.listOffers());
      else if (tab === "enquiries") setEnquiries(await client.listEnquiries());
    } catch (e) {
      toast.push({ title: "Failed to load", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [tab, toast]);

  useEffect(() => { void refresh(); }, [refresh]);

  const setEnquiryStatus = async (id: string, status: PartnerEnquiry["status"]) => {
    try {
      await client.updateEnquiry(id, { status });
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } catch (e) {
      toast.push({ title: "Update failed", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    }
  };

  const removeOffer = async (id: string) => {
    try { await client.removeOffer(id); setOffers((p) => p.filter((o) => o.id !== id)); }
    catch (e) { toast.push({ title: "Delete failed", description: e instanceof Error ? e.message : undefined, tone: "danger" }); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink">Marketplace Packages</h1>
          <p className="text-[13px] text-ink-muted">Create your own packages, price any package you can operate, and manage customer enquiries.</p>
        </div>
        {tab === "mine" && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setBundleOpen(true)}>New Bundle</Button>
            <Button variant="accent" onClick={() => setFormOpen(true)}>New Package</Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {([["mine", "My Packages"], ["catalog", "Browse & Offer"], ["offers", "My Offers"], ["enquiries", "Enquiries"]] as [Tab, string][]).map(([k, label]) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{label}</Chip>
        ))}
      </div>

      {loading && <div className="h-40 animate-pulse rounded-xl bg-border-soft/60" />}

      {/* My Packages */}
      {!loading && tab === "mine" && (
        mine.length === 0 ? <p className="text-[14px] text-ink-muted">No packages yet. Create one to get started.</p> : (
          <div className="grid gap-3">
            {mine.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-ink">{p.title}</p>
                  <p className="text-[12px] text-ink-muted">{p.kind} · {p.scope} · {p.route.destinations.join(", ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[p.status] ?? "neutral"} size="sm">{p.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => client.remove(p.id).then(refresh)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Browse & Offer */}
      {!loading && tab === "catalog" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-border-soft bg-white p-4">
              <p className="text-[14px] font-bold text-ink">{p.title}</p>
              <p className="text-[12px] text-ink-muted">{p.kind} · {p.scope}{p.origin === "platform" ? " · Curated" : ""}</p>
              <p className="text-[12px] text-ink-soft">{p.operatorCount ?? 0} operator(s){p.fromPrice != null ? ` · from ${formatINR(p.fromPrice)}` : ""}</p>
              <Button variant="accent" size="sm" className="mt-1" onClick={() => setOfferTarget({ id: p.id, label: p.title })}>Make an offer</Button>
            </div>
          ))}
        </div>
      )}

      {/* My Offers */}
      {!loading && tab === "offers" && (
        offers.length === 0 ? <p className="text-[14px] text-ink-muted">You haven&apos;t priced any packages yet. Use “Browse &amp; Offer”.</p> : (
          <div className="grid gap-3">
            {offers.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-ink">{packageTitle(o.package)}</p>
                  <p className="text-[12px] text-ink-muted">{formatINR(o.price)}{o.perPerson ? " /person" : ""}{o.pricingNote ? ` · ${o.pricingNote}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[o.status] ?? "neutral"} size="sm">{o.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setOfferTarget({ id: typeof o.package === "object" ? o.package.id : "", label: packageTitle(o.package), existing: o })}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => removeOffer(o.id)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Enquiries */}
      {!loading && tab === "enquiries" && (
        enquiries.length === 0 ? <p className="text-[14px] text-ink-muted">No enquiries yet.</p> : (
          <div className="grid gap-3">
            {enquiries.map((e) => (
              <div key={e.id} className="flex flex-col gap-2 rounded-xl border border-border-soft bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-bold text-ink">{typeof e.package === "object" ? e.package.title : "Package"}</p>
                  <Badge tone={e.status === "new" ? "warn" : e.status === "converted" ? "success" : "neutral"} size="sm">{e.status}</Badge>
                </div>
                <p className="text-[13px] text-ink-soft">
                  {e.contact.name} · {e.contact.phone}{e.contact.email ? ` · ${e.contact.email}` : ""}
                  {" · "}{e.pax.adults}A{e.pax.children ? ` ${e.pax.children}C` : ""}
                  {e.travelDate ? ` · ${new Date(e.travelDate).toLocaleDateString()}` : ""}
                </p>
                {e.message && <p className="text-[13px] text-ink-muted">“{e.message}”</p>}
                <div className="flex flex-wrap gap-2">
                  {(["contacted", "quoted", "converted", "closed"] as const).map((s) => (
                    <Button key={s} variant="ghost" size="sm" onClick={() => setEnquiryStatus(e.id, s)}>Mark {s}</Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <PackageFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={refresh} />
      <BundleBuilderModal open={bundleOpen} onClose={() => setBundleOpen(false)} onSaved={refresh} />
      {offerTarget && (
        <OfferModal
          open={!!offerTarget}
          onClose={() => setOfferTarget(null)}
          packageId={offerTarget.id}
          packageLabel={offerTarget.label}
          existing={offerTarget.existing}
          onSaved={() => { if (tab === "offers") refresh(); }}
        />
      )}
    </div>
  );
}
