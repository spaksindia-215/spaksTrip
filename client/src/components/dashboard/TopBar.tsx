"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Badge from "@/components/ui/Badge";
import type { DashRole } from "./types";
import { useAuthStore, type AuthUser } from "@/state/authStore";
import { cn } from "@/lib/cn";

const ROLE_LABEL: Record<DashRole, string> = {
  agent: "Agent",
  partner: "Partner",
  customer: "Customer",
};

type Props = {
  user: AuthUser;
  role: DashRole;
  homeHref: string;
  section: string;
  profileHref: string;
  // Opens the mobile nav sheet (rendered by PageShell).
  onOpenMenu: () => void;
};

export default function TopBar({ user, role, homeHref, section, profileHref, onOpenMenu }: Props) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await logout();
    router.replace(`/auth?role=${role}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border-soft bg-surface px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-md text-ink transition-colors hover:bg-surface-muted md:hidden"
        >
          <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link href={homeHref} className="shrink-0 text-ink-muted transition-colors hover:text-ink">
            {ROLE_LABEL[role]}
          </Link>
          <span className="text-ink-subtle" aria-hidden>/</span>
          <span className="truncate font-medium text-ink">{section}</span>
        </nav>
      </div>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-muted"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-[13px] font-semibold text-white">
            {initial}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block max-w-[12rem] truncate text-[13px] font-medium leading-tight text-ink">
              {user.displayName}
            </span>
          </span>
          <Badge tone="brand" size="sm" className="hidden sm:inline-flex">
            {ROLE_LABEL[role]}
          </Badge>
          <svg
            viewBox="0 0 24 24"
            width={14}
            height={14}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={cn("text-ink-muted transition-transform", open && "rotate-180")}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[13rem] overflow-hidden rounded-md border border-border-soft bg-surface shadow-card-hover"
          >
            <div className="border-b border-border-soft px-3 py-2.5">
              <p className="truncate text-[13px] font-medium text-ink">{user.displayName}</p>
              <p className="truncate text-[12px] text-ink-muted">{user.email}</p>
            </div>
            <Link
              href={profileHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="block w-full px-3 py-2 text-left text-[13px] font-medium text-danger-600 transition-colors hover:bg-danger-50"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
