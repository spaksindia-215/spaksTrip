"use client";

import { useEffect } from "react";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export default function GlobalError({
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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f6f7fb] text-[#0e1e3a]">
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
          {/* Logo */}
          <a href="/" aria-label="SpaksTrip home" className="mb-10 block">
            <img src="/logo.png" alt="SpaksTrip" className="h-14 w-14 object-contain" />
          </a>

          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-red-500"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="mb-3 text-2xl font-bold sm:text-3xl text-[#0e1e3a]">
            Critical error
          </h1>
          <p className="mb-2 max-w-sm text-base text-[#64748b]">
            The application encountered a fatal error. Please try refreshing the
            page or return home.
          </p>
          {error.digest && (
            <p className="mb-6 font-mono text-xs text-[#94a3b8]">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={unstable_retry}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#2f63e0] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f63e0]"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#d4d8e0] px-6 py-3 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#eef0f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f63e0]"
            >
              ← Back to Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
