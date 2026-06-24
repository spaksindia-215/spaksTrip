import { mulberry32, rngInt, rngPick, seedFromString } from "./rng";

export type TrainClass = "SL" | "3A" | "2A" | "1A" | "CC" | "EC";
export type Quota = "GENERAL" | "TATKAL" | "LADIES";
export type AvailStatus = "AVAILABLE" | "RAC" | "GNWL" | "TQWL";

export type ClassAvail = {
  cls: TrainClass;
  fare: number;
  status: AvailStatus;
  count: number; // seats or WL#
};

export type Stop = {
  code: string;
  station: string;
  day: number;
  arrive: string | null; // HH:MM
  depart: string | null;
  halt: number; // minutes (0 = origin/destination)
  distance: number; // km from origin
  platform: number;
};

export type TrainType = "rajdhani" | "shatabdi" | "duronto" | "superfast" | "express" | "jan-shatabdi" | "garib-rath";

export type Train = {
  id: string; // "{number}-{fromCode}-{toCode}-{date}"
  number: string;
  name: string;
  type: TrainType;
  fromCode: string;
  toCode: string;
  fromStation: string;
  toStation: string;
  departs: string; // HH:MM
  arrives: string; // HH:MM
  durationMin: number;
  distance: number;
  classes: ClassAvail[];
  stops: Stop[];
  runsOn: string[]; // e.g. ["Mon","Thu","Sat"]
  pantry: boolean;
};

export type Station = {
  code: string;
  name: string;
  city: string;
  state: string;
};

export type TrainSearchInput = {
  fromCode: string;
  toCode: string;
  date: string; // YYYY-MM-DD
  quota?: Quota;
};

// ─── Station master ───────────────────────────────────────────────────────────
export const STATIONS: Station[] = [
  { code: "NDLS", name: "New Delhi", city: "New Delhi", state: "Delhi" },
  { code: "DLI",  name: "Old Delhi", city: "Delhi", state: "Delhi" },
  { code: "NZM",  name: "Hazrat Nizamuddin", city: "Delhi", state: "Delhi" },
  { code: "CSTM", name: "Mumbai CST", city: "Mumbai", state: "Maharashtra" },
  { code: "BCT",  name: "Mumbai Central", city: "Mumbai", state: "Maharashtra" },
  { code: "MAS",  name: "Chennai Central", city: "Chennai", state: "Tamil Nadu" },
  { code: "HWH",  name: "Howrah Junction", city: "Kolkata", state: "West Bengal" },
  { code: "PUNE", name: "Pune Junction", city: "Pune", state: "Maharashtra" },
  { code: "ADI",  name: "Ahmedabad Junction", city: "Ahmedabad", state: "Gujarat" },
  { code: "JP",   name: "Jaipur Junction", city: "Jaipur", state: "Rajasthan" },
  { code: "LKO",  name: "Lucknow Charbagh", city: "Lucknow", state: "Uttar Pradesh" },
  { code: "CNB",  name: "Kanpur Central", city: "Kanpur", state: "Uttar Pradesh" },
  { code: "PRYJ", name: "Prayagraj Junction", city: "Prayagraj", state: "Uttar Pradesh" },
  { code: "BBS",  name: "Bhubaneswar", city: "Bhubaneswar", state: "Odisha" },
  { code: "BPL",  name: "Bhopal Junction", city: "Bhopal", state: "Madhya Pradesh" },
  { code: "NGP",  name: "Nagpur Junction", city: "Nagpur", state: "Maharashtra" },
  { code: "SC",   name: "Secunderabad Junction", city: "Hyderabad", state: "Telangana" },
  { code: "VSKP", name: "Visakhapatnam", city: "Visakhapatnam", state: "Andhra Pradesh" },
  { code: "SBC",  name: "KSR Bengaluru City", city: "Bangalore", state: "Karnataka" },
  { code: "CBE",  name: "Coimbatore Junction", city: "Coimbatore", state: "Tamil Nadu" },
  { code: "TVC",  name: "Thiruvananthapuram Central", city: "Thiruvananthapuram", state: "Kerala" },
  { code: "ERS",  name: "Ernakulam Junction", city: "Kochi", state: "Kerala" },
  { code: "GHY",  name: "Guwahati", city: "Guwahati", state: "Assam" },
  { code: "PNBE", name: "Patna Junction", city: "Patna", state: "Bihar" },
  { code: "BSB",  name: "Varanasi Junction", city: "Varanasi", state: "Uttar Pradesh" },
  { code: "AGC",  name: "Agra Cantt", city: "Agra", state: "Uttar Pradesh" },
  { code: "MTJ",  name: "Mathura Junction", city: "Mathura", state: "Uttar Pradesh" },
  { code: "DDN",  name: "Dehradun", city: "Dehradun", state: "Uttarakhand" },
  { code: "CDG",  name: "Chandigarh Junction", city: "Chandigarh", state: "Punjab" },
  { code: "ASR",  name: "Amritsar Junction", city: "Amritsar", state: "Punjab" },
  { code: "JAT",  name: "Jammu Tawi", city: "Jammu", state: "Jammu & Kashmir" },
  { code: "UDZ",  name: "Udaipur City", city: "Udaipur", state: "Rajasthan" },
  { code: "JU",   name: "Jodhpur Junction", city: "Jodhpur", state: "Rajasthan" },
  { code: "BKN",  name: "Bikaner Junction", city: "Bikaner", state: "Rajasthan" },
  { code: "SUR",  name: "Surat", city: "Surat", state: "Gujarat" },
  { code: "BRC",  name: "Vadodara Junction", city: "Vadodara", state: "Gujarat" },
  { code: "RTM",  name: "Ratlam Junction", city: "Ratlam", state: "Madhya Pradesh" },
  { code: "MFP",  name: "Muzaffarpur Junction", city: "Muzaffarpur", state: "Bihar" },
  { code: "RNC",  name: "Ranchi", city: "Ranchi", state: "Jharkhand" },
  { code: "R",    name: "Raipur Junction", city: "Raipur", state: "Chhattisgarh" },
];

export function searchStations(q: string): Station[] {
  if (!q.trim()) return STATIONS.slice(0, 8);
  const lq = q.toLowerCase();
  return STATIONS.filter(
    (s) =>
      s.code.toLowerCase().includes(lq) ||
      s.name.toLowerCase().includes(lq) ||
      s.city.toLowerCase().includes(lq),
  ).slice(0, 10);
}

function getStation(code: string): Station {
  return STATIONS.find((s) => s.code === code) ?? { code, name: code, city: code, state: "" };
}

// ─── Train name templates ─────────────────────────────────────────────────────
const TRAIN_TEMPLATES: Record<TrainType, { prefix: string[]; numberBase: number }> = {
  rajdhani:       { prefix: ["RAJDHANI EXP", "RAJDHANI EXPRESS"], numberBase: 12000 },
  shatabdi:       { prefix: ["SHATABDI EXP", "SHATABDI EXPRESS"], numberBase: 12000 },
  duronto:        { prefix: ["DURONTO EXP", "DURONTO EXPRESS"], numberBase: 12200 },
  superfast:      { prefix: ["SUPERFAST EXP", "SF EXPRESS"], numberBase: 12400 },
  express:        { prefix: ["EXPRESS", "MAIL EXP", "LINK EXP"], numberBase: 11000 },
  "jan-shatabdi": { prefix: ["JAN SHATABDI", "JAN SHATABDI EXP"], numberBase: 12050 },
  "garib-rath":   { prefix: ["GARIB RATH EXP", "GARIB RATH"], numberBase: 12200 },
};

const CLASS_SET: Record<TrainType, TrainClass[][]> = {
  rajdhani:       [["1A","2A","3A"]],
  shatabdi:       [["EC","CC"]],
  duronto:        [["1A","2A","3A","SL"]],
  superfast:      [["SL","3A","2A","1A"], ["SL","3A","2A"]],
  express:        [["SL","3A","2A"], ["SL","3A"]],
  "jan-shatabdi": [["CC","SL"]],
  "garib-rath":   [["3A"]],
};

// Approximate fares per km
const FARE_PER_KM: Record<TrainClass, number> = {
  SL: 0.48, "3A": 1.25, "2A": 1.85, "1A": 3.10, CC: 1.05, EC: 1.75,
};

function computeFare(cls: TrainClass, distance: number, quota: Quota): number {
  const base = Math.round(FARE_PER_KM[cls] * distance / 5) * 5 + 50;
  const tatkal = quota === "TATKAL" ? Math.round(base * (cls === "SL" ? 0.30 : 0.50)) : 0;
  return base + tatkal;
}

const STATUSES: AvailStatus[] = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "RAC", "GNWL", "TQWL"];

function genAvail(rng: () => number, cls: TrainClass, distance: number, quota: Quota): ClassAvail {
  const status = rngPick(rng, STATUSES);
  const fare = computeFare(cls, distance, quota);
  const count =
    status === "AVAILABLE" ? rngInt(rng, 2, 120) :
    status === "RAC"       ? rngInt(rng, 1, 24)  :
    status === "GNWL"      ? rngInt(rng, 1, 80)  :
                             rngInt(rng, 1, 30);
  return { cls, fare, status, count };
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m: number): string {
  const total = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function dayOffset(departMin: number, arriveMin: number): number {
  return arriveMin < departMin ? 2 : 1;
}

// ─── Intermediate stop pools ─────────────────────────────────────────────────
const STOP_POOLS: string[] = [
  "MTJ","AGC","CNB","PRYJ","BSB","PNBE","BPL","NGP","SC","HWH","LKO",
  "BRC","SUR","RTM","ADI","JP","CDG","ASR","VSKP","BBS","R","RNC","MFP",
];

function genStops(
  rng: () => number,
  fromCode: string,
  toCode: string,
  departs: string,
  durationMin: number,
  distance: number,
): Stop[] {
  const stops: Stop[] = [];
  const count = rngInt(rng, 3, 7);
  const pool = STOP_POOLS.filter((c) => c !== fromCode && c !== toCode);

  const departMin = timeToMin(departs);
  const intervals = Array.from({ length: count }, () => rng());
  const totalWeight = intervals.reduce((a, b) => a + b, 0);
  let elapsed = 0;

  // Origin stop
  stops.push({
    code: fromCode,
    station: getStation(fromCode).name,
    day: 1,
    arrive: null,
    depart: departs,
    halt: 0,
    distance: 0,
    platform: rngInt(rng, 1, 6),
  });

  for (let i = 0; i < count; i++) {
    const frac = intervals[i] / totalWeight;
    elapsed += Math.round(frac * (durationMin - count * 2));
    const stopMin = departMin + elapsed;
    const code = rngPick(rng, pool);
    const dist = Math.round((elapsed / durationMin) * distance);
    const arrTime = minToTime(stopMin - 2);
    const depTime = minToTime(stopMin);
    stops.push({
      code,
      station: getStation(code).name,
      day: dayOffset(departMin, stopMin) === 2 ? (stopMin > 1440 ? 2 : 1) : 1,
      arrive: arrTime,
      depart: depTime,
      halt: 2,
      distance: dist,
      platform: rngInt(rng, 1, 6),
    });
  }

  const arrMin = departMin + durationMin;
  stops.push({
    code: toCode,
    station: getStation(toCode).name,
    day: arrMin >= 1440 ? 2 : 1,
    arrive: minToTime(arrMin),
    depart: null,
    halt: 0,
    distance,
    platform: rngInt(rng, 1, 6),
  });

  return stops;
}

// ─── Main generator ───────────────────────────────────────────────────────────
export function generateTrains(input: TrainSearchInput): Train[] {
  const { fromCode, toCode, date, quota = "GENERAL" } = input;
  const rng = mulberry32(seedFromString(`${fromCode}-${toCode}-${date}`));

  const count = rngInt(rng, 8, 14);
  const trains: Train[] = [];

  for (let i = 0; i < count; i++) {
    const types: TrainType[] = ["rajdhani","shatabdi","duronto","superfast","superfast","express","express","jan-shatabdi","garib-rath"];
    const type = rngPick(rng, types);
    const tpl = TRAIN_TEMPLATES[type];

    const number = String(tpl.numberBase + rngInt(rng, 1, 999)).padStart(5, "0");
    const nameSuffix = `${getStation(fromCode).city.toUpperCase().slice(0, 3)}-${getStation(toCode).city.toUpperCase().slice(0, 3)}`;
    const name = `${rngPick(rng, tpl.prefix)} ${nameSuffix}`;

    const durationMin = rngInt(rng, 90, 1440);
    const distance = Math.round(durationMin * rng() * 0.9 + 80);

    const departH = rngInt(rng, 0, 23);
    const departM = rngPick(rng, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const departs = `${String(departH).padStart(2, "0")}:${String(departM).padStart(2, "0")}`;

    const arrMin = timeToMin(departs) + durationMin;
    const arrives = minToTime(arrMin);

    const classSet = rngPick(rng, CLASS_SET[type]);
    const classes: ClassAvail[] = classSet.map((cls) => genAvail(rng, cls, distance, quota));

    const runsCount = rngInt(rng, 2, 7);
    const shuffledDays = [...DAYS].sort(() => rng() - 0.5).slice(0, runsCount);
    const runsOn = shuffledDays.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));

    const stops = genStops(rng, fromCode, toCode, departs, durationMin, distance);

    trains.push({
      id: `${number}-${fromCode}-${toCode}-${date}`,
      number,
      name,
      type,
      fromCode,
      toCode,
      fromStation: getStation(fromCode).name,
      toStation: getStation(toCode).name,
      departs,
      arrives,
      durationMin,
      distance,
      classes,
      stops,
      runsOn,
      pantry: type === "rajdhani" || type === "duronto" || rng() > 0.5,
    });
  }

  return trains.sort((a, b) => timeToMin(a.departs) - timeToMin(b.departs));
}

export function getTrainById(id: string): Train | null {
  const parts = id.split("-");
  if (parts.length < 4) return null;
  // id = number-fromCode-toCode-date  (date = YYYY-MM-DD = 3 parts)
  const number = parts[0];
  const fromCode = parts[1];
  const toCode = parts[2];
  const date = parts.slice(3).join("-");
  const trains = generateTrains({ fromCode, toCode, date });
  const match = trains.find((t) => t.number === number);
  if (match) return match;
  // Live "trains between stations" returns real train numbers that won't exist in
  // the deterministic mock set. Rather than dead-ending the in-app fare/detail
  // preview (real booking happens on IRCTC), surface a representative train for the
  // same route stamped with the requested number so the page still renders.
  const base = trains[0];
  return base ? { ...base, number, id } : null;
}
