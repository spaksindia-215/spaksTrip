"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DashIcon from "./DashIcon";
import type { NavItem } from "./types";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SideNav({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border-soft bg-surface md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-border-soft px-5">
        <Link href="/" className="flex items-center gap-2" aria-label="SpaksTrip home">
          <img src="/logo.png" alt="SpaksTrip" className="h-8 w-8 object-contain" />
          <span className="text-base font-semibold text-ink">SpaksTrip</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-transparent text-ink-muted hover:bg-surface-muted hover:text-ink",
                  )}
                >
                  <DashIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border-soft p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <span aria-hidden>←</span> Browse SpaksTrip
        </Link>
      </div>
    </aside>
  );
}
