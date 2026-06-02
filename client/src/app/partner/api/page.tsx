import Badge from "@/components/ui/Badge";

export default function PartnerApiPage() {
  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-border-soft bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-ink">API Access</h2>
          <Badge tone="warn" size="sm">Coming Soon</Badge>
        </div>
        <p className="mt-2 text-[13px] text-ink-muted">
          Programmatic inventory and booking management for partners is on the way. You&apos;ll be
          able to sync listings and receive booking webhooks directly.
        </p>

        <div className="mt-5 select-none space-y-3 opacity-60" aria-hidden>
          <div>
            <p className="text-[12px] font-medium text-ink-soft">API Key</p>
            <div className="mt-1 flex h-11 items-center rounded-md border border-border bg-surface-muted px-3 font-mono text-[13px] text-ink-subtle">
              pk_live_••••••••••••••••••••••••
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
