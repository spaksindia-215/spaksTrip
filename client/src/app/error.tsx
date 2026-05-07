"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--surface-muted)] px-4 py-20 text-center">
      {/* Logo */}
      <Link href="/" aria-label="SpaksTrip home" className="mb-10 block">
        <img src="/logo.png" alt="SpaksTrip" className="h-14 w-14 object-contain" />
      </Link>

      {/* Icon */}
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: "var(--danger-50)" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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

      <h1
        className="mb-3 text-2xl font-bold sm:text-3xl"
        style={{ color: "var(--ink)" }}
      >
        Something went wrong
      </h1>
      <p
        className="mb-2 max-w-sm text-base"
        style={{ color: "var(--ink-muted)" }}
      >
        An unexpected error occurred. You can try again or head back home.
      </p>
      {error.digest && (
        <p className="mb-6 font-mono text-xs" style={{ color: "var(--ink-subtle)" }}>
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={unstable_retry}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: "var(--brand-500)",
            boxShadow: "var(--shadow-sm)",
            outlineColor: "var(--brand-500)",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-6 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-sunken)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            borderColor: "var(--border)",
            color: "var(--ink-soft)",
            outlineColor: "var(--brand-500)",
          }}
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
