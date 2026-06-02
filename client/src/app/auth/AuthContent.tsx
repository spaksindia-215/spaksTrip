"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { useAuthStore } from "@/state/authStore";
import { dashboardPathForRole } from "@/lib/roleRoutes";

export default function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const initialMode =
    searchParams.get("mode") === "register" ? "register" : "signin";
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    if (status === "idle") {
      void hydrate();
    }
  }, [hydrate, status]);

  useEffect(() => {
    if (status !== "ready" || !user) return;
    // Honor the page the user was redirected from; otherwise the role dashboard.
    router.replace(redirect ?? dashboardPathForRole(user.role));
  }, [redirect, router, status, user]);

  const subtitle = useMemo(() => {
    if (initialMode === "register") {
      return "Join SpaksTrip and start booking flights, hotels, packages and more.";
    }

    return "Sign in to manage your bookings and explore travel deals.";
  }, [initialMode]);

  return (
    <main className="min-h-screen bg-[#0E1E3A] px-4 py-14 relative overflow-hidden">
      {/* Background travel pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#F6A441]/8 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-brand-600/12 blur-3xl" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.04]"
          aria-hidden
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-white/95 shadow-[0_32px_100px_rgba(0,0,0,0.45)] sm:grid-cols-[1.08fr_0.92fr]">

          {/* Left panel — travel theme */}
          <section className="hidden flex-col justify-between bg-[#0E1E3A] px-8 py-10 text-white sm:flex relative overflow-hidden">
            {/* Subtle world map watermark */}
            <svg
              className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 opacity-[0.05] translate-x-16 translate-y-16"
              viewBox="0 0 200 200"
              fill="none"
              aria-hidden
            >
              <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1.5" />
              <ellipse cx="100" cy="100" rx="40" ry="80" stroke="white" strokeWidth="1.5" />
              <line x1="20" y1="100" x2="180" y2="100" stroke="white" strokeWidth="1.5" />
              <line x1="100" y1="20" x2="100" y2="180" stroke="white" strokeWidth="1.5" />
              <ellipse cx="100" cy="100" rx="80" ry="28" stroke="white" strokeWidth="1" />
            </svg>

            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F6A441]">
                SpaksTrip
              </p>
              <h1 className="max-w-xs text-4xl font-black leading-tight">
                Your next adventure awaits.
              </h1>
              <p className="max-w-xs text-sm leading-6 text-white/70">
                Flights, hotels, packages, visas and more — all in one place.
                Sign in and start exploring.
              </p>
            </div>

            {/* Destination pills */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                Popular destinations
              </p>
              <div className="flex flex-wrap gap-2">
                {["Bali", "Maldives", "Paris", "Dubai", "Manali", "Goa"].map((dest) => (
                  <span
                    key={dest}
                    className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[12px] font-medium text-white/75"
                  >
                    {dest}
                  </span>
                ))}
              </div>

              {/* Feature highlights */}
              <div className="mt-4 grid gap-2.5">
                {[
                  { icon: "✈", text: "Flights to 500+ destinations" },
                  { icon: "🏨", text: "Hotels, villas & homestays" },
                  { icon: "🗺", text: "Curated tour packages" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-white/70">
                    <span className="text-base">{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right panel — auth form */}
          <section className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-6 space-y-2">
              <h2 className="text-3xl font-extrabold text-[#0E1E3A]">
                {initialMode === "register" ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-sm text-ink-muted">{subtitle}</p>
            </div>

            <AuthForm
              initialMode={initialMode}
              redirectTo={redirect}
              onSuccess={(authenticatedUser) => {
                if (redirect) {
                  router.replace(redirect);
                  return;
                }

                router.replace(dashboardPathForRole(authenticatedUser.role));
              }}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
