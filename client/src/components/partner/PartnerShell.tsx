"use client";

import PageShell from "@/components/dashboard/PageShell";
import type { NavItem } from "@/components/dashboard/types";
import { type AuthUser } from "@/state/authStore";

type Props = {
  user: AuthUser;
  children: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/partner/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/partner/hotels", label: "Hotels", icon: "hotel" },
  { href: "/partner/taxis", label: "Taxis", icon: "taxi" },
  { href: "/partner/taxi-packages", label: "Taxi Packages", icon: "taxi" },
  { href: "/partner/tours", label: "Tours", icon: "tour" },
  { href: "/partner/tour-packages", label: "Tour Packages", icon: "package" },
  { href: "/partner/cruises", label: "Cruises", icon: "cruise" },
  { href: "/partner/bookings", label: "Bookings", icon: "bookings" },
];

export default function PartnerShell({ user, children }: Props) {
  return (
    <PageShell user={user} role="partner" nav={NAV_ITEMS}>
      {children}
    </PageShell>
  );
}
