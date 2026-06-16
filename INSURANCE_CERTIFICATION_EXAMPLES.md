# TBO Insurance Certification Runner - Output Examples

This document shows real examples of what the certification runner outputs.

---

## Console Output Example

### Running All 5 Cases

```
╔════════════════════════════════════════════════════════╗
║     TBO INSURANCE CERTIFICATION RUNNER - Starting...   ║
╚════════════════════════════════════════════════════════╝

Running 5 certification cases...

──────────────────────────────────────────────────────────
Running: Domestic Trip - 1 Adult
──────────────────────────────────────────────────────────
[2026-01-15T10:30:45.123Z] [INFO] case-1: Starting certification case
[2026-01-15T10:30:45.234Z] [INFO] case-1: Test case case-1 validation passed
[2026-01-15T10:30:45.345Z] [DEBUG] case-1: Authentication: Attempt 1/3
[2026-01-15T10:30:46.456Z] [INFO] case-1: ✓ Authentication successful
[2026-01-15T10:30:46.567Z] [INFO] case-1: Saved auth logs
[2026-01-15T10:30:48.678Z] [DEBUG] case-1: Search: Attempt 1/3
[2026-01-15T10:30:49.789Z] [INFO] case-1: Search returned 3 plan(s)
[2026-01-15T10:30:49.890Z] [INFO] case-1: Extracted TraceId: TRACE-ABC-123
[2026-01-15T10:30:49.890Z] [INFO] case-1: Extracted ResultIndex: 0
[2026-01-15T10:30:49.901Z] [INFO] case-1: Saved search logs
[2026-01-15T10:30:51.012Z] [DEBUG] case-1: Book: Attempt 1/3
[2026-01-15T10:30:52.123Z] [INFO] case-1: ✓ Book successful, BookingId: 98765
[2026-01-15T10:30:52.234Z] [INFO] case-1: Extracted BookingId: 98765
[2026-01-15T10:30:52.234Z] [INFO] case-1: Extracted ConfirmationNumber: REF-XYZ-789
[2026-01-15T10:30:52.345Z] [INFO] case-1: Saved book logs
[2026-01-15T10:30:54.456Z] [DEBUG] case-1: Generate Policy: Attempt 1/3
[2026-01-15T10:30:55.567Z] [INFO] case-1: ✓ Generate Policy successful
[2026-01-15T10:30:55.678Z] [INFO] case-1: Saved generate-policy logs
[2026-01-15T10:30:57.789Z] [DEBUG] case-1: Get Booking Details: Attempt 1/3
[2026-01-15T10:30:58.890Z] [INFO] case-1: ✓ Get Booking Details successful
[2026-01-15T10:30:59.001Z] [INFO] case-1: Saved booking-details logs
[2026-01-15T10:30:59.001Z] [INFO] case-1: Saved summary logs
✓ case-1: SUCCESS

──────────────────────────────────────────────────────────
Running: Domestic Trip - 2 Adults (Age 0-40 and 41-70)
──────────────────────────────────────────────────────────
[2026-01-15T10:31:01.112Z] [INFO] case-2: Starting certification case
[2026-01-15T10:31:01.223Z] [INFO] case-2: Test case case-2 validation passed
[2026-01-15T10:31:01.334Z] [INFO] case-2: ✓ Authentication successful
...
✓ case-2: SUCCESS

──────────────────────────────────────────────────────────
Running: Non-US Trip - 1 Adult
──────────────────────────────────────────────────────────
[2026-01-15T10:31:36.112Z] [INFO] case-3: Starting certification case
...
✓ case-3: SUCCESS

──────────────────────────────────────────────────────────
Running: Non-US Trip - 2 Adults (Age 0-40 and 41-70)
──────────────────────────────────────────────────────────
[2026-01-15T10:32:11.112Z] [INFO] case-4: Starting certification case
...
✓ case-4: SUCCESS

──────────────────────────────────────────────────────────
Running: US/Canada Trip - 2 Adults (Age 0-40 and 41-70)
──────────────────────────────────────────────────────────
[2026-01-15T10:32:46.112Z] [INFO] case-5: Starting certification case
...
✓ case-5: SUCCESS

──────────────────────────────────────────────────────────
All cases completed. Generating report...

╔════════════════════════════════════════════════════════╗
║      TBO INSURANCE CERTIFICATION REPORT                ║
╚════════════════════════════════════════════════════════╝

Executed At:            2026-01-15T10:30:45.123Z

── OVERALL STATISTICS ────────────────────────────────────
Total Cases:            5
Successful Cases:       5
Failed Cases:           0
Success Rate:           100.00%

── CASE RESULTS ──────────────────────────────────────────
✓ case-1          SUCCESS   10.67s
✓ case-2          SUCCESS   12.34s
✓ case-3          SUCCESS   11.23s
✓ case-4          SUCCESS   13.45s
✓ case-5          SUCCESS   12.56s

╔════════════════════════════════════════════════════════╗
║    ✓ ALL TEST CASES PASSED - READY FOR SUBMISSION      ║
╚════════════════════════════════════════════════════════╝

Instructions for TBO Submission:
1. Navigate to /certification-output/
2. Each case has a dedicated folder (case-1, case-2, etc.)
3. Each folder contains:
   - auth-request.json / auth-response.json
   - search-request.json / search-response.json
   - book-request.json / book-response.json
   - policy-request.json / policy-response.json
   - booking-details-request.json / booking-details-response.json
   - summary.json and summary.txt
4. Submit each case folder separately to TBO API team
```

---

## File System Output

### Directory Structure

```bash
$ tree certification-output/
certification-output/
├── case-1
│   ├── auth-request.json
│   ├── auth-response.json
│   ├── booking-details-request.json
│   ├── booking-details-response.json
│   ├── book-request.json
│   ├── book-response.json
│   ├── case-summary.txt
│   ├── policy-request.json
│   ├── policy-response.json
│   ├── search-request.json
│   ├── search-response.json
│   ├── summary.json
│   └── summary.txt
├── case-2
│   ├── auth-request.json
│   ├── auth-response.json
│   ├── booking-details-request.json
│   ├── booking-details-response.json
│   ├── book-request.json
│   ├── book-response.json
│   ├── case-summary.txt
│   ├── policy-request.json
│   ├── policy-response.json
│   ├── search-request.json
│   ├── search-response.json
│   ├── summary.json
│   └── summary.txt
├── case-3
│   └── [same 13 files]
├── case-4
│   └── [same 13 files]
├── case-5
│   └── [same 13 files]
├── certification-report.json
└── certification-summary.txt
```

---

## JSON Output Examples

### Example 1: auth-request.json

```json
{
  "ClientId": "ApiIntegrationNew",
  "UserName": "your_username",
  "Password": "[REDACTED]",
  "EndUserIp": "1.1.1.1"
}
```

### Example 2: auth-response.json

```json
{
  "Status": 1,
  "TokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "Member": {
    "FirstName": "John",
    "LastName": "Doe",
    "Email": "john@agency.com",
    "MemberId": 12345,
    "AgencyId": 67890,
    "LoginName": "johndoe",
    "LoginDetails": "Admin",
    "isPrimaryAgent": true
  }
}
```

### Example 3: search-request.json

```json
{
  "PlanCategory": 1,
  "PlanType": 1,
  "PlanCoverage": 4,
  "TravelStartDate": "2026-07-25T00:00:00",
  "NoOfPax": 1,
  "PaxAge": [30],
  "EndUserIp": "1.1.1.1",
  "TokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Example 4: search-response.json

```json
{
  "Response": {
    "ResponseStatus": 1,
    "TraceId": "TRACE-2026-01-15-12345",
    "Results": [
      {
        "ResultIndex": 0,
        "PlanCode": "PLAN-DOM-001",
        "PlanType": 1,
        "PlanName": "Standard Travel Insurance",
        "PlanDescription": "Comprehensive travel coverage for domestic trips",
        "PlanCoverage": 4,
        "PlanCategory": 1,
        "PolicyStartDate": "2026-07-25T00:00:00",
        "PolicyEndDate": "2026-08-01T23:59:59",
        "PoweredBy": "TBO Partner",
        "SumInsured": "500000",
        "SumInsuredCurrency": "INR",
        "CoverageDetails": [
          {
            "Coverage": "Medical Expense",
            "SumInsured": "500000",
            "SumCurrency": "INR",
            "Excess": null
          },
          {
            "Coverage": "Emergency Evacuation",
            "SumInsured": "1000000",
            "SumCurrency": "INR",
            "Excess": null
          }
        ],
        "PremiumList": [
          {
            "PassengerCount": 1,
            "MinAge": 18,
            "MaxAge": 65,
            "Premium": 250,
            "CustomerPrice": 300,
            "Commission": 50,
            "BaseCurrencyPrice": {
              "Currency": "INR",
              "GrossFare": 300,
              "PublishedPrice": 350,
              "OfferedPrice": 300
            }
          }
        ]
      }
    ]
  }
}
```

### Example 5: book-request.json

```json
{
  "TokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "EndUserIp": "1.1.1.1",
  "TraceId": "TRACE-2026-01-15-12345",
  "GenerateInsurancePolicy": "false",
  "ResultIndex": 0,
  "Passenger": [
    {
      "Title": "Mr",
      "FirstName": "Traveller1",
      "LastName": "case-1",
      "BeneficiaryName": "Traveller1 case-1",
      "RelationShipToInsured": "Self",
      "RelationToBeneficiary": "Self",
      "Gender": "1",
      "Sex": 1,
      "DOB": "1996-01-15T00:00:00",
      "PassportNo": "PCASE-1-1",
      "PhoneNumber": "9876543210",
      "EmailId": "traveller1.case-1@test.com",
      "AddressLine1": "123 Test Street",
      "AddressLine2": "Test Building",
      "CityCode": "DEL",
      "CountryCode": "IN",
      "PassportCountry": "IN",
      "MajorDestination": "DEL",
      "PinCode": 110001
    }
  ]
}
```

### Example 6: book-response.json

```json
{
  "Response": {
    "ResponseStatus": 1,
    "TraceId": "TRACE-2026-01-15-12345",
    "Itinerary": {
      "BookingId": 98765,
      "InsuranceId": 54321,
      "PlanType": 1,
      "PlanName": "Standard Travel Insurance",
      "PlanDescription": "Comprehensive travel coverage",
      "PlanCoverage": 4,
      "PlanCategory": 1,
      "PolicyStartDate": "2026-07-25T00:00:00",
      "PolicyEndDate": "2026-08-01T23:59:59",
      "CreatedOn": "2026-01-15T10:30:45",
      "Source": "API",
      "IsDomestic": true,
      "Status": 1,
      "Passenger Info": [
        {
          "Passenger Id": 1,
          "PolicyNo": "POL-2026-98765-001",
          "ReferenceId": "REF-2026-98765-001",
          "SiebelPolicyNumber": "SBL-2026-98765-001",
          "FirstName": "Traveller1",
          "LastName": "case-1",
          "DOB": "1996-01-15",
          "Gender": "Male",
          "Title": "Mr",
          "BeneficiaryName": "Traveller1 case-1",
          "RelationShipToInsured": "Self",
          "RelationToBeneficiary": "Self",
          "PhoneNumber": "9876543210",
          "EmailId": "traveller1.case-1@test.com",
          "PassportNo": "PCASE-1-1",
          "AddressLine1": "123 Test Street",
          "AddressLine2": "Test Building",
          "City": "Delhi",
          "Country": "India",
          "State": "Delhi",
          "PinCode": "110001",
          "MajorDestination": "DEL",
          "Price": {
            "Currency": "INR",
            "GrossFare": 300
          },
          "PolicyStatus": 1,
          "ErrorMsg": ""
        }
      ]
    }
  }
}
```

---

## Summary File Examples

### Example 1: summary.json (Case 1)

```json
{
  "caseId": "case-1",
  "tripType": "domestic",
  "policyNumber": "See booking details response",
  "bookingId": 98765,
  "confirmationNumber": "REF-2026-98765-001",
  "status": "SUCCESS",
  "timestamp": "2026-01-15T10:30:59.001Z"
}
```

### Example 2: summary.txt (Case 1)

```
═══════════════════════════════════════════════════════════════
CERTIFICATION CASE SUMMARY - CASE-1
═══════════════════════════════════════════════════════════════

Status:                 SUCCESS
Start Time:             2026-01-15T10:30:45.123Z
End Time:               2026-01-15T10:30:59.001Z
Duration:               13878ms (13.88s)

── IDENTIFIERS ───────────────────────────────────────────────
Auth Token:             eyJhbGciOiJIUzI1NiIsInR5cC...
Trace ID:               TRACE-2026-01-15-12345
Booking ID:             98765
Policy Number:          POL-2026-98765-001
Confirmation Number:    REF-2026-98765-001

── STEP-BY-STEP RESULTS ───────────────────────────────────────
✓ Authentication         PASS [1123ms]
✓ Search Plans          PASS [1234ms]
✓ Book Insurance        PASS [2345ms]
✓ Generate Policy       PASS [2456ms]
✓ Get Booking Details   PASS [2108ms]

═══════════════════════════════════════════════════════════════
```

### Example 3: case-summary.txt (Case 2 - Dual Travellers)

```
═══════════════════════════════════════════════════════════════
CERTIFICATION CASE SUMMARY - CASE-2
═══════════════════════════════════════════════════════════════

Status:                 SUCCESS
Start Time:             2026-01-15T10:31:01.223Z
End Time:               2026-01-15T10:31:13.557Z
Duration:               12334ms (12.33s)

── IDENTIFIERS ───────────────────────────────────────────────
Auth Token:             eyJhbGciOiJIUzI1NiIsInR5cC...
Trace ID:               TRACE-2026-01-15-12346
Booking ID:             98766
Policy Number:          POL-2026-98766-001
Confirmation Number:    REF-2026-98766-001

── STEP-BY-STEP RESULTS ───────────────────────────────────────
✓ Authentication         PASS [1120ms]
✓ Search Plans          PASS [1245ms]
✓ Book Insurance        PASS [2367ms]
✓ Generate Policy       PASS [2489ms]
✓ Get Booking Details   PASS [2113ms]

═══════════════════════════════════════════════════════════════
```

---

## Overall Report Example

### certification-report.json

```json
{
  "executedAt": "2026-01-15T10:30:45.123Z",
  "totalCases": 5,
  "successfulCases": 5,
  "failedCases": 0,
  "results": [
    {
      "caseId": "case-1",
      "status": "SUCCESS",
      "startTime": "2026-01-15T10:30:45.123Z",
      "endTime": "2026-01-15T10:30:59.001Z",
      "duration": 13878,
      "authTokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "traceId": "TRACE-2026-01-15-12345",
      "bookingId": 98765,
      "confirmationNumber": "REF-2026-98765-001",
      "steps": [
        {
          "name": "Authentication",
          "status": "SUCCESS",
          "duration": 1123
        },
        {
          "name": "Search Plans",
          "status": "SUCCESS",
          "duration": 1234
        },
        {
          "name": "Book Insurance",
          "status": "SUCCESS",
          "duration": 2345
        },
        {
          "name": "Generate Policy",
          "status": "SUCCESS",
          "duration": 2456
        },
        {
          "name": "Get Booking Details",
          "status": "SUCCESS",
          "duration": 2108
        }
      ]
    },
    {
      "caseId": "case-2",
      "status": "SUCCESS",
      "startTime": "2026-01-15T10:31:01.223Z",
      "endTime": "2026-01-15T10:31:13.557Z",
      "duration": 12334,
      "authTokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "traceId": "TRACE-2026-01-15-12346",
      "bookingId": 98766,
      "confirmationNumber": "REF-2026-98766-001",
      "steps": [
        {
          "name": "Authentication",
          "status": "SUCCESS",
          "duration": 1120
        },
        {
          "name": "Search Plans",
          "status": "SUCCESS",
          "duration": 1245
        },
        {
          "name": "Book Insurance",
          "status": "SUCCESS",
          "duration": 2367
        },
        {
          "name": "Generate Policy",
          "status": "SUCCESS",
          "duration": 2489
        },
        {
          "name": "Get Booking Details",
          "status": "SUCCESS",
          "duration": 2113
        }
      ]
    }
  ]
}
```

### certification-summary.txt

```
╔═════════════════════════════════════════════════════════╗
║          TBO INSURANCE CERTIFICATION REPORT             ║
╚═════════════════════════════════════════════════════════╝

Executed At:            2026-01-15T10:30:45.123Z

── OVERALL STATISTICS ─────────────────────────────────────
Total Cases:            5
Successful Cases:       5
Failed Cases:           0
Success Rate:           100.00%

── CASE RESULTS ───────────────────────────────────────────
✓ case-1          SUCCESS   13.88s
✓ case-2          SUCCESS   12.33s
✓ case-3          SUCCESS   11.24s
✓ case-4          SUCCESS   13.45s
✓ case-5          SUCCESS   12.56s

╔═════════════════════════════════════════════════════════╗
║     ✓ ALL TEST CASES PASSED - READY FOR SUBMISSION      ║
╚═════════════════════════════════════════════════════════╝

Instructions for TBO Submission:
1. Navigate to /certification-output/
2. Each case has a dedicated folder (case-1, case-2, etc.)
3. Each folder contains:
   - auth-request.json / auth-response.json
   - search-request.json / search-response.json
   - book-request.json / book-response.json
   - policy-request.json / policy-response.json
   - booking-details-request.json / booking-details-response.json
   - summary.json and summary.txt
4. Submit each case folder separately to TBO API team
```

---

## Error Example (If Failure Occurs)

### case-2-error-request.json (if something fails)

```json
{
  "TokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "EndUserIp": "1.1.1.1",
  "TraceId": "TRACE-2026-01-15-12346",
  "GenerateInsurancePolicy": "false",
  "ResultIndex": 0,
  "Passenger": [
    {
      "Title": "Mr",
      "FirstName": "Traveller1",
      "LastName": "case-2",
      ...
    }
  ]
}
```

### case-2-error-response.json (if something fails)

```json
{
  "Response": {
    "ResponseStatus": 2,
    "Error": {
      "ErrorCode": 101,
      "ErrorMessage": "Invalid passenger data"
    },
    "TraceId": "TRACE-2026-01-15-12346"
  }
}
```

---

## Single Case Run Output

### Running Single Case (case-1)

```bash
$ npm run insurance-certification -- case-1

Running single case: case-1

──────────────────────────────────────────────────────────
Running: Domestic Trip - 1 Adult
──────────────────────────────────────────────────────────
[2026-01-15T10:30:45.123Z] [INFO] case-1: Starting certification case
[2026-01-15T10:30:45.234Z] [INFO] case-1: Test case case-1 validation passed
[2026-01-15T10:30:45.345Z] [INFO] case-1: ✓ Authentication successful
[2026-01-15T10:30:46.456Z] [INFO] case-1: Search returned 3 plan(s)
[2026-01-15T10:30:47.567Z] [INFO] case-1: ✓ Book successful, BookingId: 98765
[2026-01-15T10:30:48.678Z] [INFO] case-1: ✓ Generate Policy successful
[2026-01-15T10:30:49.789Z] [INFO] case-1: ✓ Get Booking Details successful
✓ case-1: SUCCESS

──────────────────────────────────────────────────────────
All cases completed. Generating report...

╔════════════════════════════════════════════════════════╗
║      TBO INSURANCE CERTIFICATION REPORT                ║
╚════════════════════════════════════════════════════════╝

Executed At:            2026-01-15T10:30:45.123Z

── OVERALL STATISTICS ────────────────────────────────────
Total Cases:            1
Successful Cases:       1
Failed Cases:           0
Success Rate:           100.00%

── CASE RESULTS ──────────────────────────────────────────
✓ case-1          SUCCESS   13.88s

╔════════════════════════════════════════════════════════╗
║    ✓ ALL TEST CASES PASSED - READY FOR SUBMISSION      ║
╚════════════════════════════════════════════════════════╝
```

---

## Debug Mode Output

### Running with LOG_LEVEL=debug

```bash
$ LOG_LEVEL=debug npm run insurance-certification -- case-1

[2026-01-15T10:30:45.123Z] [DEBUG] case-1: TBO_CONFIG.AUTH_URL = http://sharedapi.tektravels.com/SharedData.svc/rest/Authenticate
[2026-01-15T10:30:45.123Z] [DEBUG] case-1: TBO_CONFIG.SEARCH_URL = https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Search
[2026-01-15T10:30:45.123Z] [DEBUG] case-1: Generating passenger input: Traveller1 case-1, Age: 30, DOB: 1996-01-15T00:00:00
[2026-01-15T10:30:45.234Z] [DEBUG] case-1: Authentication: Attempt 1/3
[2026-01-15T10:30:46.345Z] [DEBUG] case-1: Auth response received with Status: 1
[2026-01-15T10:30:46.456Z] [INFO] case-1: ✓ Authentication successful, TokenId: eyJhbGciOiJIUzI1NiIsInR5cC...
[2026-01-15T10:30:46.567Z] [DEBUG] case-1: Waiting 2000ms before next request...
[2026-01-15T10:30:48.678Z] [DEBUG] case-1: Search: Attempt 1/3
[2026-01-15T10:30:49.789Z] [DEBUG] case-1: Search response received with Status: 1, Results: 3
[2026-01-15T10:30:49.890Z] [INFO] case-1: Search returned 3 plan(s)
...
```

---

## File Size Reference

Typical file sizes per case:

```
auth-request.json                    ~200 bytes
auth-response.json                   ~1.2 KB
search-request.json                  ~300 bytes
search-response.json                 ~5-10 KB
book-request.json                    ~1.5 KB
book-response.json                   ~3-5 KB
policy-request.json                  ~300 bytes
policy-response.json                 ~3-5 KB
booking-details-request.json         ~300 bytes
booking-details-response.json        ~3-5 KB
summary.json                         ~400 bytes
summary.txt                          ~2 KB
case-summary.txt                     ~2 KB
────────────────────────────────────────────────
Total per case:                      ~30-40 KB
Total for 5 cases:                   ~150-200 KB
```

---

## Verification Checklist

After running, you can verify:

```bash
# 1. All 5 case folders exist
ls -d certification-output/case-{1..5}
# Output: certification-output/case-1 case-2 case-3 case-4 case-5

# 2. Each case has 13 files
find certification-output/case-1 -type f | wc -l
# Output: 13

# 3. All JSON files are valid
jq . certification-output/case-1/auth-request.json
# Output: Pretty-printed JSON

# 4. Report exists and is valid
jq . certification-output/certification-report.json
# Output: Entire report structure

# 5. All cases show SUCCESS
grep -r "SUCCESS" certification-output/case-*/case-summary.txt
# Output: 5 lines showing SUCCESS
```

---

## Ready for TBO Submission

Once you see:

```
╔════════════════════════════════════════════════════════╗
║    ✓ ALL TEST CASES PASSED - READY FOR SUBMISSION      ║
╚════════════════════════════════════════════════════════╝
```

You can proceed with submitting each case folder to TBO following the casewise submission requirement.
