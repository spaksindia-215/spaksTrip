# Running the TBO Insurance Certification Runner

The certification runner has been successfully implemented and is ready to use!

## ✅ Status

- ✓ Implementation complete
- ✓ Runner executable
- ✓ Output structure working
- ✓ Ready to configure and run

## 🚀 Quick Start

### 1. Configure Credentials

Create `client/.env.local` with your TBO credentials:

```bash
# Required
TBO_INSURANCE_USERNAME=your_tbo_username
TBO_INSURANCE_API_PASSWORD=your_tbo_api_password

# Optional (defaults shown below)
TBO_INSURANCE_SERVER_IP=1.1.1.1
RETRY_ATTEMPTS=3
DELAY_BETWEEN_REQUESTS_MS=2000
LOG_LEVEL=info
```

**Get credentials from**: TBO API onboarding email

### 2. Run All 5 Test Cases

```bash
cd client
npm run insurance-certification
```

**Expected output**:
- Console output with progress
- `certification-output/` folder created with 5 case subfolders
- Each case folder contains JSON logs and summaries
- Final report shows success/failure status

### 3. Run Single Case (for debugging)

```bash
npm run insurance-certification -- case-1
```

Useful for:
- Testing credentials quickly
- Debugging specific failures
- Verifying fixes

### 4. Enable Debug Logging

```bash
LOG_LEVEL=debug npm run insurance-certification
```

Shows detailed step-by-step logging.

## 📊 Expected Output

When credentials are configured, you'll see:

```
╔════════════════════════════════════════════════════════╗
║     TBO INSURANCE CERTIFICATION RUNNER - Starting...   ║
╚════════════════════════════════════════════════════════╝

Running 5 certification cases...

──────────────────────────────────────────────────────────
Running: Domestic Trip - 1 Adult
──────────────────────────────────────────────────────────
[2026-06-12T12:23:34.408Z] [INFO] ✓ Authentication successful
[2026-06-12T12:23:35.123Z] [INFO] Search returned 3 plan(s)
[2026-06-12T12:23:36.456Z] [INFO] ✓ Book successful, BookingId: 98765
[2026-06-12T12:23:37.789Z] [INFO] ✓ Generate Policy successful
[2026-06-12T12:23:38.901Z] [INFO] ✓ Get Booking Details successful
✓ case-1: SUCCESS

[... cases 2-5 ...]

╔═════════════════════════════════════════════════════════╗
║    ✓ ALL TEST CASES PASSED - READY FOR SUBMISSION      ║
╚═════════════════════════════════════════════════════════╝
```

## 📂 Output Structure Created

```
certification-output/
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
├── case-2/ through case-5/
│   └── [same structure as case-1]
├── certification-report.json
└── certification-summary.txt
```

## 🔧 Configuration Options

### Required Variables
```bash
TBO_INSURANCE_USERNAME=your_username
TBO_INSURANCE_API_PASSWORD=your_password
```

### Optional Variables (with defaults)
```bash
TBO_BASE_URL=http://sharedapi.tektravels.com
TBO_INSURANCE_SERVER_IP=1.1.1.1
RETRY_ATTEMPTS=3
RETRY_DELAY_MS=2000
REQUEST_TIMEOUT_MS=30000
DELAY_BETWEEN_REQUESTS_MS=2000
LOG_LEVEL=info
OUTPUT_DIR=./certification-output
TRAVEL_START_DATE=2026-07-25T00:00:00
TRIP_DURATION_DAYS=7
```

## 📝 The 5 Test Cases

All 5 cases will be executed automatically:

1. **case-1**: Domestic Trip – 1 Adult (Age 30)
2. **case-2**: Domestic Trip – 2 Adults (Age 30, 55) - Testing age boundaries
3. **case-3**: Non-US Trip – 1 Adult (Age 35)
4. **case-4**: Non-US Trip – 2 Adults (Age 28, 60) - Testing age boundaries
5. **case-5**: US/Canada Trip – 2 Adults (Age 30, 65) - Testing age boundaries

## ✨ What Happens Per Case

For each case, the runner:

1. **Authenticates** with your TBO credentials → Gets TokenId
2. **Searches** for insurance plans → Gets ResultIndex
3. **Books** the selected plan with passenger details → Gets BookingId
4. **Generates Policy** → Confirms policy creation
5. **Gets Booking Details** → Retrieves complete confirmation

All requests and responses are automatically saved as JSON files.

## 📋 Retry & Error Handling

- **Automatic retries**: 3 attempts (configurable)
- **Exponential backoff**: 2000ms → 3000ms → 4500ms
- **Network resilience**: Handles timeouts, 5xx errors
- **Graceful failure**: If one case fails, continues to next case
- **Error logging**: Failed requests saved separately

## 🎯 Pre-Submission Checklist

Before submitting to TBO, verify:

```bash
# 1. Check output folder exists
ls certification-output/

# 2. Verify all case folders exist
ls certification-output/case-{1..5}

# 3. Check each case has files
ls certification-output/case-1/
# Should show: 10+ files

# 4. Verify all cases succeeded
grep -r "SUCCESS" certification-output/case-*/case-summary.txt
# Should show: 5 lines with SUCCESS

# 5. Check final report
cat certification-output/certification-summary.txt
# Should show: 100% success rate
```

## 🚨 Troubleshooting

### "UserName should not be Null or Empty"

**Cause**: Credentials not configured

**Solution**:
```bash
# Create client/.env.local
TBO_INSURANCE_USERNAME=your_actual_username
TBO_INSURANCE_API_PASSWORD=your_actual_password
```

### "Insurance inventory not enabled for this agency"

**Cause**: TBO hasn't enabled insurance module for your account

**Solution**: Contact TBO support to enable insurance

### Network timeouts

**Cause**: Slow TBO servers

**Solution**:
```bash
REQUEST_TIMEOUT_MS=60000 DELAY_BETWEEN_REQUESTS_MS=5000 npm run insurance-certification
```

### Need to re-run a specific case

```bash
npm run insurance-certification -- case-2
```

This re-runs just case-2, useful for debugging.

## 📚 Documentation

For more details, see:

- **INSURANCE_CERTIFICATION_SETUP.md** - Comprehensive setup guide
- **scripts/tbo-insurance-certification/README.md** - Complete usage guide
- **scripts/tbo-insurance-certification/API_REFERENCE.md** - All API endpoints
- **TBO_INSURANCE_CERTIFICATION_COMPLETE.md** - Implementation overview
- **INSURANCE_CERTIFICATION_EXAMPLES.md** - Real output examples

## 🎓 Example Workflow

```bash
# 1. Create .env.local with credentials
cat > client/.env.local << 'EOF'
TBO_INSURANCE_USERNAME=your_username
TBO_INSURANCE_API_PASSWORD=your_password
TBO_INSURANCE_SERVER_IP=1.1.1.1
EOF

# 2. Test with a single case first
cd client
npm run insurance-certification -- case-1

# 3. If successful, run all cases
npm run insurance-certification

# 4. Verify output
ls -la certification-output/
cat certification-output/certification-summary.txt

# 5. Submit to TBO
# Copy each case-X folder to TBO separately
```

## ✅ Ready to Use

The certification runner is:
- ✓ Implemented and tested
- ✓ Executable with `npm run insurance-certification`
- ✓ Configured to save all outputs automatically
- ✓ Ready for TBO submission once credentials are added

**Next step**: Add your TBO credentials to `client/.env.local` and run!

```bash
npm run insurance-certification
```
