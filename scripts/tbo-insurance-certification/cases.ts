// Test Case Definitions - Per TBO Certification HTML

export interface TestCase {
  id: string;
  name: string;
  tripType: "domestic" | "non-us" | "us-canada";
  planCategory: 1 | 2; // 1=Domestic, 2=Overseas
  planCoverage: 4; // For certification
  travellers: Array<{
    age: number;
  }>;
}

export const CERTIFICATION_CASES: TestCase[] = [
  {
    id: "case-1",
    name: "Domestic Trip - 1 Adult",
    tripType: "domestic",
    planCategory: 1,
    planCoverage: 4,
    travellers: [
      {
        age: 30,
      },
    ],
  },
  {
    id: "case-2",
    name: "Domestic Trip - 2 Adults (Age 0-40 and 41-70)",
    tripType: "domestic",
    planCategory: 1,
    planCoverage: 4,
    travellers: [
      {
        age: 30, // 0-40 range
      },
      {
        age: 55, // 41-70 range
      },
    ],
  },
  {
    id: "case-3",
    name: "Non-US Trip - 1 Adult",
    tripType: "non-us",
    planCategory: 2,
    planCoverage: 4,
    travellers: [
      {
        age: 35,
      },
    ],
  },
  {
    id: "case-4",
    name: "Non-US Trip - 2 Adults (Age 0-40 and 41-70)",
    tripType: "non-us",
    planCategory: 2,
    planCoverage: 4,
    travellers: [
      {
        age: 28, // 0-40 range
      },
      {
        age: 60, // 41-70 range
      },
    ],
  },
  {
    id: "case-5",
    name: "US/Canada Trip - 2 Adults (Age 0-40 and 41-70)",
    tripType: "us-canada",
    planCategory: 2,
    planCoverage: 4,
    travellers: [
      {
        age: 30, // 0-40 range
      },
      {
        age: 65, // 41-70 range
      },
    ],
  },
];

export function getCaseById(caseId: string): TestCase | undefined {
  return CERTIFICATION_CASES.find((c) => c.id === caseId);
}
