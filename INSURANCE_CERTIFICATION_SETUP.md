# TBO Insurance Certification Runner - Setup Guide

## Quick Start (2 Minutes)

### 1. Configure Environment Variables

Create `.env.local` in the `/client` directory:

```bash
# Required: Your TBO API credentials
TBO_INSURANCE_USERNAME=your_username
TBO_INSURANCE_API_PASSWORD=your_password

# Optional: Defaults shown
TBO_BASE_URL=http://sharedapi.tektravels.com
TBO_INSURANCE_SERVER_IP=1.1.1.1
RETRY_ATTEMPTS=3
DELAY_BETWEEN_REQUESTS_MS=2000
OUTPUT_DIR=./certification-output
LOG_LEVEL=info
```

### 2. Run All 5 Test Cases

```bash
cd client
npm run insurance-certification
```

**Expected Output:**
```
✓ case-1: SUCCESS   [10.67s]
✓ case-2: SUCCESS   [12.34s]
✓ case-3: SUCCESS   [11.23s]
✓ case-4: SUCCESS   [13.45s]
✓ case-5: SUCCESS   [12.56s]

✓ ALL TEST CASES PASSED - READY FOR SUBMISSION
```

### 3. Find Output Files

```
certification-output/
├── case-1/     (Domestic 1 Adult)
├── case-2/     (Domestic 2 Adults)
├── case-3/     (Non-US 1 Adult)
├── case-4/     (Non-US 2 Adults)
├── case-5/     (US/Canada 2 Adults)
└── certification-report.json
```

Each case folder contains:
- 10 JSON files (auth, search, book, policy, booking-details request/response pairs)
- summary.txt with case details
- summary.json with structured data

### 4. Submit to TBO

**Casewise submission (per TBO requirement):**

For each case:
1. Navigate to `certification-output/case-x/`
2. Attach all files in that folder to TBO
3. Include confirmation number from summary.txt
4. Send as separate submission (not all in one email)

---

## Running Individual Cases

### Run Single Case

```bash
npm run insurance-certification -- case-1  # or case-2, case-3, etc.
```

### Run All Cases Again

```bash
npm run insurance-certification
```

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run insurance-certification
```

---

## Test Cases Overview

| Case | Trip Type | Travellers | Age Requirements |
|------|-----------|-----------|------------------|
| case-1 | Domestic | 1 Adult | - |
| case-2 | Domestic | 2 Adults | First: 0-40, Second: 41-70 |
| case-3 | Non-US | 1 Adult | - |
| case-4 | Non-US | 2 Adults | First: 0-40, Second: 41-70 |
| case-5 | US/Canada | 2 Adults | First: 0-40, Second: 41-70 |

---

## File Structure

```
scripts/tbo-insurance-certification/
├── index.ts              # Main runner
├── config.ts             # Configuration
├── cases.ts              # Test case definitions
├── logger.ts             # Logging system
├── retry.ts              # Retry logic
├── validators.ts         # Response validation
├── helpers.ts            # Utility functions
├── insuranceClient.ts    # TBO API client
├── summary.ts            # Report generation
├── types.ts              # TypeScript interfaces
└── README.md             # Detailed documentation
```

---

## API Flow Executed Per Case

```
1. Authenticate
   ├─ Request: Username + Password
   └─ Response: TokenId (required for all subsequent calls)

2. Search Plans
   ├─ Request: PlanCategory, Traveller ages, Travel date
   └─ Response: Available plans with ResultIndex

3. Book Insurance
   ├─ Request: Passenger details, Plan selection
   └─ Response: BookingId, Policy details

4. Generate Policy
   ├─ Request: BookingId
   └─ Response: Updated booking with policy

5. Get Booking Details
   ├─ Request: BookingId
   └─ Response: Complete booking confirmation
```

All 5 steps must succeed for case to pass.

---

## Configuration Reference

### Credentials (Required)

| Env Var | Description | Example |
|---------|-----------|---------|
| `TBO_INSURANCE_USERNAME` | TBO API username | `your_username` |
| `TBO_INSURANCE_API_PASSWORD` | TBO API password | `your_password` |

### URLs (Optional)

| Env Var | Default | Use |
|---------|---------|-----|
| `TBO_BASE_URL` | `http://sharedapi.tektravels.com` | Auth endpoint base |
| `TBO_INSURANCE_SEARCH_URL` | `https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Search` | Search endpoint |
| `TBO_INSURANCE_BOOK_URL` | `https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Book` | Book endpoint |
| `TBO_INSURANCE_GENERATE_POLICY_URL` | `https://InsuranceBE.tektravels.com/.../GeneratePolicy` | Policy endpoint |
| `TBO_INSURANCE_GET_BOOKING_DETAILS_URL` | `https://InsuranceBE.tektravels.com/.../GetBookingDetails` | Details endpoint |

### Behavior (Optional)

| Env Var | Default | Options |
|---------|---------|---------|
| `RETRY_ATTEMPTS` | `3` | 1-10 |
| `RETRY_DELAY_MS` | `2000` | 500-10000 |
| `REQUEST_TIMEOUT_MS` | `30000` | 5000-60000 |
| `DELAY_BETWEEN_REQUESTS_MS` | `2000` | 1000-5000 |
| `LOG_LEVEL` | `info` | debug, info, warn, error |
| `OUTPUT_DIR` | `./certification-output` | Any path |

### Travel (Optional)

| Env Var | Default | Format |
|---------|---------|--------|
| `TRAVEL_START_DATE` | `2026-07-25T00:00:00` | ISO 8601 |
| `TRIP_DURATION_DAYS` | `7` | 1-365 |

---

## Verification Steps

### ✓ Step 1: Check Output

```bash
ls -la certification-output/
# Should show: case-1, case-2, case-3, case-4, case-5
```

### ✓ Step 2: Verify JSON Files

```bash
ls certification-output/case-1/
# Should show 10+ files including:
# - auth-request.json, auth-response.json
# - search-request.json, search-response.json
# - book-request.json, book-response.json
# - policy-request.json, policy-response.json
# - booking-details-request.json, booking-details-response.json
# - summary.json, summary.txt, case-summary.txt
```

### ✓ Step 3: Check Report

```bash
cat certification-output/certification-summary.txt
# Should show all 5 cases with "SUCCESS" status
```

### ✓ Step 4: Verify Confirmation Numbers

```bash
grep "ConfirmationNumber" certification-output/case-1/summary.txt
# Should show: ConfirmationNumber: TBO-CASE-1-{BookingId}-{Timestamp}
```

---

## Troubleshooting

### Issue: "AUTH_FAILED"

**Cause**: Invalid credentials

**Solution**:
```bash
# Verify credentials in .env.local
cat client/.env.local | grep TBO_INSURANCE

# Test with diagnostics
curl http://localhost:3000/api/tbo-insurance/test-search
```

### Issue: "NO_RESULTS - Insurance not enabled"

**Cause**: TBO hasn't enabled insurance module for your agency

**Solution**: Contact TBO support to enable insurance on your account

### Issue: Network timeouts

**Cause**: Slow/unresponsive TBO servers

**Solution**:
```bash
# Increase timeout
REQUEST_TIMEOUT_MS=60000 npm run insurance-certification

# Increase delays
DELAY_BETWEEN_REQUESTS_MS=5000 npm run insurance-certification
```

### Issue: Some cases fail, others pass

**Cause**: Possible API rate limiting or temporary issues

**Solution**:
```bash
# Run with longer delays
DELAY_BETWEEN_REQUESTS_MS=5000 RETRY_ATTEMPTS=5 npm run insurance-certification

# Re-run individual failing case
npm run insurance-certification -- case-2
```

### Issue: Need to debug step-by-step

**Solution**:
```bash
LOG_LEVEL=debug npm run insurance-certification -- case-1
# Shows detailed logs for every operation
```

---

## Pre-Submission Checklist

Before sending to TBO, verify:

- [ ] All 5 cases show "SUCCESS" in final report
- [ ] certification-output/case-1 through case-5 directories exist
- [ ] Each case directory has exactly 10 JSON files (5 request + 5 response)
- [ ] Each summary.txt includes confirmation number
- [ ] No test credentials visible in JSON files (passwords redacted)
- [ ] certification-report.json shows 100% success rate
- [ ] All booking IDs are non-zero integers
- [ ] All confirmation numbers are non-empty strings

---

## TBO Submission Template

For each case, send this to TBO:

```
Subject: TBO Insurance Certification - Case [X] - [Your Agency Name]

Dear TBO Team,

Please find attached the certification test case [case-X] for approval.

Case Details:
- Case ID: case-X
- Trip Type: [Domestic/Non-US/US-Canada]
- Travellers: [Number of adults]
- Confirmation Number: [TBO-CASE-X-{BookingId}-{Timestamp}]
- Booking ID: [From summary]

Attached Files:
- Folder: certification-output/case-X/
- Contains: 10 JSON files (request/response pairs) + summaries

Status: All validations passed, ready for your review.

Regards,
[Your Name]
[Your Agency]
```

---

## What Gets Sent to TBO

### For Each Case:

**Request/Response JSON Pairs** (5 pairs = 10 files)
1. `auth-request.json` + `auth-response.json`
2. `search-request.json` + `search-response.json`
3. `book-request.json` + `book-response.json`
4. `policy-request.json` + `policy-response.json`
5. `booking-details-request.json` + `booking-details-response.json`

**Summaries** (2 files)
6. `summary.json` (structured data)
7. `summary.txt` (human-readable)

**Optional**:
8. `case-summary.txt` (formatted details)

**Sensitive Data Handling**:
- Passwords are redacted as "[REDACTED]"
- Full TokenIds are redacted except first 20 chars
- API credentials are never exposed

---

## Next Steps

1. **Configure credentials** in `.env.local`
2. **Run all cases** with `npm run insurance-certification`
3. **Verify output** in `certification-output/`
4. **Submit casewise** to TBO (one case per submission)
5. **Track status** via TBO's API portal (4-5 working day turnaround)

---

## Support

For issues:

1. Check `.env.local` credentials
2. Enable debug logging: `LOG_LEVEL=debug`
3. Review step-by-step output in case folders
4. Check detailed README: `scripts/tbo-insurance-certification/README.md`
5. Contact TBO API team with case ID and error message

---

## Timeline

- **Configuration**: 2 minutes
- **First run**: 2-3 minutes (all 5 cases)
- **TBO review**: 4-5 working days
- **Corrections** (if any): 1-2 days
- **Go-live**: After TBO signoff + IP whitelisting

Total: ~1-2 weeks from start to production access.
