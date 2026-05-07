import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found — SpaksTrip",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--surface-muted)] px-4 py-20 text-center">
      {/* Logo */}
      <Link href="/" aria-label="SpaksTrip home" className="mb-10 block">
        <img src="/logo.png" alt="SpaksTrip" className="h-14 w-14 object-contain" />
      </Link>

      {/* Illustration number */}
      <div className="relative mb-6 select-none">
        <span
          className="text-[10rem] font-extrabold leading-none tracking-tighter"
          style={{ color: "var(--brand-100)" }}
        >
          404
        </span>
        <span
          className="absolute inset-0 flex items-center justify-center text-[10rem] font-extrabold leading-none tracking-tighter"
          style={{
            color: "var(--brand-500)",
            clipPath: "inset(0 0 45% 0)",
          }}
          aria-hidden
        >
          404
        </span>
      </div>

      <h1
        className="mb-3 text-2xl font-bold sm:text-3xl"
        style={{ color: "var(--ink)" }}
      >
        Oops — we lost this page
      </h1>
      <p
        className="mb-8 max-w-sm text-base"
        style={{ color: "var(--ink-muted)" }}
      >
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been
        moved. Let&rsquo;s get you back on track.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: "var(--brand-500)",
            boxShadow: "var(--shadow-sm)",
            outlineColor: "var(--brand-500)",
          }}
        >
          ← Back to Home
        </Link>
        <Link
          href="/flight"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-6 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-sunken)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            borderColor: "var(--border)",
            color: "var(--ink-soft)",
            outlineColor: "var(--brand-500)",
          }}
        >
          Search Flights
        </Link>
      </div>
    </main>
  );
}
