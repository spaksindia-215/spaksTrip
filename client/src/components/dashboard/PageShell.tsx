"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Drawer from "@/components/ui/Drawer";
import DashIcon from "./DashIcon";
import SideNav from "./SideNav";
import TopBar from "./TopBar";
import type { DashRole, NavItem } from "./types";
import type { AuthUser } from "@/state/authStore";
import { cn } from "@/lib/cn";

type Props = {
  user: AuthUser;
  role: DashRole;
  nav: NavItem[];
  children: ReactNode;
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const PROFILE_HREF: Record<DashRole, string> = {
  agent: "/agent/profile",
  partner: "/partner/dashboard",
  customer: "/customer/profile",
};

export default function PageShell({ user, role, nav, children }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const homeHref = nav[0]?.href ?? "/";
  const active = nav.find((item) => isActive(pathname, item.href));
  const section = active?.label ?? nav[0]?.label ?? "Dashboard";

  // Bottom tab bar shows the first four items; the rest live behind "More".
  const primary = nav.slice(0, 4);

  return (
    <div className="flex min-h-screen bg-surface-muted text-ink">
      <SideNav nav={nav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={user}
          role={role}
          homeHref={homeHref}
          section={section}
          profileHref={PROFILE_HREF[role]}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main className="flex-1 px-4 pb-24 pt-6 md:px-6 md:pb-10 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border-soft bg-surface md:hidden">
        {primary.map((item) => {
          const isOn = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                isOn ? "text-brand-700" : "text-ink-muted",
              )}
            >
              <DashIcon name={item.icon} className="h-5 w-5" />
              <span className="max-w-[5rem] truncate">{item.label}</span>
            </Link>
          );
        })}
        {nav.length > 4 ? (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium text-ink-muted"
          >
            <DashIcon name="more" className="h-5 w-5" />
            More
          </button>
        ) : null}
      </nav>

      {/* Mobile full-nav sheet */}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" width="280px" title="Menu">
        <ul className="flex flex-col p-2">
          {nav.map((item) => {
            const isOn = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isOn ? "bg-brand-50 text-brand-700" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                  )}
                >
                  <DashIcon name={item.icon} className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="mt-2 border-t border-border-soft pt-2">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <span aria-hidden>←</span> Browse SpaksTrip
            </Link>
          </li>
        </ul>
      </Drawer>
    </div>
  );
}
