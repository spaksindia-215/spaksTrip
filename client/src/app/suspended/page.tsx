"use client";

import { useAgentBranding } from "@/lib/agentBranding";

export default function SuspendedPage() {
  const { companyName, logo, primaryColor } = useAgentBranding();

  const name = companyName ?? "This travel agency";
  const accent = primaryColor ?? "var(--brand-500)";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--surface-muted)] px-4 py-20 text-center">
      {logo && (
        <img
          src={logo}
          alt={name}
          className="mb-8 h-16 w-auto object-contain"
        />
      )}

      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
        style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}
        aria-hidden
      >
        ⏸
      </div>

      <h1 className="mb-3 text-2xl font-bold sm:text-3xl" style={{ color: "var(--ink)" }}>
        {name} is temporarily unavailable
      </h1>
      <p className="max-w-sm text-base" style={{ color: "var(--ink-muted)" }}>
        This travel portal is currently suspended. Please contact your booking
        agent directly for assistance.
      </p>
    </main>
  );
}
