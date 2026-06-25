// IRCTC hand-off helpers.
//
// We do not hold an official IRCTC B2B ticketing contract, so actual booking must
// happen on IRCTC's own site. IRCTC's booking SPA (NGET) authenticates per-session
// and does NOT support deep links that pre-fill origin/destination/date — any such
// params are dropped and the user lands on the search page. So the most reliable,
// honest hand-off is to open the IRCTC train-search page in a new tab. We still pass
// the journey context where a public surface accepts it (the "trains between
// stations" enquiry page) and otherwise just deep-link to the booking entry point.

export const IRCTC_TRAIN_SEARCH = "https://www.irctc.co.in/nget/train-search";

export type IrctcJourney = {
  fromCode?: string;
  toCode?: string;
  date?: string; // YYYY-MM-DD
  trainNo?: string;
};

/**
 * Best-effort URL for booking on IRCTC. Returns the booking entry point; journey
 * context is appended as a hash so we can prefill our own confirm screen on return,
 * but IRCTC itself ignores it (documented above).
 */
export function buildIrctcBookingUrl(journey: IrctcJourney = {}): string {
  const parts: string[] = [];
  if (journey.fromCode) parts.push(`from=${encodeURIComponent(journey.fromCode)}`);
  if (journey.toCode) parts.push(`to=${encodeURIComponent(journey.toCode)}`);
  if (journey.date) parts.push(`date=${encodeURIComponent(journey.date)}`);
  if (journey.trainNo) parts.push(`train=${encodeURIComponent(journey.trainNo)}`);
  return parts.length ? `${IRCTC_TRAIN_SEARCH}#${parts.join("&")}` : IRCTC_TRAIN_SEARCH;
}

/** Opens IRCTC booking in a new, privacy-safe tab. */
export function openIrctcBooking(journey: IrctcJourney = {}): void {
  if (typeof window === "undefined") return;
  window.open(buildIrctcBookingUrl(journey), "_blank", "noopener,noreferrer");
}
