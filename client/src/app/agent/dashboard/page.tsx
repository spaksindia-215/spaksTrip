"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import {
  agentClient,
  type AgentProfile,
  type Booking,
  type BookingStatus,
  type ProductType,
} from "@/lib/agentClient";

const PRODUCT_TYPES: ProductType[] = ["flight", "hotel", "taxi", "tour", "cruise", "package"];

const PRODUCT_LABELS: Record<ProductType, string> = {
  flight: "Flight",
  hotel: "Hotel",
  taxi: "Taxi",
  tour: "Tour",
  cruise: "Cruise",
  package: "Package",
};

const STATUS_TONE: Record<BookingStatus, "success" | "warn" | "danger" | "neutral"> = {
  active: "success",
  held: "warn",
  cancelled: "danger",
  completed: "neutral",
};

const TABS: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "held", label: "Held" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

function inr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

// Live mm:ss countdown to a hold's expiry.
function HoldCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) return <span className="text-[12px] font-semibold text-danger-600">Expired</span>;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return (
    <span className="text-[12px] font-semibold text-warn-600">
      Expires in {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

function Indicator({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-brand-200 bg-brand-50" : "border-border-soft bg-white"}`}>
      <p className="text-[12px] text-ink-muted">{label}</p>
      <p className={`mt-1 text-[18px] font-bold ${accent ? "text-brand-700" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function earningsThisMonth(bookings: Booking[]): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return bookings
    .filter((b) => {
      const d = new Date(b.createdAt);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .reduce((sum, b) => sum + (b.agentMarkup ?? 0), 0);
}

function earningsAllTime(bookings: Booking[]): number {
  return bookings.reduce((sum, b) => sum + (b.agentMarkup ?? 0), 0);
}

export default function AgentDashboardPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<BookingStatus | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<{
    productType: ProductType;
    amount: string;
    pnr: string;
    mode: "held" | "active";
    holdMinutes: string;
  }>({ productType: "flight", amount: "", pnr: "", mode: "held", holdMinutes: "30" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [items, prof] = await Promise.all([agentClient.bookings(), agentClient.profile()]);
        if (active) {
          setBookings(items);
          setProfile(prof);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Unable to load bookings.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  const act = async (id: string, fn: () => Promise<Booking>) => {
    setBusyId(id);
    try {
      await fn();
      refresh();
    } catch (err) {
      toast.push({
        title: "Error",
        description: err instanceof ApiError ? err.message : "Action failed",
        tone: "danger",
      });
    } finally {
      setBusyId(null);
    }
  };

  const submitCreate = async () => {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.push({ title: "Enter a valid amount", tone: "warn" });
      return;
    }
    setCreating(true);
    try {
      await agentClient.create({
        productType: form.productType,
        amount,
        status: form.mode,
        pnr: form.pnr.trim() || undefined,
        holdMinutes: form.mode === "held" ? Number(form.holdMinutes) || 30 : undefined,
      });
      toast.push({ title: form.mode === "held" ? "Hold created" : "Booking created", tone: "success" });
      setCreateOpen(false);
      setForm({ productType: "flight", amount: "", pnr: "", mode: "held", holdMinutes: "30" });
      refresh();
    } catch (err) {
      toast.push({
        title: "Could not create",
        description: err instanceof ApiError ? err.message : "Failed",
        tone: "danger",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-muted">Loading bookings…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-600">
        {error}
      </div>
    );
  }

  const visible = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);

  return (
    <div className="flex flex-col gap-6">
      {profile ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <Indicator label="Credit Limit" value={profile.creditLimit != null ? inr(profile.creditLimit) : "Not set"} />
            <Indicator label="Credit Used" value={inr(profile.creditUsed)} />
            <Indicator
              label="Available"
              value={profile.creditAvailable != null ? inr(profile.creditAvailable) : "—"}
            />
            <Indicator label="Wallet" value={inr(profile.walletBalance)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Indicator
              label="Markup earned this month"
              value={inr(earningsThisMonth(bookings))}
              accent
            />
            <Indicator
              label="Markup earned all-time"
              value={inr(earningsAllTime(bookings))}
              accent
            />
            <Indicator
              label="Bookings this month"
              value={String(
                bookings.filter((b) => {
                  const now = new Date();
                  const d = new Date(b.createdAt);
                  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                }).length,
              )}
            />
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Tabs value={tab} onChange={(v) => setTab(v)} items={TABS} variant="segmented" />
        <Button type="button" variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          New Hold / Booking
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No bookings here" subtitle="Create a hold or booking to get started." />
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((booking) => (
            <article
              key={booking.id}
              className="flex flex-col gap-3 rounded-xl border border-border-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-ink">
                    {PRODUCT_LABELS[booking.productType]}
                  </span>
                  <Badge tone={STATUS_TONE[booking.status]} size="sm">
                    {booking.status}
                  </Badge>
                  {booking.status === "held" && booking.holdExpiresAt ? (
                    <HoldCountdown expiresAt={booking.holdExpiresAt} />
                  ) : null}
                </div>
                <p className="text-[13px] text-ink-muted">
                  {booking.pnr ? `PNR ${booking.pnr} · ` : ""}
                  {booking.currency} {booking.amount.toLocaleString("en-IN")}
                  {booking.agentMarkup != null && booking.agentMarkup > 0 ? (
                    <span className="ml-2 font-medium text-brand-600">
                      +{inr(booking.agentMarkup)} markup
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex gap-2">
                {booking.status === "held" ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={busyId === booking.id}
                    onClick={() => act(booking.id, () => agentClient.confirm(booking.id))}
                  >
                    Confirm
                  </Button>
                ) : null}
                {booking.status === "active" || booking.status === "held" ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={busyId === booking.id}
                    onClick={() => act(booking.id, () => agentClient.cancel(booking.id))}
                  >
                    {booking.status === "held" ? "Release" : "Cancel"}
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Hold / Booking"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" loading={creating} onClick={submitCreate}>
              Create
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="bk-product" className="text-[13px] font-medium text-ink-soft">
              Product
            </label>
            <select
              id="bk-product"
              value={form.productType}
              onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value as ProductType }))}
              className="mt-1 h-11 w-full rounded-md border border-border bg-white px-3 text-[14px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              {PRODUCT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PRODUCT_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="bk-amount"
            label="Amount (₹)"
            type="number"
            inputMode="numeric"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0"
          />

          <Input
            id="bk-pnr"
            label="PNR (optional)"
            type="text"
            value={form.pnr}
            onChange={(e) => setForm((f) => ({ ...f, pnr: e.target.value }))}
            placeholder="e.g. ABC123"
          />

          <Tabs
            value={form.mode}
            onChange={(v) => setForm((f) => ({ ...f, mode: v }))}
            items={[
              { value: "held", label: "Hold" },
              { value: "active", label: "Confirmed Booking" },
            ]}
            variant="segmented"
          />

          {form.mode === "held" ? (
            <Input
              id="bk-hold-minutes"
              label="Hold duration (minutes)"
              type="number"
              inputMode="numeric"
              value={form.holdMinutes}
              onChange={(e) => setForm((f) => ({ ...f, holdMinutes: e.target.value }))}
              placeholder="30"
              hint="Holds count against your credit limit until confirmed or released."
            />
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
