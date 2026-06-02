"use client";

import Badge from "@/components/ui/Badge";
import { useAuthStore } from "@/state/authStore";

export default function AgentApiPage() {
  const user = useAuthStore((state) => state.user);

  // This section is exclusive to B2B agents.
  if (user && user.role !== "b2b_agent") {
    return (
      <div className="rounded-xl border border-border-soft bg-white p-6 text-[13px] text-ink-muted">
        The API section is available for B2B Agent accounts.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="relative overflow-hidden rounded-xl border border-border-soft bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-ink">API Credentials</h2>
          <Badge tone="warn" size="sm">Coming Soon</Badge>
        </div>
        <p className="mt-2 text-[13px] text-ink-muted">
          Programmatic access for B2B partners is on the way. You&apos;ll be able to generate API
          keys, manage access tokens, and integrate SpaksTrip booking directly into your systems.
        </p>

        {/* Locked preview */}
        <div className="mt-5 select-none space-y-3 opacity-60" aria-hidden>
          <div>
            <p className="text-[12px] font-medium text-ink-soft">API Key</p>
            <div className="mt-1 flex h-11 items-center rounded-md border border-border bg-surface-muted px-3 font-mono text-[13px] text-ink-subtle">
              sk_live_••••••••••••••••••••••••
            </div>
          </div>
          <div>
            <p className="text-[12px] font-medium text-ink-soft">Secret</p>
            <div className="mt-1 flex h-11 items-center rounded-md border border-border bg-surface-muted px-3 font-mono text-[13px] text-ink-subtle">
              ••••••••••••••••••••••••••••••••
            </div>
          </div>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-[12px] font-medium text-ink-muted">
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Locked — this feature isn&apos;t available yet.
        </div>
      </div>
    </div>
  );
}
