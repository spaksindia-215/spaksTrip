"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Chip from "@/components/ui/Chip";
import { useAuthStore, type AuthUser } from "@/state/authStore";

type Props = {
  user: AuthUser;
  children: React.ReactNode;
};

const BASE_NAV = [
  { href: "/agent/dashboard", label: "Bookings" },
  { href: "/agent/pnr", label: "PNR Tracker" },
  { href: "/agent/profile", label: "Profile" },
];

// B2B agents get an extra (locked) API credentials section.
const B2B_NAV = [{ href: "/agent/api", label: "API" }];

export default function AgentShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const isB2b = user.role === "b2b_agent";
  const navItems = isB2b ? [...BASE_NAV, ...B2B_NAV] : BASE_NAV;

  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <Header />

      <div className="bg-brand-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
                {isB2b ? "B2B Agent Portal" : "Agent Portal"}
              </p>
              <h1 className="mt-1 text-2xl font-black">SpaksTrip {isB2b ? "B2B" : "Agent"}</h1>
              <p className="mt-1 text-[13px] text-white/72">
                Manage bookings, holds, and credit with a booking-first workspace.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[12px] font-semibold text-white/90">
                {user.displayName}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace("/auth?role=agent");
                }}
                className="rounded-full border border-white/20 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="mb-5 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Chip active={pathname === item.href}>{item.label}</Chip>
              </Link>
            ))}
          </div>

          {children}
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
