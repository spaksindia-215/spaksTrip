import type { DashIconName } from "./DashIcon";

export type DashRole = "agent" | "partner" | "customer";

export type NavItem = {
  href: string;
  label: string;
  icon: DashIconName;
};
