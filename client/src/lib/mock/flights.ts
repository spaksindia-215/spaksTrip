import { AIRLINES, getAirline } from "./airlines";
import { getAirport } from "./airports";
import { mulberry32, rngInt, rngPick, seedFromString } from "./rng";

export type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export type FareFamily = {
  id: string;
  name: string;       // e.g. "Saver", "Flex", "Business Lite"
  baggageCabin: number; // kg
  baggageCheckin: number; // kg
  refundable: boolean;
  changeable: boolean;
  mealIncluded: boolean;
  seatSelection: "free" | "paid" | "none";
  priceDelta: number; // added to base price
};

export type FlightSegment = {
  id: string;
  airlineCode: string;
  flightNumber: string;
  aircraft: string;
  from: string;     // IATA
  to: string;       // IATA
  depart: string;   // ISO
  arrive: string;   // ISO
  durationMin: number;
  fromTerminal?: string;
  toTerminal?: string;
};

export type FlightOffer = {
  id: string;
  segments: FlightSegment[];     // 1 = direct; 2+ = with stops
  stops: number;
  totalDurationMin: number;
  basePrice: number;
  currency: "INR";
  cabin: CabinClass;
  seatsLeft: number;
  fareFamilies: FareFamily[];
  refundable: boolean;
  baggage: { cabin: number; checkin: number };
  /** Present for domestic return: the inbound leg's TBO ResultIndex.
   *  When set, booking must call Book/Ticket for OB then IB separately (dual-PNR). */
  returnResultIndex?: string;
  /** Inbound leg segments — populated alongside returnResultIndex. */
  returnSegments?: FlightSegment[];
};

const AIRCRAFT = ["A320neo", "A321", "B737-800", "B737 MAX", "A350-900", "B777-300ER", "A380", "ATR-72"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function addMinutes(iso: string, min: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + min);
  return d.toISOString();
}

function formatIso(y: number, mo: number, d: number, h: number, mi: number) {
  return `${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(mi)}:00.000Z`;
}

function distanceEstimate(from: string, to: string) {
  // crude but stable: based on region pairs
  const a = getAirport(from);
  const b = getAirport(to);
  if (!a || !b) return { min: 120, max: 240 };
  if (a.countryCode === b.countryCode) return { min: 60, max: 190 };
  if (a.tz.startsWith("Asia") && b.tz.startsWith("Asia")) return { min: 180, max: 420 };
  if (a.tz.startsWith("Europe") || b.tz.startsWith("Europe")) return { min: 360, max: 640 };
  if (a.tz.startsWith("America") || b.tz.startsWith("America")) return { min: 600, max: 960 };
  if (a.tz.startsWith("Australia") || b.tz.startsWith("Australia")) return { min: 480, max: 780 };
  return { min: 240, max: 480 };
}

function basePriceFor(durationMin: number, cabin: CabinClass, stops: number) {
  const perMin = cabin === "FIRST" ? 58 : cabin === "BUSINESS" ? 34 : cabin === "PREMIUM_ECONOMY" ? 18 : 11;
  const base = Math.round(durationMin * perMin + 2300);
  const stopDiscount = stops === 0 ? 1.12 : stops === 1 ? 1.0 : 0.9;
  return Math.round(base * stopDiscount);
}

function buildFareFamilies(base: number, cabin: CabinClass): FareFamily[] {
  const isBus = cabin === "BUSINESS" || cabin === "FIRST";
  if (isBus) {
    return [
      { id: "biz-lite",  name: "Business Lite",    baggageCabin: 12, baggageCheckin: 40, refundable: false, changeable: true,  mealIncluded: true, seatSelection: "free", priceDelta: 0 },
      { id: "biz-flex",  name: "Business Flex",    baggageCabin: 12, baggageCheckin: 50, refundable: true,  changeable: true,  mealIncluded: true, seatSelection: "free", priceDelta: Math.round(base * 0.18) },
    ];
  }
  return [
    { id: "saver",  name: "Saver",         baggageCabin: 7, baggageCheckin: 15, refundable: false, changeable: false, mealIncluded: false, seatSelection: "paid", priceDelta: 0 },
    { id: "value",  name: "Value",         baggageCabin: 7, baggageCheckin: 25, refundable: false, changeable: true,  mealIncluded: true,  seatSelection: "paid", priceDelta: Math.round(base * 0.14) },
    { id: "flex",   name: "Flex",          baggageCabin: 7, baggageCheckin: 30, refundable: true,  changeable: true,  mealIncluded: true,  seatSelection: "free", priceDelta: Math.round(base * 0.28) },
  ];
}

export type FlightSearchInput = {
  from: string;
  to: string;
  date: string;          // YYYY-MM-DD
  cabin: CabinClass;
  adults: number;
  children: number;
  infants: number;
  directOnly?: boolean;
};

export function generateFlights(input: FlightSearchInput): FlightOffer[] {
  const seedKey = `${input.from}-${input.to}-${input.date}-${input.cabin}`;
  const rng = mulberry32(seedFromString(seedKey));
  const origin = getAirport(input.from);
  const dest = getAirport(input.to);
  if (!origin || !dest) return [];

  const dist = distanceEstimate(input.from, input.to);
  const count = rngInt(rng, 14, 28);
  const [yy, mm, dd] = input.date.split("-").map(Number);

  const offers: FlightOffer[] = [];
  for (let i = 0; i < count; i++) {
    const airline = rngPick(rng, AIRLINES);
    const stops = input.directOnly ? 0 : rng() < 0.58 ? 0 : rng() < 0.85 ? 1 : 2;

    const hour = rngInt(rng, 4, 23);
    const minute = rngPick(rng, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const departIso = formatIso(yy, mm - 1, dd, hour, minute);

    const segCount = stops + 1;
    const segs: FlightSegment[] = [];
    let currentFrom = input.from;
    let currentDepart = departIso;
    const totalLegTime = rngInt(rng, dist.min, dist.max);
    const perLeg = Math.floor(totalLegTime / segCount);

    for (let s = 0; s < segCount; s++) {
      const legTo = s === segCount - 1 ? input.to : rngPick(rng, ["DXB", "DOH", "BLR", "BOM", "DEL", "SIN", "KUL", "IST"]);
      const segDuration = perLeg + rngInt(rng, -15, 25);
      const arriveIso = addMinutes(currentDepart, segDuration);
      segs.push({
        id: `${airline.code}-${i}-${s}`,
        airlineCode: airline.code,
        flightNumber: `${airline.code} ${rngInt(rng, 100, 9999)}`,
        aircraft: rngPick(rng, AIRCRAFT),
        from: currentFrom,
        to: legTo,
        depart: currentDepart,
        arrive: arriveIso,
        durationMin: segDuration,
        fromTerminal: `T${rngInt(rng, 1, 3)}`,
        toTerminal: `T${rngInt(rng, 1, 3)}`,
      });
      if (s < segCount - 1) {
        const layover = rngInt(rng, 55, 230);
        currentFrom = legTo;
        currentDepart = addMinutes(arriveIso, layover);
      }
    }

    const totalDurationMin =
      (new Date(segs[segs.length - 1].arrive).getTime() - new Date(segs[0].depart).getTime()) / 60000;

    const base = basePriceFor(totalDurationMin, input.cabin, stops);
    const refundable = rng() < 0.25;
    offers.push({
      id: `${seedKey}-${i}-${airline.code}`,
      segments: segs,
      stops,
      totalDurationMin,
      basePrice: base,
      currency: "INR",
      cabin: input.cabin,
      seatsLeft: rngInt(rng, 1, 9),
      fareFamilies: buildFareFamilies(base, input.cabin),
      refundable,
      baggage: {
        cabin: input.cabin === "ECONOMY" ? 7 : 10,
        checkin: input.cabin === "ECONOMY" ? 15 : input.cabin === "BUSINESS" ? 40 : input.cabin === "FIRST" ? 50 : 25,
      },
    });
  }
  return offers;
}

export function getFlightById(id: string): FlightOffer | null {
  // id embeds seed key → regenerate → find
  const parts = id.split("-");
  if (parts.length < 5) return null;
  // format: FROM-TO-DATE-CABIN-index-airline
  const [from, to, date, cabin] = parts;
  const offers = generateFlights({
    from,
    to,
    date,
    cabin: cabin as CabinClass,
    adults: 1,
    children: 0,
    infants: 0,
  });
  return offers.find((o) => o.id === id) ?? null;
}

export function airlineName(code: string) {
  return getAirline(code)?.name ?? code;
}
