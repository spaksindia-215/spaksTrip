# TBO Insurance Certification Runner

A complete automated certification framework for TBO Insurance APIs following the official TBO certification requirements.

## Overview

This runner executes all 5 TBO-required certification test cases automatically, capturing JSON request/response logs for each step and generating submission-ready folders.

### Certification Cases

The runner validates all 5 required test cases per TBO's official certification HTML:

1. **Case 1**: Domestic Trip – 1 Adult
2. **Case 2**: Domestic Trip – 2 Adults (Age boundaries: 0-40 and 41-70)
3. **Case 3**: Non-US Trip – 1 Adult
4. **Case 4**: Non-US Trip – 2 Adults (Age boundaries: 0-40 and 41-70)
5. **Case 5**: US/Canada Trip – 2 Adults (Age boundaries: 0-40 and 41-70)

## Features

✓ **Complete Insurance Flow** - Auth → Search → Book → Policy → Details
✓ **Automatic Logging** - All requests/responses saved as JSON per step
✓ **Retry Logic** - Configurable retries with exponential backoff for network failures
✓ **Validation Layer** - Per-step validation of TBO responses
✓ **Error Handling** - Continues execution on failures, captures error logs
✓ **Automatic Delays** - Configurable delays between requests
✓ **Comprehensive Reports** - JSON and text summaries per case
✓ **Single Case Execution** - Support for running individual cases
✓ **Timeout Protection** - Prevents hanging on slow/unresponsive servers

## Project Structure

```
scripts/tbo-insurance-certification/
├── index.ts              # Main runner orchestrator
├── config.ts             # Configuration from env vars
├── cases.ts              # Test case definitions (5 cases)
├── logger.ts             # Logging and file I/O
├── retry.ts              # Retry logic with backoff
├── validators.ts         # Response validation layer
├── helpers.ts            # Utility functions (DOB calc, formatting)
├── insuranceClient.ts    # TBO API client with all 5 endpoints
├── summary.ts            # Report generation
├── types.ts              # TypeScript interfaces for all APIs
└── README.md             # This file
```

## Installation

### Prerequisites

- Node.js 18+ 
- ts-node (included in devDependencies)
- TypeScript (included in devDependencies)

### Setup

No additional dependencies required — uses existing project setup.

## Configuration

### Environment Variables

Create a `.env.local` file in the client directory or set via shell:

```bash
# TBO API Configuration
TBO_BASE_URL=http://sharedapi.tektravels.com
TBO_INSURANCE_USERNAME=your_username
TBO_INSURANCE_API_PASSWORD=your_password
TBO_INSURANCE_SERVER_IP=1.1.1.1

# Certification Configuration (Optional)
RETRY_ATTEMPTS=3                    # Default: 3
RETRY_DELAY_MS=2000                # Default: 2000ms
REQUEST_TIMEOUT_MS=30000           # Default: 30 seconds
DELAY_BETWEEN_REQUESTS_MS=2000     # Default: 2 seconds
OUTPUT_DIR=./certification-output  # Default: ./certification-output
LOG_LEVEL=info                     # Options: debug, info, warn, error

# Travel Configuration (Optional)
TRAVEL_START_DATE=2026-07-25T00:00:00  # Default shown
TRIP_DURATION_DAYS=7                    # Default: 7
```

## Usage

### Run All 5 Test Cases

```bash
cd client
npm run insurance-certification
```

### Run Single Case

```bash
npm run insurance-certification -- case-1
npm run insurance-certification -- case-2
npm run insurance-certification -- case-3
npm run insurance-certification -- case-4
npm run insurance-certification -- case-5
```

### With Debug Logging

```bash
LOG_LEVEL=debug npm run insurance-certification
```

## Output Structure

After execution, the following directory structure is created:

```
certification-output/
├── certification-report.json      # Final report with all results
├── certification-summary.txt      # Formatted summary
├── case-1/
│   ├── auth-request.json
│   ├── auth-response.json
│   ├── search-request.json
│   ├── search-response.json
│   ├── book-request.json
│   ├── book-response.json
│   ├── policy-request.json
│   ├── policy-response.json
│   ├── booking-details-request.json
│   ├── booking-details-response.json
│   ├── summary.json
│   ├── summary.txt
│   └── case-summary.txt
├── case-2/
│   └── [same structure as case-1]
├── case-3/
│   └── [same structure as case-1]
├── case-4/
│   └── [same structure as case-1]
└── case-5/
    └── [same structure as case-1]
```

## TBO Submission

### Step 1: Verify All Cases Passed

```bash
npm run insurance-certification
# Check that all 5 cases show "SUCCESS"
```

### Step 2: Review Output Folders

Each case has its own folder with complete JSON logs:
- Navigate to `certification-output/case-x/`
- Verify all JSON files exist (10 files per case: 5 requests + 5 responses)
- Review summary.txt for case details

### Step 3: Submit Casewise

Per TBO's requirement:

> "Please make sure that test cases should be sent to the API team Casewise rather than all test cases in a single notepad file."

Submit each case separately:

1. Create a separate email/submission for each case
2. Attach the case folder (e.g., `case-1/`) containing:
   - All 10 JSON files (request/response pairs)
   - summary.txt with case details
   - Confirmation number

### Case Submission Template

**For each case send:**

```
Case ID: case-1
Trip Type: Domestic
Plan Category: 1 (Domestic)
Travellers: 1 Adult (Age 30)

Confirmation Number: [from summary.txt]
Booking ID: [from summary.txt]

Attachments:
- case-1/ folder with all JSON logs
```

## API Flow Per Case

For each test case, the runner executes:

### 1. Authentication
- **Request**: UserName, Password, ClientId, EndUserIp
- **Response**: TokenId (required for all subsequent calls)
- **Retry**: Yes (3x with 2s delays)

### 2. Insurance Search
- **Request**: PlanCategory, PlanType, PlanCoverage, TravelStartDate, NoOfPax, PaxAge
- **Response**: Available plans with ResultIndex
- **Retry**: Yes (3x with 2s delays)

### 3. Book Insurance
- **Request**: TokenId, TraceId, ResultIndex, Passenger details
- **Response**: BookingId, Passenger Info, Policy Details
- **Retry**: Yes (3x with 2s delays)

### 4. Generate Policy
- **Request**: TokenId, BookingId
- **Response**: Updated booking with policy
- **Retry**: Yes (3x with 2s delays)

### 5. Get Booking Details
- **Request**: TokenId, BookingId
- **Response**: Complete booking details
- **Retry**: Yes (3x with 2s delays)

## Error Handling

### Validation Checks

Each step validates:
- HTTP status codes (retries on 5xx)
- TBO ResponseStatus codes
- Required fields (TokenId, BookingId, etc.)
- Error messages

### Retry Strategy

Network-resilient with exponential backoff:
- Max Attempts: 3 (configurable)
- Initial Delay: 2000ms (configurable)
- Backoff: 1.5x per retry
- Timeout: 30 seconds per request (configurable)

### Error Logs

On failure, error JSON files are saved:
- `auth-error-request.json`
- `auth-error-response.json`
- etc.

### Case Continuation

If one case fails:
- Step failure is logged
- Case marked as FAILED
- Remaining cases execute (doesn't stop runner)
- Final report shows all results

## Test Case Details

### Case 1: Domestic Trip – 1 Adult
```json
{
  "id": "case-1",
  "tripType": "domestic",
  "planCategory": 1,
  "travellers": [{ "age": 30 }]
}
```

### Case 2: Domestic Trip – 2 Adults
```json
{
  "id": "case-2",
  "tripType": "domestic",
  "planCategory": 1,
  "travellers": [
    { "age": 30 },    // 0-40 range
    { "age": 55 }     // 41-70 range
  ]
}
```

### Case 3: Non-US Trip – 1 Adult
```json
{
  "id": "case-3",
  "tripType": "non-us",
  "planCategory": 2,
  "travellers": [{ "age": 35 }]
}
```

### Case 4: Non-US Trip – 2 Adults
```json
{
  "id": "case-4",
  "tripType": "non-us",
  "planCategory": 2,
  "travellers": [
    { "age": 28 },    // 0-40 range
    { "age": 60 }     // 41-70 range
  ]
}
```

### Case 5: US/Canada Trip – 2 Adults
```json
{
  "id": "case-5",
  "tripType": "us-canada",
  "planCategory": 2,
  "travellers": [
    { "age": 30 },    // 0-40 range
    { "age": 65 }     // 41-70 range
  ]
}
```

## Validation Rules

✓ Traveller count: 1-2 per case
✓ Age ranges:
  - Single traveller: any age 0-100
  - Dual traveller: first 0-40, second 41-70
✓ Policy generation: Required and verified
✓ Booking success: Response status 1 (success)
✓ Confirmation numbers: Extracted from booking
✓ All steps must succeed for case to pass

## Logging

### Log Levels

- **debug**: All operation details
- **info**: Step completion and key milestones
- **warn**: Validation warnings, retry attempts
- **error**: Failures and exceptions

### Console Output Example

```
[2026-01-15T10:30:45.123Z] [INFO] case-1: Starting certification case
[2026-01-15T10:30:46.456Z] [INFO] case-1: ✓ Authentication successful
[2026-01-15T10:30:48.789Z] [INFO] case-1: Search returned 3 plan(s)
[2026-01-15T10:30:50.012Z] [INFO] case-1: Book successful, BookingId: 12345
```

### File Logs

Each step's request and response saved as formatted JSON:

```json
{
  "TokenId": "...",
  "EndUserIp": "...",
  "TraceId": "..."
}
```

## Summary Reports

### Case Summary (summary.txt)

```
═════════════════════════════════════════════════
CERTIFICATION CASE SUMMARY - CASE-1
═════════════════════════════════════════════════

Status:                 SUCCESS
Start Time:             2026-01-15T10:30:45.123Z
End Time:               2026-01-15T10:30:55.789Z
Duration:               10666ms (10.67s)

── IDENTIFIERS ────────────────────────────────
Auth Token:             ABC123...
Trace ID:               TRC-456-789
Booking ID:             12345
Policy Number:          POL-98765
Confirmation Number:    TBO-CASE-1-12345-1234567890

── STEP-BY-STEP RESULTS ───────────────────────
✓ Authentication         PASS (HTTP 200) [1123ms]
✓ Search Plans          PASS (HTTP 200) [1234ms]
✓ Book Insurance        PASS (HTTP 200) [2345ms]
✓ Generate Policy       PASS (HTTP 200) [2456ms]
✓ Get Booking Details   PASS (HTTP 200) [2108ms]
```

### Overall Report (certification-summary.txt)

```
╔═════════════════════════════════════════════╗
║   TBO INSURANCE CERTIFICATION REPORT        ║
╚═════════════════════════════════════════════╝

Total Cases:            5
Successful Cases:       5
Failed Cases:           0
Success Rate:           100.00%

── CASE RESULTS ────────────────────────────
✓ case-1          SUCCESS   10.67s
✓ case-2          SUCCESS   12.34s
✓ case-3          SUCCESS   11.23s
✓ case-4          SUCCESS   13.45s
✓ case-5          SUCCESS   12.56s

✓ ALL TEST CASES PASSED - READY FOR SUBMISSION
```

## Troubleshooting

### "AUTH_FAILED" - Invalid Credentials

```bash
# Check credentials in .env.local
TBO_INSURANCE_USERNAME=correct_username
TBO_INSURANCE_API_PASSWORD=correct_password

# Verify with test-search endpoint
curl -X GET http://localhost:3000/api/tbo-insurance/test-search
```

### "NO_RESULTS" - Insurance Not Enabled

```
Error Code: 2
Error Message: "Insurance inventory not enabled for this agency"
```

**Solution**: Contact TBO to enable insurance for your agency.

### Network Timeouts

```bash
# Increase timeout
REQUEST_TIMEOUT_MS=60000 npm run insurance-certification
```

### High Failure Rate

```bash
# Increase delays between requests
DELAY_BETWEEN_REQUESTS_MS=5000 npm run insurance-certification

# Enable debug logging to see exact failures
LOG_LEVEL=debug npm run insurance-certification
```

## Development

### Adding Custom Test Cases

Edit `cases.ts`:

```typescript
const CERTIFICATION_CASES: TestCase[] = [
  // ... existing cases
  {
    id: "case-custom",
    name: "Custom Test Case",
    tripType: "domestic",
    planCategory: 1,
    planCoverage: 4,
    travellers: [{ age: 35 }],
  },
];
```

Then run:

```bash
npm run insurance-certification -- case-custom
```

### Extending Validators

Add new validation rules in `validators.ts`:

```typescript
static validateCustomRule(response: unknown, logger: Logger): boolean {
  // Your validation logic
  logger.info("Custom validation passed");
  return true;
}
```

## Support

For issues with:

- **TBO API**: Refer to /API Integration Help.html
- **Configuration**: Check environment variables in config.ts
- **Test Cases**: See cases.ts
- **Logging**: Increase LOG_LEVEL to "debug"

## API Documentation

All API endpoints documented in TBO HTML:

- Authentication: `https://apidoc.tektravels.com/insurance/Authentication.aspx`
- Insurance Search: `https://apidoc.tektravels.com/insurance/InsuranceSearch.aspx`
- Insurance Book: `https://apidoc.tektravels.com/insurance/InsuranceBook.aspx`
- Generate Policy: `https://apidoc.tektravels.com/insurance/InsuranceGeneratePolicy.aspx`
- Booking Details: `https://apidoc.tektravels.com/insurance/InsuranceGetbookingdetail.aspx`

## Notes

- All dates use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
- Confirmation numbers are auto-generated from BookingId if not returned
- Test data uses fictional names and emails (Traveller1, Traveller2, etc.)
- All requests include required EndUserIp parameter
- Responses are validated for required fields before proceeding

## Certification Checklist

Before submitting to TBO:

- [ ] All 5 cases execute without errors
- [ ] Success rate is 100%
- [ ] certification-output/ folder contains case-1 through case-5
- [ ] Each case folder has 10 JSON files (5 request + 5 response pairs)
- [ ] Confirmation numbers are captured in summary files
- [ ] No sensitive data (passwords, full tokens) in output files
- [ ] Report shows correct trip types and passenger counts
- [ ] Submission is case-wise (separate emails/attachments per case)
