import type { SVGProps } from "react";

// Compact line-icon set for dashboard navigation. Keyed by NavItem.icon.
// Stroke uses currentColor so colour is controlled by the parent text class.
export type DashIconName =
  | "dashboard"
  | "bookings"
  | "pnr"
  | "markup"
  | "branding"
  | "profile"
  | "api"
  | "hotel"
  | "taxi"
  | "tour"
  | "cruise"
  | "package"
  | "more";

const PATHS: Record<DashIconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  bookings: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </>
  ),
  pnr: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  markup: (
    <>
      <path d="M3 17l5-5 4 3 8-8" />
      <path d="M16 7h5v5" />
    </>
  ),
  branding: (
    <>
      <circle cx="13.5" cy="6.5" r="1.5" />
      <circle cx="17.5" cy="10.5" r="1.5" />
      <circle cx="8.5" cy="7.5" r="1.5" />
      <circle cx="6.5" cy="12.5" r="1.5" />
      <path d="M12 2a10 10 0 1 0 0 20c1 0 2-.8 2-2s-.5-1.2-.5-2 .7-1.5 1.5-1.5H18a4 4 0 0 0 4-4 8 8 0 0 0-10-8.5" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  api: (
    <>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />
    </>
  ),
  hotel: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
      <path d="M3 21h18" />
      <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-3a2 2 0 0 1 4 0v3" />
    </>
  ),
  taxi: (
    <>
      <path d="M5 17h14" />
      <path d="m5 17 1.4-5.2A2 2 0 0 1 8.3 10h7.4a2 2 0 0 1 1.9 1.4L19 17" />
      <path d="M9 10V7h6v3" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>
  ),
  tour: (
    <>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Z" />
    </>
  ),
  cruise: (
    <>
      <path d="M3 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
      <path d="m5 14 1-4h12l1 4" />
      <path d="M12 4v6" />
    </>
  ),
  package: (
    <>
      <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
      <path d="M12 2v20M3 7l9 5 9-5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </>
  ),
};

export default function DashIcon({
  name,
  ...props
}: { name: DashIconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
