// Pricing is intentionally single-tier:
//   spakstrip.com (apex)       → TBO fare unchanged (platform margin comes from TBO wholesale rate)
//   agent.spakstrip.com (sub)  → TBO fare + agent markup  (L2 only)
//
// There is no platform-level L1 surcharge applied at runtime.
// The superadmin Platform Markup config exists for future use but is NOT wired here.

export type TwoTierPricing = {
  tboFare: number;
  platformMarkup: number;  // always 0 — kept for booking-record schema compatibility
  agentNetRate: number;    // == tboFare (no L1)
  agentMarkup: number;
  customerPaid: number;
};

type MarkupRule = {
  type: "percent" | "flat";
  value: number;
  cap?: number;
};

type PricingProduct = "flights" | "hotels" | "taxi";

type AgentConfigResponse = {
  markup?: Partial<Record<PricingProduct, MarkupRule>>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

function applyMarkup(fare: number, rule: MarkupRule): number {
  const raw =
    rule.type === "percent"
      ? Math.round(fare * (1 + rule.value / 100))
      : fare + rule.value;
  if (rule.cap != null && rule.cap > 0) return Math.min(raw, fare + rule.cap);
  return raw;
}

/** Fetches the agent's markup rule for a product from the Express cache. */
async function getAgentMarkup(
  product: PricingProduct,
  slug: string,
): Promise<MarkupRule | null> {
  try {
    const res = await fetch(
      new URL(`/api/internal/agent-config?slug=${encodeURIComponent(slug)}`, API_BASE),
      { cache: "no-store", headers: { accept: "application/json" } },
    );
    if (!res.ok) return null;
    const payload = (await res.json()) as AgentConfigResponse;
    return payload.markup?.[product] ?? null;
  } catch {
    return null;
  }
}

const passthrough = (fare: number): number => fare;

/**
 * Returns a synchronous pricer for the current request:
 *   - Subdomain (x-agent-slug present): TBO fare + agent markup
 *   - Apex / agent portal / anonymous:  TBO fare unchanged
 */
export async function buildFarePricer(
  product: PricingProduct,
  request: Request,
): Promise<(fare: number) => number> {
  const slug = request.headers.get("x-agent-slug")?.trim();
  if (!slug) return passthrough;

  const rule = await getAgentMarkup(product, slug);
  return rule ? (fare) => applyMarkup(fare, rule) : passthrough;
}

/**
 * Returns the full pricing breakdown for a subdomain booking record.
 * Returns null when not a subdomain request.
 * platformMarkup is always 0 — stored as 0 for settlement schema compatibility.
 */
export async function buildTwoTierPricing(
  tboFare: number,
  product: PricingProduct,
  request: Request,
): Promise<TwoTierPricing | null> {
  const slug = request.headers.get("x-agent-slug")?.trim();
  if (!slug) return null;

  const rule = await getAgentMarkup(product, slug);
  const customerPaid = rule ? applyMarkup(tboFare, rule) : tboFare;

  return {
    tboFare,
    platformMarkup: 0,
    agentNetRate:   tboFare,
    agentMarkup:    customerPaid - tboFare,
    customerPaid,
  };
}

// Re-export types used by call-sites in agentClient and superadmin.
export type { MarkupRule as AgentMarkupRule };
