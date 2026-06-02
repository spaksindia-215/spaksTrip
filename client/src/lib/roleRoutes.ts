import type { UserRole } from "@/lib/authClient";

// Single source of truth for where each role lands after authentication.
// Agent and B2B Agent share the same portal (B2B adds a locked API section in Step 8).
export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "customer":
      return "/customer/dashboard";
    case "partner":
      return "/partner/dashboard";
    case "agent":
    case "b2b_agent":
      return "/agent/dashboard";
    default:
      return "/";
  }
}
