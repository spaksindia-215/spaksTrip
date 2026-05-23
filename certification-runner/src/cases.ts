import { CaseConfig, PassengerSpec, RoomSpec } from "./types";
import { config } from "./config";

// ─── Passenger Templates ──────────────────────────────────────────────────────

const adult = (firstName: string, lastName: string, lead = false): PassengerSpec => ({
  title: "Mr",
  firstName,
  lastName,
  paxType: 1,
  leadPassenger: lead,
  age: 30,
});

const adultF = (firstName: string, lastName: string, lead = false): PassengerSpec => ({
  title: "Mrs",
  firstName,
  lastName,
  paxType: 1,
  leadPassenger: lead,
  age: 28,
});

const child = (firstName: string, age: number): PassengerSpec => ({
  title: "Mstr",
  firstName,
  lastName: "Smith",
  paxType: 2,
  leadPassenger: false,
  age,
});

// ─── Room Builders ────────────────────────────────────────────────────────────

function singleAdultRoom(lead = true): RoomSpec {
  return {
    adults: 1,
    children: 0,
    childAges: [],
    passengers: [adult("John", "Smith", lead)],
  };
}

function doubleAdultWithChildrenRoom(lead = true): RoomSpec {
  return {
    adults: 2,
    children: 2,
    childAges: [5, 8],
    passengers: [
      adult("John", "Smith", lead),
      adultF("Jane", "Smith"),
      child("Tom", 8),
      child("Lucy", 5),
    ],
  };
}

function mixedFamilyRoom1(lead = true): RoomSpec {
  // Room 1: 1 Adult + 2 Children
  return {
    adults: 1,
    children: 2,
    childAges: [6, 9],
    passengers: [
      adult("Robert", "Johnson", lead),
      child("Emma", 9),
      child("Liam", 6),
    ],
  };
}

function mixedFamilyRoom2(): RoomSpec {
  // Room 2: 2 Adults
  return {
    adults: 2,
    children: 0,
    childAges: [],
    passengers: [
      adultF("Sarah", "Johnson", true),
      adult("Michael", "Johnson"),
    ],
  };
}

// ─── The 8 Certification Cases ────────────────────────────────────────────────

export const CERTIFICATION_CASES: CaseConfig[] = [
  // ── Domestic Cases ──────────────────────────────────────────────────────────
  {
    caseNumber: 1,
    name: "Case 1 - Domestic (Room 1: Adult 1)",
    description: "Domestic Booking — 1 Room, 1 Adult",
    cityCode: config.domesticCityCode,
    guestNationality: "IN",
    isInternational: false,
    rooms: [singleAdultRoom(true)],
  },
  {
    caseNumber: 2,
    name: "Case 2 - Domestic (Room 1: Adult 2, Child 2)",
    description: "Domestic Booking — 1 Room, 2 Adults, 2 Children",
    cityCode: config.domesticChildrenCityCode,
    guestNationality: "IN",
    isInternational: false,
    rooms: [doubleAdultWithChildrenRoom(true)],
  },
  {
    caseNumber: 3,
    name: "Case 3 - Domestic (Room 1: Adult 1) (Room 2: Adult 1)",
    description: "Domestic Booking — 2 Rooms, 1 Adult each",
    cityCode: config.domesticCityCode,
    guestNationality: "IN",
    isInternational: false,
    rooms: [singleAdultRoom(true), singleAdultRoom(true)],
  },
  {
    caseNumber: 4,
    name: "Case 4 - Domestic (Room 1: Adult 1, Child 2) (Room 2: Adult 2)",
    description: "Domestic Booking — 2 Rooms, Mixed Family",
    cityCode: config.domesticChildrenCityCode,
    guestNationality: "IN",
    isInternational: false,
    rooms: [mixedFamilyRoom1(true), mixedFamilyRoom2()],
  },

  // ── International Cases ─────────────────────────────────────────────────────
  {
    caseNumber: 5,
    name: "Case 5 - International (Room 1: Adult 1)",
    description: "International Booking — 1 Room, 1 Adult",
    cityCode: config.internationalCityCode,
    guestNationality: "IN",
    isInternational: true,
    rooms: [singleAdultRoom(true)],
  },
  {
    caseNumber: 6,
    name: "Case 6 - International (Room 1: Adult 2, Child 2)",
    description: "International Booking — 1 Room, 2 Adults, 2 Children",
    cityCode: config.internationalChildrenCityCode,
    guestNationality: "IN",
    isInternational: true,
    rooms: [doubleAdultWithChildrenRoom(true)],
  },
  {
    caseNumber: 7,
    name: "Case 7 - International (Room 1: Adult 1) (Room 2: Adult 1)",
    description: "International Booking — 2 Rooms, 1 Adult each",
    cityCode: config.internationalCityCode,
    guestNationality: "IN",
    isInternational: true,
    rooms: [singleAdultRoom(true), singleAdultRoom(true)],
  },
  {
    caseNumber: 8,
    name: "Case 8 - International (Room 1: Adult 1, Child 2) (Room 2: Adult 2)",
    description: "International Booking — 2 Rooms, Mixed Family",
    cityCode: config.internationalChildrenCityCode,
    guestNationality: "IN",
    isInternational: true,
    rooms: [mixedFamilyRoom1(true), mixedFamilyRoom2()],
  },
];
