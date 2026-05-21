import { mulberry32, rngInt, rngPick, seedFromString } from "./rng";

export type Amenity =
  | "wifi" | "pool" | "gym" | "spa" | "restaurant" | "bar"
  | "parking" | "ac" | "breakfast" | "pet_friendly"
  | "business_center" | "airport_shuttle" | "beach_access" | "rooftop";

export type City = {
  code: string;
  name: string;
  country: string;
};

export const CITIES: City[] = [
  { code: "DEL", name: "New Delhi", country: "India" },
  { code: "BOM", name: "Mumbai", country: "India" },
  { code: "BLR", name: "Bangalore", country: "India" },
  { code: "GOI", name: "Goa", country: "India" },
  { code: "JAI", name: "Jaipur", country: "India" },
  { code: "CCU", name: "Kolkata", country: "India" },
  { code: "HYD", name: "Hyderabad", country: "India" },
  { code: "COK", name: "Kochi", country: "India" },
  { code: "SHL", name: "Shimla", country: "India" },
  { code: "MNL", name: "Manali", country: "India" },
  { code: "UDR", name: "Udaipur", country: "India" },
  { code: "AGR", name: "Agra", country: "India" },
  { code: "DXB", name: "Dubai", country: "UAE" },
  { code: "AUH", name: "Abu Dhabi", country: "UAE" },
  { code: "SIN", name: "Singapore", country: "Singapore" },
  { code: "BKK", name: "Bangkok", country: "Thailand" },
  { code: "KUL", name: "Kuala Lumpur", country: "Malaysia" },
  { code: "CMB", name: "Colombo", country: "Sri Lanka" },
  { code: "KTM", name: "Kathmandu", country: "Nepal" },
  { code: "CDG", name: "Paris", country: "France" },
  { code: "LHR", name: "London", country: "United Kingdom" },
  { code: "JFK", name: "New York", country: "USA" },
  { code: "LAX", name: "Los Angeles", country: "USA" },
  { code: "SYD", name: "Sydney", country: "Australia" },
  { code: "NRT", name: "Tokyo", country: "Japan" },
  { code: "ICN", name: "Seoul", country: "South Korea" },
  { code: "HKG", name: "Hong Kong", country: "China" },
  { code: "FCO", name: "Rome", country: "Italy" },
  { code: "BCN", name: "Barcelona", country: "Spain" },
  { code: "IST", name: "Istanbul", country: "Turkey" },
];

export function searchCities(q: string): City[] {
  const lq = q.toLowerCase();
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(lq) ||
      c.code.toLowerCase().includes(lq) ||
      c.country.toLowerCase().includes(lq),
  ).slice(0, 8);
}

export type CancelPolicy = {
  index: string;
  fromDate: string;
  chargeType: string;
  cancellationCharge: number;
};

export type Room = {
  id: string;
  name: string;
  type: "standard" | "deluxe" | "suite" | "villa";
  maxOccupancy: number;
  bedType: "single" | "double" | "twin" | "king" | "queen";
  sizeSqm: number;
  basePrice: number;
  amenities: Amenity[];
  refundable: boolean;
  breakfast: boolean;
  seatsLeft: number;
  // TBO-specific fields from Search response
  totalFare?: number;
  totalTax?: number;
  nightlyRate?: number;
  cancelPolicies?: CancelPolicy[];
  roomPromotion?: string[];
  roomId?: string[];
  mealType?: string;
};

export type HotelReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
};

export type Hotel = {
  id: string;
  name: string;
  chain?: string;
  starRating: 2 | 3 | 4 | 5;
  reviewScore: number;
  reviewCount: number;
  reviewLabel: string;
  city: string;
  country: string;
  address: string;
  images: string[];
  amenities: Amenity[];
  rooms: Room[];
  reviews: HotelReview[];
  lowestPrice: number;
  propertyType: "hotel" | "resort" | "boutique" | "budget" | "apartment";
  description?: string;
  attractions?: string[];
  phoneNumber?: string;
  faxNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
  latitude?: number;
  longitude?: number;
};

export type SearchFilters = {
  refundable?: boolean;
  mealType?: "All" | "WithMeal" | "RoomOnly" | null;
  noOfRooms?: number;
  starRating?: number | null;
};

export type HotelSearchInput = {
  cityCode: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  guestNationality?: string;
  isDetailedResponse?: boolean;
  filters?: SearchFilters;
};

const HOTEL_NAMES = [
  "The Grand", "Skyline Palace", "Royal Heritage", "Ocean Breeze", "Golden Tulip",
  "The Oberoi", "Taj Vivanta", "Radisson Blu", "Novotel", "Holiday Inn",
  "Hyatt Regency", "Marriott Executive", "Hilton Garden", "Le Meridien", "The Lalit",
  "ITC Maurya", "Crowne Plaza", "Four Points", "Ibis", "Lemon Tree",
  "Citadel Hotel", "The Elysian", "Pearl Continental", "Metro Suites", "Blue Bay Resort",
];

const CHAINS = ["Taj Group", "Oberoi Hotels", "Marriott", "Hilton", "Hyatt", "IHG", "Radisson", "Accor", undefined, undefined];

const PROPERTY_TYPES: Hotel["propertyType"][] = ["hotel", "resort", "boutique", "budget", "apartment"];

const REVIEW_LABELS: Record<string, string> = {
  "9": "Superb", "8": "Excellent", "7": "Very Good", "6": "Good", "5": "Okay",
};

function reviewLabel(score: number) {
  const key = String(Math.floor(score));
  return REVIEW_LABELS[key] ?? "Good";
}

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=70",
];

const ALL_AMENITIES: Amenity[] = [
  "wifi", "pool", "gym", "spa", "restaurant", "bar",
  "parking", "ac", "breakfast", "pet_friendly",
  "business_center", "airport_shuttle", "beach_access", "rooftop",
];

const ROOM_NAMES = {
  standard: ["Deluxe Room", "Standard Room", "Classic Room", "Comfort Room"],
  deluxe: ["Deluxe Room", "Superior Room", "Premium Room", "Deluxe Double"],
  suite: ["Junior Suite", "Executive Suite", "Premier Suite", "Panoramic Suite"],
  villa: ["Garden Villa", "Pool Villa", "Beachfront Villa", "Private Villa"],
};

const BED_TYPES: Room["bedType"][] = ["king", "queen", "double", "twin", "single"];

const REVIEW_TITLES = [
  "Absolutely loved the stay!", "Great location and service",
  "Comfortable and clean", "Would highly recommend", "Perfect business trip hotel",
  "Excellent amenities", "Felt right at home", "Stunning views",
  "Staff were super helpful", "Value for money",
];

const REVIEW_BODIES = [
  "The staff went above and beyond to make our stay special. Rooms were spotless and the breakfast was amazing.",
  "Location is perfect — close to all major attractions. The bed was incredibly comfortable.",
  "Clean rooms, friendly staff, and great facilities. Would definitely return on my next visit.",
  "The pool area is gorgeous and the spa treatments were top-notch. A truly relaxing experience.",
  "Excellent for business travellers. Fast WiFi, quiet rooms, and a great executive lounge.",
  "Loved the rooftop restaurant with panoramic views. Food quality was outstanding.",
  "Check-in was smooth and the room upgrade was a pleasant surprise. Great value overall.",
  "The suite was beautifully appointed with all modern amenities. Felt like royalty.",
];

const AUTHOR_NAMES = [
  "Priya S.", "Rahul M.", "Ananya K.", "Vikram T.", "Sunita R.",
  "James L.", "Sarah W.", "Mohammed A.", "Yuki T.", "Emily C.",
];

function buildRooms(rng: () => number, hotelId: string, stars: number): Room[] {
  const count = rngInt(rng, 2, 4);
  const baseNightPrice = stars === 2 ? 1200 : stars === 3 ? 2500 : stars === 4 ? 5500 : 12000;
  const rooms: Room[] = [];

  const types: Room["type"][] = stars >= 4
    ? ["deluxe", "suite", "villa"]
    : stars === 3
    ? ["standard", "deluxe", "suite"]
    : ["standard", "deluxe"];

  for (let i = 0; i < count; i++) {
    const type = rngPick(rng, types.slice(0, Math.min(i + 1, types.length)));
    const multiplier = type === "villa" ? 4 : type === "suite" ? 2.5 : type === "deluxe" ? 1.5 : 1;
    const price = Math.round(baseNightPrice * multiplier * (0.8 + rng() * 0.4));
    const bedType = rngPick(rng, BED_TYPES);
    const roomAmenities: Amenity[] = ["wifi", "ac"];
    if (stars >= 3) roomAmenities.push("restaurant");
    if (rng() > 0.5) roomAmenities.push("breakfast");

    rooms.push({
      id: `${hotelId}-r${i}`,
      name: rngPick(rng, ROOM_NAMES[type]),
      type,
      maxOccupancy: type === "villa" ? 4 : type === "suite" ? 3 : 2,
      bedType,
      sizeSqm: type === "villa" ? rngInt(rng, 80, 200) : type === "suite" ? rngInt(rng, 50, 90) : rngInt(rng, 20, 45),
      basePrice: price,
      amenities: roomAmenities,
      refundable: rng() > 0.35,
      breakfast: roomAmenities.includes("breakfast"),
      seatsLeft: rngInt(rng, 1, 8),
    });
  }

  return rooms.sort((a, b) => a.basePrice - b.basePrice);
}

function buildReviews(rng: () => number, hotelId: string): HotelReview[] {
  const count = rngInt(rng, 3, 6);
  const reviews: HotelReview[] = [];
  for (let i = 0; i < count; i++) {
    const rating = rngInt(rng, 3, 5) + rng() * 0.9;
    reviews.push({
      id: `${hotelId}-rev${i}`,
      author: rngPick(rng, AUTHOR_NAMES),
      rating: Math.round(rating * 10) / 10,
      date: new Date(Date.now() - rngInt(rng, 7, 365) * 86400000).toISOString().slice(0, 10),
      title: rngPick(rng, REVIEW_TITLES),
      body: rngPick(rng, REVIEW_BODIES),
      verified: rng() > 0.2,
    });
  }
  return reviews;
}

function buildHotel(rng: () => number, cityCode: string, index: number): Hotel {
  const city = CITIES.find((c) => c.code === cityCode) ?? CITIES[0];
  const stars = rngPick(rng, [2, 3, 3, 4, 4, 5] as const);
  const reviewScore = +(5 + rng() * 4.8).toFixed(1);
  const reviewCount = rngInt(rng, 45, 3200);
  const amenityCount = rngInt(rng, 4, 10);
  const amenities: Amenity[] = rngPick(rng, [ALL_AMENITIES]) as unknown as Amenity[];
  // pick amenityCount distinct amenities
  const shuffled = [...ALL_AMENITIES].sort(() => rng() - 0.5).slice(0, amenityCount) as Amenity[];
  if (!shuffled.includes("wifi")) shuffled[0] = "wifi";
  if (!shuffled.includes("ac")) shuffled[1] = "ac";

  const id = `HTL-${cityCode}-${index}`;
  const rooms = buildRooms(rng, id, stars);
  const lowestPrice = rooms[0]?.basePrice ?? 2000;

  return {
    id,
    name: rngPick(rng, HOTEL_NAMES),
    chain: rngPick(rng, CHAINS as readonly (string | undefined)[]) as string | undefined,
    starRating: stars,
    reviewScore,
    reviewCount,
    reviewLabel: reviewLabel(reviewScore),
    city: city.name,
    country: city.country,
    address: `${rngInt(rng, 1, 200)} ${rngPick(rng, ["MG Road", "Park Street", "Marine Drive", "Civil Lines", "Connaught Place", "Koregaon Park"])}, ${city.name}`,
    images: Array.from({ length: 5 }, (_, i) => HOTEL_IMAGES[(index * 5 + i) % HOTEL_IMAGES.length]),
    amenities: shuffled,
    rooms,
    reviews: buildReviews(rng, id),
    lowestPrice,
    propertyType: rngPick(rng, PROPERTY_TYPES),
  };
  void amenities;
}

export function generateHotels(input: HotelSearchInput): Hotel[] {
  const seed = seedFromString(`${input.cityCode}-${input.checkIn}`);
  const rng = mulberry32(seed);
  const count = rngInt(rng, 12, 20);
  const hotels: Hotel[] = [];
  for (let i = 0; i < count; i++) {
    hotels.push(buildHotel(rng, input.cityCode, i));
  }
  return hotels;
}

export function getHotelById(id: string): Hotel | null {
  // id format: HTL-{cityCode}-{index}
  const parts = id.split("-");
  if (parts.length < 3 || parts[0] !== "HTL") return null;
  const cityCode = parts[1];
  const index = parseInt(parts[2], 10);
  if (isNaN(index)) return null;

  // Regenerate with a deterministic date (we don't encode date in ID for hotels,
  // so we use today's date as the seed base — only stable within same-day)
  const today = new Date().toISOString().slice(0, 10);
  const seed = seedFromString(`${cityCode}-${today}`);
  const rng = mulberry32(seed);
  const count = rngInt(rng, 12, 20);
  if (index >= count) return null;
  const hotels: Hotel[] = [];
  for (let i = 0; i <= index; i++) {
    hotels.push(buildHotel(rng, cityCode, i));
  }
  return hotels[index] ?? null;
}
