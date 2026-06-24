// RedBus hand-off helpers.
//
// We don't operate bus inventory ourselves, so bus booking is a hand-off to RedBus.
// Unlike IRCTC, RedBus DOES honour deep links: the canonical
// /bus-tickets/{from}-to-{to} slug route resolves the journey and the query params
// pre-select the route and date, so the user lands on real results.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type RedbusJourney = {
  source?: string;
  destination?: string;
  date?: string; // YYYY-MM-DD
};

function slug(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// RedBus expects the onward date as DD-Mon-YYYY (e.g. 25-Jun-2026).
function toRedbusDate(iso?: string): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month) return null;
  return `${d}-${month}-${y}`;
}

/** Best-effort RedBus search URL with the route + date pre-filled. */
export function buildRedbusSearchUrl(journey: RedbusJourney = {}): string {
  const { source, destination, date } = journey;
  if (!source || !destination) return "https://www.redbus.in";

  const base = `https://www.redbus.in/bus-tickets/${slug(source)}-to-${slug(destination)}`;
  const params = new URLSearchParams({
    fromCityName: source,
    toCityName: destination,
    srcCountry: "IND",
    destCountry: "IND",
  });
  const onward = toRedbusDate(date);
  if (onward) params.set("onward", onward);
  return `${base}?${params.toString()}`;
}

/** Opens RedBus search in a new, privacy-safe tab. */
export function openRedbusSearch(journey: RedbusJourney = {}): void {
  if (typeof window === "undefined") return;
  window.open(buildRedbusSearchUrl(journey), "_blank", "noopener,noreferrer");
}
