"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { adminClient } from "@/lib/adminClient";

// §5.1 — Superadmin creates fixed platform templates (marketplace Package docs,
// origin "platform"). Shared by the Packages surface and the per-type "Add"
// buttons in the Partner Listings tab. `initialKind`/`lockKind` let a caller
// prefill (and optionally freeze) the kind for a specific listing type.

export const TEMPLATE_KINDS = [
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
] as const;

const kindLabel = (v: string): string => TEMPLATE_KINDS.find((k) => k.value === v)?.label ?? "Template";

export default function PackageTemplateModal({
  open,
  onClose,
  onSaved,
  initialKind = "holiday",
  lockKind = false,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialKind?: string;
  lockKind?: boolean;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState(initialKind);
  const [scope, setScope] = useState("domestic");
  const [destinations, setDestinations] = useState("");
  const [days, setDays] = useState("4");
  const [nights, setNights] = useState("3");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-sync the kind whenever the caller opens the modal for a specific type.
  useEffect(() => {
    if (open) setKind(initialKind);
  }, [open, initialKind]);

  const save = async () => {
    if (!title.trim()) { toast.push({ title: "Enter a title", tone: "warn" }); return; }
    setSaving(true);
    try {
      const data = {
        title: title.trim(), kind, scope,
        description: description.trim() || undefined,
        highlights: highlights.split("\n").map((x) => x.trim()).filter(Boolean),
        inclusions: inclusions.split("\n").map((x) => x.trim()).filter(Boolean),
        exclusions: exclusions.split("\n").map((x) => x.trim()).filter(Boolean),
        referencePrice: price.trim() ? Number(price) : undefined,
        route: { destinations: destinations.split(",").map((x) => x.trim()).filter(Boolean), durationDays: Number(days) || 1, durationNights: Number(nights) || 0 },
      };
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      if (images) Array.from(images).forEach((f) => form.append("images", f));
      await adminClient.packages.createTemplate(form);
      toast.push({ title: `${kindLabel(kind)} template created`, description: "It's live now and manageable under Packages.", tone: "success" });
      onSaved(); onClose();
      setTitle(""); setDestinations(""); setDescription(""); setHighlights(""); setInclusions(""); setExclusions(""); setPrice(""); setImages(null);
    } catch (e) {
      toast.push({ title: "Could not create template", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={lockKind ? `New ${kindLabel(kind)} template` : "New fixed template"} size="lg"
      footer={<div className="flex justify-end gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" onClick={save} loading={saving}>Create</Button></div>}>
      <div className="flex flex-col gap-3 p-1">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Delhi to Ladakh 3N/4D" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value)} disabled={lockKind}>
            {TEMPLATE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </Select>
          <Select label="Scope" value={scope} onChange={(e) => setScope(e.target.value)}><option value="domestic">Domestic</option><option value="international">International</option></Select>
        </div>
        <Input label="Destinations (comma-separated)" value={destinations} onChange={(e) => setDestinations(e.target.value)} placeholder="Leh, Nubra, Pangong" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
          <Input label="Nights" type="number" value={nights} onChange={(e) => setNights(e.target.value)} />
          <Input label="Reference price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 25000" />
        </div>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <Textarea label="Highlights (one per line)" value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={2} />
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
