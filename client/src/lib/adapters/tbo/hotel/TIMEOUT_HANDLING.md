# TBO Hotel Booking Timeout Handling

## Overview

**TBO Recommendation:** Booking processing cutoff is 120 seconds. If booking takes longer, don't wait indefinitely. Instead, call BookingDetail API using BookingId to verify final status and avoid financial loss.

## Architecture

### 1. Timeout Enforcement (`timeout.ts`)
- **Function:** `fetchWithTimeout()` wraps fetch with AbortController-based timeout
- **Cutoff:** 120 seconds (120,000 ms) per TBO recommendation
- **Error Class:** `TimeoutError` extends Error with timeout duration
- **Usage:** All TBO API calls should use this wrapper

### 2. Book Request with Timeout (`hotel/book.ts`)
- **Implementation:**
  - Book request uses `fetchWithTimeout` with 120-second cutoff
  - On timeout, throws `TboBookingFailedError` with user-friendly message
  - Includes `clientReferenceId` in error for tracking
  - Logs timeout event with "Attempting to verify booking status..." message

- **Error Handling:**
  - Detects `TimeoutError` or `AbortError` specifically
  - Distinguishes timeout from other network errors
  - Provides recovery path via BookingDetail

### 3. API Route Handler (`route.ts`)
- **Status Codes:**
  - `200`: Booking succeeded
  - `408`: Request Timeout (indicates timeout, not failure)
  - `422`: TBO booking failed
  - `500`: Server error

- **Timeout Detection:**
  - Detects timeout in error message
  - Returns HTTP 408 instead of 500
  - Message directs user to verify booking status

### 4. Timeout Recovery (`bookingRecovery.ts`)
- **Function:** `verifyBookingStatusAfterTimeout()`
  - Takes partial booking details (bookingId, confirmationNo, etc.)
  - Calls BookingDetail API to check actual status
  - Returns found/not-found with booking details
  - Non-throwing; returns error in result

- **Function:** `getTimeoutRecoveryMessage()`
  - User-friendly timeout explanation
  - Step-by-step recovery instructions
  - Reference ID for support

### 5. Status Verification Endpoint (`book/verify/route.ts`)
- **Purpose:** POST `/api/hotels/book/verify`
- **Input:** bookingId, confirmationNo, traceId, clientReferenceId
- **Output:** Complete booking details or 404 if not found
- **Use Case:** Client-side timeout recovery, checking booking later

### 6. Frontend Hook (`useBook.ts`)
- **New State:**
  - `timedOut: boolean` - Indicates request timed out
  - `clientRefId?: string` - Reference ID for recovery

- **Flow:**
  1. User clicks Pay
  2. makeBooking() is called
  3. Response status 408 → sets `timedOut = true`
  4. Error message shows recovery steps
  5. User can check email, account, or contact support

### 7. Payment Page (`payment/page.tsx`)
- **Timeout Handling:**
  - Detects timeout in `error` state
  - Shows "Booking Request Timed Out" warning
  - Displays next steps toast message
  - Provides reference ID for support

## User Journey on Timeout

```
User clicks "Pay"
    ↓
Request sent to /api/hotels/book
    ↓
[After 120 seconds no response]
    ↓
Timeout error thrown
    ↓
HTTP 408 returned to frontend
    ↓
useBook detects 408, sets timedOut=true
    ↓
Payment page shows:
  - Warning: "Booking Request Timed Out"
  - Instructions:
    1. Check email for confirmation
    2. Check account dashboard
    3. Reference ID: [clientRefId]
    ↓
User can:
a) Check email/account → booking may be confirmed
b) POST /api/hotels/book/verify with clientReferenceId → verify status
c) Contact support with reference ID
```

## Guarantees

1. **120-Second Cutoff:** Booking request will not wait indefinitely
2. **Status Verification:** Timeout doesn't mean booking failed; status can be checked via BookingDetail
3. **No Double Charges:** BookingDetail verifies actual TBO system state
4. **User-Friendly:** Clear error messages and recovery steps
5. **Reference Tracking:** clientReferenceId enables backend reconciliation

## API Flows Involved

### On Success (HTTP 200)
```
/api/hotels/book → tboBookHotel() → fetchWithTimeout(TBO_BOOK_URL)
  ↓
TBO responds with booking details
  ↓
Return HotelBookOutput
```

### On Timeout (HTTP 408)
```
/api/hotels/book → tboBookHotel() → fetchWithTimeout(TBO_BOOK_URL)
  ↓
[120 seconds pass, no response]
  ↓
TimeoutError thrown
  ↓
Route catches, returns HTTP 408
  ↓
Frontend shows timeout message with recovery steps
  ↓
Later: /api/hotels/book/verify → tboGetHotelBookingDetail()
  ↓
Verify actual status at TBO
```

## Testing Timeout Handling

To test timeout scenarios locally:
1. Add delay in booking stub (e.g., `await sleep(150000)`)
2. Trigger booking → should timeout after 120s
3. Verify HTTP 408 response
4. Check error message and recovery instructions
5. Call `/api/hotels/book/verify` with clientReferenceId
6. Should return booking status from TBO

## Future Enhancements

1. **Automatic Retry:** Auto-call BookingDetail every 10 seconds for 5 minutes
2. **SMS Notification:** Send SMS with reference ID and status link
3. **Backend Reconciliation:** Periodically reconcile pending timeout bookings
4. **WebSocket Update:** Push notification when status confirmed
