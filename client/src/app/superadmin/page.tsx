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
import { adminClient, type AdminUser, type AdminListing } from "@/lib/adminClient";
import type { UserRole } from "@/lib/authClient";

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

export default function SuperadminPage() {
  const toast = useToast();
  const [session, setSession] = useState<"checking" | "out" | "in">("checking");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<"pending" | "listings" | "users">("pending");

  const [pending, setPending] = useState<AdminUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  const [listings, setListings] = useState<AdminListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingActionLoading, setListingActionLoading] = useState<string | null>(null);

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
          const items = await adminClient.pendingListings();
          if (active) setListings(items);
        } else {
          const items = await adminClient.users(userFilter === "all" ? undefined : userFilter);
          if (active) setUsers(items);
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
        }
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, [session, tab, userFilter, toast]);

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

  const handleApproveListing = async (listing: AdminListing) => {
    setListingActionLoading(listing.id);
    try {
      await adminClient.approveListing(listing.id, listing.resourceType);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
      toast.push({ title: "Listing approved", tone: "success" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Approval failed";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setListingActionLoading(null);
    }
  };

  const handleRejectListing = async (listing: AdminListing) => {
    setListingActionLoading(listing.id);
    try {
      await adminClient.rejectListing(listing.id, listing.resourceType);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
      toast.push({ title: "Listing rejected", tone: "success" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Rejection failed";
      toast.push({ title: "Error", description: message, tone: "danger" });
    } finally {
      setListingActionLoading(null);
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
          <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <Tabs
          value={tab}
          onChange={(value) => setTab(value)}
          items={[
            { value: "pending", label: "Pending Approvals" },
            { value: "listings", label: "Pending Listings" },
            { value: "users", label: "All Users" },
          ]}
          variant="underline"
        />

        {tab === "listings" ? (
          <section className="mt-6">
            {listingsLoading ? (
              <p className="py-12 text-center text-sm text-ink-muted">Loading…</p>
            ) : listings.length === 0 ? (
              <EmptyState title="No pending listings" subtitle="New taxi, hotel, and other resource listings submitted by partners will appear here." />
            ) : (
              <div className="flex flex-col gap-3">
                {listings.map((listing) => {
                  const isActing = listingActionLoading === listing.id;
                  const typeLabel = listing.resourceType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <article
                      key={listing.id}
                      className="flex flex-col gap-3 rounded-xl border border-border-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-ink">{listing.title}</span>
                          <Badge tone="brand" size="sm">{typeLabel}</Badge>
                        </div>
                        <p className="text-[13px] text-ink-muted">
                          {listing.partnerName ?? "Unknown partner"} · {listing.partnerEmail ?? ""}
                        </p>
                        <p className="text-[12px] text-ink-subtle">
                          Price: ₹{listing.price.toLocaleString("en-IN")}
                          {typeof listing.metadata?.operatingCity === "string"
                            ? ` · ${listing.metadata.operatingCity}`
                            : typeof listing.metadata?.city === "string"
                            ? ` · ${listing.metadata.city}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          loading={isActing}
                          onClick={() => handleApproveListing(listing)}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          loading={isActing}
                          onClick={() => handleRejectListing(listing)}
                        >
                          Reject
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
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
