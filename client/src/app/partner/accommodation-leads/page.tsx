"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  listAccommodationLeads,
  updateAccommodationLead,
  type AccommodationLead,
  type AccommodationLeadStatus,
} from "@/services/partnerHotels";

const STATUS_TONE: Record<string, "neutral" | "success" | "warn" | "danger"> = {
  new: "warn", contacted: "neutral", quoted: "neutral", converted: "success", closed: "neutral", spam: "danger",
};

export default function AccommodationLeadsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState<AccommodationLead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setLeads(await listAccommodationLeads());
    } catch (e) {
      toast.push({ title: "Could not load leads", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void refresh(); }, [refresh]);

  const setStatus = async (id: string, status: AccommodationLeadStatus) => {
    try {
      await updateAccommodationLead(id, status);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (e) {
      toast.push({ title: "Update failed", description: e instanceof Error ? e.message : undefined, tone: "danger" });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Accommodation</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Stay Leads</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Customer enquiries for your accommodation listings. You&apos;re also emailed each lead as it arrives.
        </p>
      </section>

      {loading ? (
        <section className="rounded-xl border border-border-soft bg-white p-10 text-center shadow-(--shadow-xs)">
          <p className="text-sm text-ink-muted">Loading leads…</p>
        </section>
      ) : leads.length === 0 ? (
        <section className="rounded-xl border border-border-soft bg-white p-10 text-center shadow-(--shadow-xs)">
          <p className="text-sm text-ink-muted">No enquiries yet.</p>
        </section>
      ) : (
        <section className="grid gap-3">
          {leads.map((l) => (
            <article key={l.id} className="flex flex-col gap-2 rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold text-ink">{typeof l.hotel === "object" ? l.hotel.name : "Listing"}</h2>
                <Badge tone={STATUS_TONE[l.status] ?? "neutral"} size="sm">{l.status}</Badge>
              </div>
              <p className="text-[13px] text-ink-soft">
                {l.contact.name} · {l.contact.phone}{l.contact.email ? ` · ${l.contact.email}` : ""}
                {" · "}{l.pax.adults}A{l.pax.children ? ` ${l.pax.children}C` : ""}
                {l.checkIn ? ` · ${new Date(l.checkIn).toLocaleDateString("en-IN")}` : ""}
                {l.checkOut ? ` → ${new Date(l.checkOut).toLocaleDateString("en-IN")}` : ""}
              </p>
              {l.message && <p className="text-[13px] text-ink-muted">“{l.message}”</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                {(["contacted", "quoted", "converted", "closed", "spam"] as const).map((s) => (
                  <Button key={s} type="button" variant="ghost" size="sm" onClick={() => setStatus(l.id, s)}>Mark {s}</Button>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
