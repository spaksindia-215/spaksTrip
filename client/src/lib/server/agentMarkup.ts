type MarkupRule = {
  type: "percent" | "flat";
  value: number;
  cap?: number;
};

export type TwoTierPricing = {
  tboFare: number;
  platformMarkup: number;
  agentNetRate: number;
  agentMarkup: number;
  customerPaid: number;
};

type PricingProduct = "flights" | "hotels" | "taxi";

type PlatformConfigResponse = {
  markup: Record<PricingProduct, MarkupRule>;
};

type AgentConfigResponse = {
  markup?: Partial<Record<PricingProduct, MarkupRule>>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
const DEFAULT_MARKUP_RULE: MarkupRule = { type: "percent", value: 0 };

function applyMarkup(netFare: number, rule: MarkupRule): number {
  const raw =
    rule.type === "percent"
      ? Math.round(netFare * (1 + rule.value / 100))
      : netFare + rule.value;

  if (rule.cap != null && rule.cap > 0) {
    return Math.min(raw, netFare + rule.cap);
  }

  return raw;
}

function applyPlatformMarkup(tboFare: number, platformRule: MarkupRule): number {
  return applyMarkup(tboFare, platformRule);
}

function applyTwoTierMarkup(
  tboFare: number,
  platformRule: MarkupRule,
  agentRule: MarkupRule,
): TwoTierPricing {
  const agentNetRate = applyMarkup(tboFare, platformRule);
  const customerPaid = applyMarkup(agentNetRate, agentRule);

  return {
    tboFare,
    platformMarkup: agentNetRate - tboFare,
    agentNetRate,
    agentMarkup: customerPaid - agentNetRate,
    customerPaid,
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(new URL(path, API_BASE), {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to load pricing config from ${path}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function getPlatformMarkup(product: PricingProduct): Promise<MarkupRule> {
  try {
    const payload = await fetchJson<PlatformConfigResponse>("/api/internal/platform-config");
    return payload.markup[product] ?? DEFAULT_MARKUP_RULE;
  } catch (error) {
    console.warn(
      `[pricing] falling back to default platform markup for ${product}:`,
      error instanceof Error ? error.message : String(error),
    );
    return DEFAULT_MARKUP_RULE;
  }
}

async function getAgentMarkup(product: PricingProduct, request: Request): Promise<MarkupRule | null> {
  const slug = request.headers.get("x-agent-slug")?.trim();
  if (!slug) return null;

  try {
    const payload = await fetchJson<AgentConfigResponse>(
      `/api/internal/agent-config?slug=${encodeURIComponent(slug)}`,
    );
    return payload.markup?.[product] ?? null;
  } catch (error) {
    console.warn(
      `[pricing] unable to load agent markup for ${slug}, using platform-only pricing:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export async function buildFarePricer(
  product: PricingProduct,
  request: Request,
): Promise<(netFare: number) => number> {
  const platformRule = await getPlatformMarkup(product);
  const agentRule = await getAgentMarkup(product, request);

  return (netFare: number) => {
    const platformFare = applyPlatformMarkup(netFare, platformRule);
    return agentRule ? applyMarkup(platformFare, agentRule) : platformFare;
  };
}

export async function buildTwoTierPricing(
  tboFare: number,
  product: PricingProduct,
  request: Request,
): Promise<TwoTierPricing | null> {
  const platformRule = await getPlatformMarkup(product);
  const agentRule = await getAgentMarkup(product, request);

  if (!agentRule) {
    const agentNetRate = applyPlatformMarkup(tboFare, platformRule);
    return {
      tboFare,
      platformMarkup: agentNetRate - tboFare,
      agentNetRate,
      agentMarkup: 0,
      customerPaid: agentNetRate,
    };
  }

  return applyTwoTierMarkup(tboFare, platformRule, agentRule);
}
