"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PartnerError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[partner] segment error", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--surface-muted)] px-4 py-20 text-center">
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: "var(--danger-50)" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10"
          style={{ color: "var(--danger-500)" }}
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h1 className="mb-3 text-2xl font-bold sm:text-3xl" style={{ color: "var(--ink)" }}>
        Partner workspace is unavailable
      </h1>
      <p className="mb-2 max-w-md text-base" style={{ color: "var(--ink-muted)" }}>
        We couldn&apos;t reach the partner backend. This usually means the API server isn&apos;t
        running or your session has expired.
      </p>
      {error.message ? (
        <p className="mb-2 max-w-md font-mono text-xs" style={{ color: "var(--ink-subtle)" }}>
          {error.message}
        </p>
      ) : null}
      {error.digest ? (
        <p className="mb-6 font-mono text-xs" style={{ color: "var(--ink-subtle)" }}>
          Error ID: {error.digest}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={unstable_retry}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--brand-500)", boxShadow: "var(--shadow-sm)" }}
        >
          Try again
        </button>
        <Link
          href="/auth?role=partner&redirect=/partner/dashboard"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-6 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-sunken)]"
          style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
        >
          Sign in again
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-6 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-sunken)]"
          style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
