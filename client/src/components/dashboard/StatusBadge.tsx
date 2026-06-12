import Badge from "@/components/ui/Badge";

// Maps booking + listing statuses onto the shared Badge tones.
// Status colour is the ONLY decorative colour allowed in the dashboards.
const TONE: Record<string, "success" | "warn" | "danger" | "neutral" | "info"> = {
  active: "success",
  confirmed: "success",
  completed: "neutral",
  paused: "neutral",
  held: "warn",
  draft: "warn",
  pending: "warn",
  cancelled: "danger",
  suspended: "danger",
};

const LABEL: Record<string, string> = {
  active: "Active",
  confirmed: "Confirmed",
  completed: "Completed",
  paused: "Paused",
  held: "Held",
  draft: "Draft",
  pending: "Pending",
  cancelled: "Cancelled",
  suspended: "Suspended",
};

export default function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <Badge tone={TONE[key] ?? "neutral"} size="sm">
      {LABEL[key] ?? status}
    </Badge>
  );
}
