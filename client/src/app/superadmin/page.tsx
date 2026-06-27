"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import {
  adminClient,
  type AdminUser,
  type AdminListing,
  type AdminListingType,
  type NavbarVisibility,
  type PlatformMarkupConfig,
  type PlatformMarkupRule,
} from "@/lib/adminClient";
import type { UserRole } from "@/lib/authClient";

// All public (non-partner-only) navbar items the admin can show/hide.
const CONTROLLABLE_NAV_ITEMS: Array<{ key: string; label: string }> = [
  { key: "nav.flight", label: "Flight" },
  { key: "Hotel", label: "Hotel" },
  { key: "nav.taxi_package", label: "Taxi Package" },
  { key: "nav.holiday_packages", label: "Holiday Packages" },
  { key: "nav.accommodation", label: "Accommodation" },
  { key: "nav.transport", label: "Transport" },
  { key: "nav.cruise", label: "Cruise" },
  { key: "nav.train", label: "Train" },
  { key: "Events", label: "Events" },
  { key: "SightSeeing", label: "SightSeeing" },
  { key: "Transfer", label: "Transfer" },
  { key: "Self-Drive", label: "Self-Drive" },
  { key: "Islandhopper", label: "Islandhopper" },
  { key: "nav.visa_consultancy", label: "Visa Consultancy" },
  { key: "insaurance", label: "Insurance" },
];

const CREDIT_MIN = 8000;
const CREDIT_MAX = 100000;

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  agent: "Agent",
  b2b_agent: "B2B Agent",
  partner: "Partner",
};

const STATUS_TONE = {
  active: "success",
  pending: "warn",
  rejected: "danger",
} as const;

const LISTING_TYPE_FILTERS: Array<{ value: AdminListingType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "hotel", label: "Hotels" },
  { value: "taxi", label: "Taxis" },
  { value: "taxi_package", label: "Taxi Pkgs" },
  { value: "tour", label: "Tours" },
  { value: "tour_package", label: "Tour Pkgs" },
  { value: "cruise", label: "Cruises" },
];

const USER_FILTERS: Array<{ value: UserRole | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "customer", label: "Customers" },
  { value: "agent", label: "Agents" },
  { value: "b2b_agent", label: "B2B Agents" },
  { value: "partner", label: "Partners" },
];

function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatMarkupRule(rule: { type: "percent" | "flat"; value: number; cap?: number } | undefined): string {
  if (!rule || rule.value === 0) return "0%";
  const base = rule.type === "percent" ? `${rule.value}%` : `₹${rule.value} flat`;
  return rule.cap ? `${base} (cap ₹${rule.cap})` : base;
}

export default function SuperadminPage() {
  const toast = useToast();
  const [session, setSession] = useState<"checking" | "out" | "in">("checking");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<"pending" | "listings" | "users" | "navbar" | "markup">("pending");

  const [pending, setPending] = useState<AdminUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  const [listings, setListings] = useState<AdminListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingType, setListingType] = useState<AdminListingType | "all">("all");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<UserRole | "all">("all");

  const [approveTarget, setApproveTarget] = useState<AdminUser | null>(null);
  const [creditLimit, setCreditLimit] = useState("");
  const [rejectTarget, setRejectTarget] = useState<AdminUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [creditTarget, setCreditTarget] = useState<AdminUser | null>(null);
  const [creditValue, setCreditValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [navVisibility, setNavVisibility] = useState<NavbarVisibility>({});
  const [navLoading, setNavLoading] = useState(false);
  const [navSaving, setNavSaving] = useState(false);

  const DEFAULT_MARKUP_RULE: PlatformMarkupRule = { type: "percent", value: 0 };
  const [markupConfig, setMarkupConfig] = useState<PlatformMarkupConfig>({
    flights: { ...DEFAULT_MARKUP_RULE },
    hotels:  { ...DEFAULT_MARKUP_RULE },
    taxi:    { ...DEFAULT_MARKUP_RULE },
  });
  const [markupLoading, setMarkupLoading] = useState(false);
  const [markupSaving, setMarkupSaving] = useState(false);
  const [markupMeta, setMarkupMeta] = useState<{ version: number; updatedAt: string } | null>(null);

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      setPending(await adminClient.pending());
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load pending list";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setPendingLoading(false);
    }
  }, [toast]);

  // Check for an existing admin session on mount.
  useEffect(() => {
    adminClient
      .me()
      .then(() => setSession("in"))
      .catch(() => setSession("out"));
  }, []);

  // Load the active tab's data once authenticated. setState happens only after
  // the await (guarded), never synchronously in the effect body.
  useEffect(() => {
    if (session !== "in") return;
    let active = true;

    async function run() {
      try {
        if (tab === "pending") {
          const items = await adminClient.pending();
          if (active) setPending(items);
        } else if (tab === "listings") {
          setListingsLoading(true);
          const items = await adminClient.listings.list({
            status: "pending",
            type: listingType === "all" ? undefined : listingType,
          });
          if (active) setListings(items);
        } else if (tab === "users") {
          const items = await adminClient.users(userFilter === "all" ? undefined : userFilter);
          if (active) setUsers(items);
        } else if (tab === "navbar") {
          setNavLoading(true);
          const vis = await adminClient.getNavbarSettings();
          if (active) setNavVisibility(vis);
        } else if (tab === "markup") {
          setMarkupLoading(true);
          const data = await adminClient.getPlatformMarkup();
          if (active) {
            setMarkupConfig(data.markup);
            setMarkupMeta({ version: data.version, updatedAt: data.updatedAt });
          }
        }
      } catch (error) {
        if (!active) return;
        const message = error instanceof ApiError ? error.message : "Failed to load data";
        toast.push({ title: "Error", description: message, tone: "danger" });
      } finally {
        if (active) {
          setPendingLoading(false);
          setListingsLoading(false);
          setUsersLoading(false);
          setNavLoading(false);
          setMarkupLoading(false);
        }
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, [session, tab, userFilter, listingType, toast]);

  const toggleNavItem = (key: string) => {
    setNavVisibility((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const saveNavSettings = async () => {
    setNavSaving(true);
    try {
      const saved = await adminClient.updateNavbarSettings(navVisibility);
      setNavVisibility(saved);
      toast.push({ title: "Navbar settings saved", tone: "success" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Save failed";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setNavSaving(false);
    }
  };

  const saveMarkup = async () => {
    setMarkupSaving(true);
    try {
      const data = await adminClient.updatePlatformMarkup(markupConfig);
      setMarkupConfig(data.markup);
      setMarkupMeta({ version: data.version, updatedAt: data.updatedAt });
      toast.push({ title: "Platform markup saved", tone: "success" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Save failed";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setMarkupSaving(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length === 0) {
      toast.push({ title: "Enter the admin password", tone: "warn" });
      return;
    }
    setAuthLoading(true);
    try {
      await adminClient.login(password);
      setPassword("");
      setSession("in");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Login failed";
      toast.push({ title: "Access denied", description: message, tone: "danger" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminClient.logout();
    } finally {
      setSession("out");
    }
  };

  const openApprove = (user: AdminUser) => {
    setApproveTarget(user);
    setCreditLimit("");
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    let limit: number | undefined;
    if (approveTarget.role === "b2b_agent") {
      limit = Number(creditLimit);
      if (!Number.isFinite(limit) || limit < CREDIT_MIN || limit > CREDIT_MAX) {
        toast.push({
          title: "Invalid credit limit",
          description: `Enter an amount between ${formatInr(CREDIT_MIN)} and ${formatInr(CREDIT_MAX)}.`,
          tone: "warn",
        });
        return;
      }
    }
    setActionLoading(true);
    try {
      await adminClient.approve(approveTarget.id, limit);
      toast.push({ title: "Approved", description: `${approveTarget.name} can now sign in.`, tone: "success" });
      setApproveTarget(null);
      await loadPending();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Approval failed";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setActionLoading(false);
    }
  };

  const openCredit = (user: AdminUser) => {
    setCreditTarget(user);
    setCreditValue(user.creditLimit != null ? String(user.creditLimit) : "");
  };

  const confirmCredit = async () => {
    if (!creditTarget) return;
    const limit = Number(creditValue);
    if (!Number.isFinite(limit) || limit < CREDIT_MIN || limit > CREDIT_MAX) {
      toast.push({
        title: "Invalid credit limit",
        description: `Enter an amount between ${formatInr(CREDIT_MIN)} and ${formatInr(CREDIT_MAX)}.`,
        tone: "warn",
      });
      return;
    }
    setActionLoading(true);
    try {
      const updated = await adminClient.setCreditLimit(creditTarget.id, limit);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.push({ title: "Credit limit updated", tone: "success" });
      setCreditTarget(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Update failed";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await adminClient.reject(rejectTarget.id, rejectReason.trim());
      toast.push({ title: "Rejected", description: `${rejectTarget.name}'s application was rejected.`, tone: "success" });
      setRejectTarget(null);
      setRejectReason("");
      await loadPending();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Rejection failed";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setActionLoading(false);
    }
  };

  const approveListing = async (listing: AdminListing) => {
    setActionLoading(true);
    try {
      await adminClient.listings.approve(listing.type, listing.id);
      toast.push({ title: "Listing approved", description: `${listing.title} is now live.`, tone: "success" });
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Approval failed";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setActionLoading(false);
    }
  };

  const rejectListing = async (listing: AdminListing) => {
    setActionLoading(true);
    try {
      await adminClient.listings.reject(listing.type, listing.id);
      toast.push({ title: "Listing rejected", description: `${listing.title} was sent back to the partner.`, tone: "success" });
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Rejection failed";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setActionLoading(false);
    }
  };

  if (session === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0E1E3A] text-white/70">
        <p className="text-sm">Loading…</p>
      </main>
    );
  }

  if (session === "out") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0E1E3A] px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F6A441]">
            SpaksTrip
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#0E1E3A]">Superadmin</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Enter the admin password to manage approvals.
          </p>
          <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-4">
            <Input
              id="admin-password"
              label="Admin Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <Button type="submit" variant="primary" size="md" fullWidth loading={authLoading}>
              Unlock Panel
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-muted">
      <header className="bg-[#0E1E3A] px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F6A441]">
              SpaksTrip
            </p>
            <h1 className="text-xl font-bold text-white">Superadmin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/superadmin/packages"
              className="rounded-lg border border-white/30 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Packages
            </a>
            <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <Tabs
          value={tab}
          onChange={(value) => setTab(value)}
          items={[
            { value: "pending", label: "Pending Approvals" },
            { value: "listings", label: "Partner Listings" },
            { value: "users", label: "All Users" },
            { value: "navbar", label: "Navbar Visibility" },
            { value: "markup", label: "Platform Markup" },
          ]}
          variant="underline"
        />

        {tab === "markup" ? (
          <section className="mt-6">
            <div className="rounded-xl border border-border-soft bg-white p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Platform Markup (L1)</h2>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Applied on top of TBO fares before agents see their net rate. Agents never see these values.
                    {markupMeta && (
                      <span className="ml-1 text-ink-subtle">
                        v{markupMeta.version} · last saved {new Date(markupMeta.updatedAt).toLocaleString("en-IN")}
                      </span>
                    )}
                  </p>
                </div>
                <Button type="button" variant="primary" size="sm" loading={markupSaving} onClick={saveMarkup}>
                  Save Markup
                </Button>
              </div>

              {markupLoading ? (
                <p className="py-8 text-center text-sm text-ink-muted">Loading…</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {(["flights", "hotels", "taxi"] as const).map((product) => {
                    const rule = markupConfig[product];
                    const label = product.charAt(0).toUpperCase() + product.slice(1);
                    return (
                      <div key={product} className="rounded-lg border border-border-soft p-4 flex flex-col gap-3">
                        <h3 className="text-[14px] font-semibold text-ink">{label}</h3>

                        <div>
                          <p className="mb-1.5 text-[12px] font-medium text-ink-soft">Type</p>
                          <Tabs
                            value={rule.type}
                            onChange={(v) =>
                              setMarkupConfig((prev) => ({
                                ...prev,
                                [product]: { ...prev[product], type: v as "percent" | "flat" },
                              }))
                            }
                            items={[
                              { value: "percent", label: "%" },
                              { value: "flat", label: "₹ flat" },
                            ]}
                            variant="segmented"
                          />
                        </div>

                        <Input
                          id={`platform-${product}-value`}
                          label={rule.type === "percent" ? "Markup (%)" : "Markup (₹)"}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={rule.type === "percent" ? 30 : 5000}
                          value={String(rule.value)}
                          onChange={(e) =>
                            setMarkupConfig((prev) => ({
                              ...prev,
                              [product]: { ...prev[product], value: Number(e.target.value) || 0 },
                            }))
                          }
                          placeholder="0"
                          sizeVariant="sm"
                        />

                        <Input
                          id={`platform-${product}-cap`}
                          label="Cap (₹) — optional"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          value={rule.cap != null ? String(rule.cap) : ""}
                          onChange={(e) => {
                            const cap = e.target.value.trim() !== "" ? Number(e.target.value) : undefined;
                            setMarkupConfig((prev) => ({
                              ...prev,
                              [product]: { ...prev[product], cap },
                            }));
                          }}
                          placeholder="No cap"
                          sizeVariant="sm"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        ) : tab === "navbar" ? (
          <section className="mt-6">
            <div className="rounded-xl border border-border-soft bg-white p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Navbar Visibility</h2>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Toggle which items are visible to all website visitors. Changes take effect immediately after saving.
                  </p>
                </div>
                <Button type="button" variant="primary" size="sm" loading={navSaving} onClick={saveNavSettings}>
                  Save Changes
                </Button>
              </div>

              {navLoading ? (
                <p className="py-8 text-center text-sm text-ink-muted">Loading…</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {CONTROLLABLE_NAV_ITEMS.map(({ key, label }) => {
                    const visible = navVisibility[key] ?? true;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleNavItem(key)}
                        className="flex items-center justify-between rounded-lg border border-border-soft px-4 py-3 text-left transition-colors hover:bg-surface-muted"
                      >
                        <span className="text-[14px] font-medium text-ink">{label}</span>
                        {/* Toggle pill */}
                        <span
                          aria-label={visible ? "Visible" : "Hidden"}
                          className={[
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                            visible ? "bg-brand-600" : "bg-gray-200",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200",
                              visible ? "translate-x-5" : "translate-x-0",
                            ].join(" ")}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        ) : tab === "pending" ? (
          <section className="mt-6">
            {pendingLoading ? (
              <p className="py-12 text-center text-sm text-ink-muted">Loading…</p>
            ) : pending.length === 0 ? (
              <EmptyState title="No pending approvals" subtitle="New B2B Agent and Partner registrations will appear here." />
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map((user) => (
                  <article
                    key={user.id}
                    className="flex flex-col gap-3 rounded-xl border border-border-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-ink">{user.name}</span>
                        <Badge tone="brand" size="sm">{ROLE_LABELS[user.role]}</Badge>
                      </div>
                      <p className="text-[13px] text-ink-muted">
                        {user.phone} · {user.email}
                      </p>
                      <p className="text-[12px] text-ink-subtle">
                        Aadhaar {user.aadhar}
                        {user.gst ? ` · GST ${user.gst}` : ""}
                        {user.pan ? ` · PAN ${user.pan}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="primary" size="sm" onClick={() => openApprove(user)}>
                        Approve
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => setRejectTarget(user)}>
                        Reject
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : tab === "listings" ? (
          <section className="mt-6">
            <Tabs
              value={listingType}
              onChange={(value) => setListingType(value)}
              items={LISTING_TYPE_FILTERS}
              variant="segmented"
            />
            <div className="mt-4">
              {listingsLoading ? (
                <p className="py-12 text-center text-sm text-ink-muted">Loading…</p>
              ) : listings.length === 0 ? (
                <EmptyState
                  title="No listings awaiting review"
                  subtitle="Hotels, taxis, tours, packages and cruises submitted by partners appear here for approval before they go live."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {listings.map((listing) => {
                    const partner = listing.partner;
                    return (
                      <article
                        key={`${listing.type}-${listing.id}`}
                        className="flex flex-col gap-3 rounded-xl border border-border-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex gap-3">
                          {listing.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={listing.thumbnail}
                              alt={listing.title}
                              className="h-16 w-20 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="grid h-16 w-20 shrink-0 place-items-center rounded-lg bg-surface-muted text-[11px] text-ink-subtle">
                              No image
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-semibold text-ink">{listing.title}</span>
                              <Badge tone="brand" size="sm">{listing.typeLabel}</Badge>
                            </div>
                            {listing.subtitle && (
                              <p className="text-[13px] text-ink-muted">{listing.subtitle}</p>
                            )}
                            <p className="text-[12px] text-ink-subtle">
                              {partner ? `By ${partner.name ?? partner.email ?? "partner"}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="primary" size="sm" loading={actionLoading} onClick={() => approveListing(listing)}>
                            Approve
                          </Button>
                          <Button type="button" variant="danger" size="sm" loading={actionLoading} onClick={() => rejectListing(listing)}>
                            Reject
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-6">
            <Tabs
              value={userFilter}
              onChange={(value) => setUserFilter(value)}
              items={USER_FILTERS}
              variant="segmented"
            />
            <div className="mt-4">
              {usersLoading ? (
                <p className="py-12 text-center text-sm text-ink-muted">Loading…</p>
              ) : users.length === 0 ? (
                <EmptyState title="No users found" subtitle="Try a different role filter." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border-soft bg-white">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-surface-muted text-ink-muted">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Role</th>
                        <th className="px-4 py-3 font-semibold">Phone</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Credit</th>
                        <th className="px-4 py-3 font-semibold">Markup</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t border-border-soft">
                          <td className="px-4 py-3">
                            <div className="font-medium text-ink">{user.name}</div>
                            <div className="text-[12px] text-ink-subtle">{user.email}</div>
                          </td>
                          <td className="px-4 py-3 text-ink-soft">{ROLE_LABELS[user.role]}</td>
                          <td className="px-4 py-3 text-ink-soft">{user.phone}</td>
                          <td className="px-4 py-3">
                            <Badge tone={STATUS_TONE[user.status]} size="sm">
                              {user.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-soft">
                            {user.role === "agent" || user.role === "b2b_agent" ? (
                              <button
                                type="button"
                                onClick={() => openCredit(user)}
                                className="font-medium text-brand-700 hover:underline"
                              >
                                {user.creditLimit != null ? formatInr(user.creditLimit) : "Set limit"}
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {user.role === "agent" || user.role === "b2b_agent" ? (
                              <span className="text-[12px] text-ink-soft">
                                ✈ {formatMarkupRule(user.markup?.flights)}
                                {" · "}
                                🏨 {formatMarkupRule(user.markup?.hotels)}
                                {" · "}
                                🚕 {formatMarkupRule(user.markup?.taxi)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Approve modal */}
      <Modal
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title={`Approve ${approveTarget?.name ?? ""}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setApproveTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" loading={actionLoading} onClick={confirmApprove}>
              Confirm Approval
            </Button>
          </div>
        }
      >
        {approveTarget?.role === "b2b_agent" ? (
          <Input
            id="credit-limit"
            label="Credit Limit (₹)"
            type="number"
            inputMode="numeric"
            value={creditLimit}
            onChange={(event) => setCreditLimit(event.target.value)}
            placeholder={`${CREDIT_MIN} – ${CREDIT_MAX}`}
            hint={`Between ${formatInr(CREDIT_MIN)} and ${formatInr(CREDIT_MAX)}.`}
          />
        ) : (
          <p className="text-[13px] text-ink-muted">
            Approve this partner account? They will be able to sign in immediately.
          </p>
        )}
      </Modal>

      {/* Credit limit modal */}
      <Modal
        open={Boolean(creditTarget)}
        onClose={() => setCreditTarget(null)}
        title={`Credit limit · ${creditTarget?.name ?? ""}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreditTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" loading={actionLoading} onClick={confirmCredit}>
              Save
            </Button>
          </div>
        }
      >
        <Input
          id="credit-limit-edit"
          label="Credit Limit (₹)"
          type="number"
          inputMode="numeric"
          value={creditValue}
          onChange={(event) => setCreditValue(event.target.value)}
          placeholder={`${CREDIT_MIN} – ${CREDIT_MAX}`}
          hint={`Between ${formatInr(CREDIT_MIN)} and ${formatInr(CREDIT_MAX)}.`}
        />
      </Modal>

      {/* Reject modal */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        title={`Reject ${rejectTarget?.name ?? ""}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" variant="danger" size="sm" loading={actionLoading} onClick={confirmReject}>
              Confirm Rejection
            </Button>
          </div>
        }
      >
        <label htmlFor="reject-reason" className="text-[13px] font-medium text-ink-soft">
          Reason (optional)
        </label>
        <textarea
          id="reject-reason"
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          rows={3}
          placeholder="Shared with the applicant by email."
          className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-[14px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </Modal>
    </main>
  );
}
