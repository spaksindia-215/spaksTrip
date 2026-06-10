"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { agentClient, type AgentBranding } from "@/lib/agentClient";

const DEFAULT_COLOR = "#185FA5";

export default function AgentBrandingPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [slug, setSlug]                     = useState<string | null>(null);
  const [companyName, setCompanyName]       = useState("");
  const [tagline, setTagline]               = useState("");
  const [primaryColor, setPrimaryColor]     = useState(DEFAULT_COLOR);
  const [colorHex, setColorHex]             = useState(DEFAULT_COLOR);
  const [contactEmail, setContactEmail]     = useState("");
  const [contactPhone, setContactPhone]     = useState("");
  const [logoPreview, setLogoPreview]       = useState<string | null>(null);
  const [logoFile, setLogoFile]             = useState<File | null>(null);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await agentClient.getBranding();
        if (!active) return;
        setSlug(data.slug);
        const b: AgentBranding = data.branding ?? { primaryColor: DEFAULT_COLOR };
        setCompanyName(b.companyName ?? "");
        setTagline(b.tagline ?? "");
        const c = b.primaryColor ?? DEFAULT_COLOR;
        setPrimaryColor(c);
        setColorHex(c);
        setContactEmail(b.contactEmail ?? "");
        setContactPhone(b.contactPhone ?? "");
        setLogoPreview(b.logo ?? null);
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Unable to load branding settings.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const handleColorPickerChange = (v: string) => {
    setPrimaryColor(v);
    setColorHex(v);
  };

  const handleColorHexChange = (v: string) => {
    setColorHex(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) setPrimaryColor(v);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  const save = async () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
      toast.push({ title: "Invalid hex color — use format #RRGGBB", tone: "danger" });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("companyName", companyName);
      fd.append("tagline", tagline);
      fd.append("primaryColor", colorHex);
      fd.append("contactEmail", contactEmail);
      fd.append("contactPhone", contactPhone);
      if (logoFile) fd.append("logo", logoFile);

      const updated = await agentClient.updateBranding(fd);
      if (updated?.logo) setLogoPreview(updated.logo);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.push({ title: "Branding saved", tone: "success" });
    } catch (err) {
      toast.push({
        title: "Save failed",
        description: err instanceof ApiError ? err.message : "Please try again",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-muted">Loading branding settings…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-600">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-[20px] font-bold text-ink">Branding Settings</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Customise how your travel portal looks to customers on your subdomain.
        </p>
      </div>

      {/* Subdomain display */}
      {slug && (
        <div className="rounded-xl border border-border-soft bg-white p-5">
          <p className="text-[12px] font-medium text-ink-soft mb-1">Your subdomain (read-only)</p>
          <p className="text-[14px] font-mono font-semibold text-brand-700">
            {slug}.spakstrip.com
          </p>
          <p className="mt-1 text-[12px] text-ink-muted">
            Share this URL with your customers to let them book through your branded portal.
          </p>
        </div>
      )}

      {/* Identity */}
      <div className="rounded-xl border border-border-soft bg-white p-5 flex flex-col gap-4">
        <h2 className="text-[15px] font-bold text-ink">Identity</h2>

        <Input
          id="companyName"
          label="Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Raj Travels"
          maxLength={100}
        />

        <Input
          id="tagline"
          label="Tagline (optional)"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Your journey, our passion"
          maxLength={120}
        />

        <Input
          id="contactEmail"
          label="Contact email (optional)"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="support@rajtravels.com"
        />

        <Input
          id="contactPhone"
          label="Contact phone (optional)"
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="+91 98765 43210"
        />
      </div>

      {/* Brand colour */}
      <div className="rounded-xl border border-border-soft bg-white p-5 flex flex-col gap-4">
        <h2 className="text-[15px] font-bold text-ink">Brand colour</h2>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => handleColorPickerChange(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border-soft p-1"
            aria-label="Pick brand colour"
          />
          <Input
            id="colorHex"
            label=""
            value={colorHex}
            onChange={(e) => handleColorHexChange(e.target.value)}
            placeholder="#185FA5"
            maxLength={7}
            className="flex-1"
          />
        </div>
        <div
          className="rounded-lg px-4 py-3 text-white text-[13px] font-semibold"
          style={{ background: /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : DEFAULT_COLOR }}
        >
          Preview button colour
        </div>
      </div>

      {/* Logo */}
      <div className="rounded-xl border border-border-soft bg-white p-5 flex flex-col gap-4">
        <h2 className="text-[15px] font-bold text-ink">Logo</h2>

        {logoPreview && (
          <div className="flex items-center gap-3">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="h-14 w-auto max-w-[160px] rounded-lg border border-border-soft object-contain p-1"
            />
            {logoFile && (
              <span className="text-[12px] text-ink-muted">New logo selected — save to apply</span>
            )}
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-ink-soft">
            {logoPreview ? "Replace logo" : "Upload logo"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleLogoChange}
            className="block text-[13px] text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-ink hover:file:bg-border-soft"
          />
        </label>
        <p className="text-[11px] text-ink-muted">JPEG, PNG, WebP or SVG. Max 8 MB.</p>
      </div>

      <Button
        type="button"
        variant="primary"
        loading={saving}
        onClick={save}
      >
        Save branding
      </Button>
    </div>
  );
}
