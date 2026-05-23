# TBO Hotel API Certification Runner

Automated certification test runner for all 8 TBO Hotel API test cases.

## Prerequisites

```
Node.js >= 20.9.0
```

## Setup

```bash
cd certification-runner
npm install
```

Credentials are loaded automatically from `../client/.env.local`. Required variables:

```env
TBO_HOLIDAYS_USER_NAME=Spaks
TBO_HOLIDAYS_PASSWORD=Spaks@123
TBO_HOLIDAYS_STATIC_USER_NAME=TBOStaticAPITest
TBO_HOLIDAYS_STATIC_PASSWORD=Tbo@11530818
TBO_END_USER_IP=1.1.1.1
```

Optional — set your own city codes (find them via TBO CityList API):

```env
DOMESTIC_CITY_CODE=130443
INTERNATIONAL_CITY_CODE=130264
```

## Usage

```bash
# Run all 8 cases
npm start

# Run specific cases
npx ts-node src/index.ts --case 1,2,3

# Stop on first failure
npx ts-node src/index.ts --stop

# Run only international cases
npx ts-node src/index.ts --case 5,6,7,8
```

## Output

Each case saves to `../certification-output/case-X/`:

```
case-1/
  search-request.json
  search-response.json
  prebook-request.json
  prebook-response.json
  booking-request.json
  booking-response.json
  voucher-request.json
  voucher-response.json
  booking-detail-response.json
  summary.txt

master-summary.txt   ← overall pass/fail report
```

## Certification Cases

| Case | Type | Rooms | Config |
|------|------|-------|--------|
| 1 | Domestic | 1 | 1 Adult |
| 2 | Domestic | 1 | 2 Adults + 2 Children |
| 3 | Domestic | 2 | 1 Adult each |
| 4 | Domestic | 2 | Room1: 1A+2C, Room2: 2A |
| 5 | International | 1 | 1 Adult |
| 6 | International | 1 | 2 Adults + 2 Children |
| 7 | International | 2 | 1 Adult each |
| 8 | International | 2 | Room1: 1A+2C, Room2: 2A |

## Postman Collection

Import `../Hotel_Api_Info/TBO_Hotel_Certification.postman_collection.json` into Postman.

**Before running:**
1. Set `agencyUsername` and `agencyPassword` collection variables
2. Set `domesticCityCode` and `internationalCityCode` to valid TBO city codes
3. Use **Collection Runner** → Run all in order → 48 requests total

The collection auto-computes dates, builds Basic Auth, chains BookingCodes between steps, and validates all responses.
