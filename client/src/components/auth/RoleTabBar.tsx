"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/authClient";

export type RoleTab = {
  value: UserRole;
  label: string;
};

type Props = {
  roles: RoleTab[];
  activeRole: UserRole;
  onChange: (role: UserRole) => void;
};

function RoleIcon({ role }: { role: UserRole }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "h-[15px] w-[15px]",
  };
  switch (role) {
    case "customer":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      );
    case "agent":
      return (
        <svg {...common}>
          <rect x="4" y="7" width="16" height="12" rx="2" />
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
        </svg>
      );
    case "b2b_agent":
      return (
        <svg {...common}>
          <path d="M4 20V6a2 2 0 0 1 2-2h6v16" />
          <path d="M12 20V9h6a2 2 0 0 1 2 2v9" />
          <path d="M7 8h2M7 12h2M15 13h2M15 16h2" />
        </svg>
      );
    case "partner":
      return (
        <svg {...common}>
          <path d="M3 12l4-4 4 3 4-4 6 5" />
          <path d="M3 12v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4" />
        </svg>
      );
  }
}

export default function RoleTabBar({ roles, activeRole, onChange }: Props): ReactNode {
  return (
    <div
      role="tablist"
      aria-label="Account type"
      className="grid grid-cols-2 gap-1.5 rounded-xl bg-surface-muted/70 p-1.5 sm:grid-cols-4"
    >
      {roles.map((tab) => {
        const active = tab.value === activeRole;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold",
              "transition-all duration-200 ease-in-out",
              active
                ? "border border-border bg-white text-brand-700 shadow-[var(--shadow-xs)] opacity-100"
                : "border border-transparent text-ink-muted opacity-80 hover:text-ink hover:opacity-100",
            )}
          >
            <RoleIcon role={tab.value} />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
