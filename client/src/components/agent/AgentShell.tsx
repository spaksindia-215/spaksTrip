"use client";

import PageShell from "@/components/dashboard/PageShell";
import type { NavItem } from "@/components/dashboard/types";
import { type AuthUser } from "@/state/authStore";

type Props = {
  user: AuthUser;
  children: React.ReactNode;
};

const NAV: NavItem[] = [
  { href: "/agent/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/agent/pnr", label: "PNR Tracker", icon: "pnr" },
  { href: "/agent/markup", label: "Markup", icon: "markup" },
  { href: "/agent/branding", label: "Branding", icon: "branding" },
  { href: "/agent/profile", label: "Profile", icon: "profile" },
];

export default function AgentShell({ user, children }: Props) {
  return (
    <PageShell user={user} role="agent" nav={NAV}>
      {children}
    </PageShell>
  );
}
