# TBO Hotel Booking Cancellation

## Overview

**TBO Requirement:** Implement cancellation with proper error handling.

**On Error/Timeout:**
1. Call BookingDetail API to verify final status
2. Check if booking was actually cancelled
3. If still unable to verify, report to ops@tbo.com
4. TBO team will process manually

**Key Points:**
- Don't assume cancellation succeeded just because API succeeded
- Don't assume cancellation failed just because of timeout
- Always verify final status via BookingDetail
- Manual escalation path to ops team if needed

## Implementation

### 1. Cancel Request API (`POST /api/hotels/cancel`)

**Endpoint:** `POST /api/hotels/cancel`

**Request:**
```json
{
  "bookingId": 12345,
  "bookingRefNo": "TBO123456",
  "remarks": "Customer-initiated cancellation",
  "endUserIp": "1.2.3.4"
}
```

**Response on Success (200):**
```json
{
  "success": true,
  "data": {
    "changeRequestId": 999,
    "status": "Pending|InProgress|Processed|Rejected",
    "refundAmount": 5000,
    "cancellationCharge": 0,
    "bookingId": 12345,
    "bookingRefNo": "TBO123456"
  }
}
```

**Response on Timeout (408):**
```json
{
  "success": false,
  "error": "Cancel request timed out after 120 seconds. Booking status verified: CANCELLED ✓"
}
```

**Response on Error (422):**
```json
{
  "success": false,
  "error": "Cannot cancel: [reason]. If issue persists, contact ops@tbo.com with reference: TBO123456"
}
```

### 2. Error Handling Flow

```
POST /api/hotels/cancel
  ↓
tboSendChangeRequest() with 120s timeout
  ↓
┌─ SUCCESS ──────────────────┐
│ ChangeRequestId received   │
│ Call GetChangeRequestStatus│
│ Return status to client    │
└────────────────────────────┘
  ↓
┌─ TIMEOUT (120s exceeded) ──────────────────┐
│ Catch isTimeoutError()                     │
│ Cannot trust response                      │
│ Fallback: Call BookingDetail API           │
│ Verify booking status                      │
│ Return verified status with HTTP 408       │
└────────────────────────────────────────────┘
  ↓
┌─ BOOKING DETAIL VERIFICATION ──────┐
│ If isCancelled → Return "CANCELLED"│
│ If still confirmed → Return status │
│ If detail fails → Recommend ops    │
└────────────────────────────────────┘
  ↓
┌─ REGULAR ERROR ────────────────────────────┐
│ HTTP error, JSON parse error, etc.         │
│ Log error                                  │
│ Return HTTP 422 or 500                     │
│ Include ops@tbo.com contact info           │
└────────────────────────────────────────────┘
```

### 3. Cancel Status API (`GET /api/hotels/cancel/status`)

**Endpoint:** `GET /api/hotels/cancel/status?changeRequestId=999&bookingRefNo=TBO123456`

**Query Parameters:**
- `changeRequestId` (required): From cancel response
- `bookingRefNo` (optional): For fallback verification

**Response:**
```json
{
  "success": true,
  "data": {
    "changeRequestId": 999,
    "status": "Pending|InProgress|Processed|Rejected",
    "refundAmount": 5000,
    "cancellationCharge": 0
  }
}
```

**Fallback if status check fails:**
```json
{
  "success": true,
  "data": {
    "changeRequestId": 999,
    "status": "InProgress",
    "bookingStatus": "Confirmed|Cancelled",
    "note": "Verified via BookingDetail: [status]"
  }
}
```

### 4. Timeout Handling

**Timeout Duration:** 120 seconds (per TBO recommendation)

**When Timeout Occurs:**
1. Log: "Cancel request timed out"
2. Do NOT assume cancellation failed
3. Call BookingDetail with BookingRefNo
4. Check if booking status is "Cancelled"
5. Return HTTP 408 with verified status
6. Client can retry status check or contact support

**Code Flow:**
```typescript
try {
  res = await fetchWithTimeout(TBO_SEND_CHANGE_URL, {
    timeoutMs: 120000  // 120 second cutoff
  });
} catch (err) {
  if (isTimeoutError(err)) {
    // Timeout occurred - verify via BookingDetail
    const booking = await tboGetHotelBookingDetail({ bookingRefNo });
    const isCancelled = booking.bookingStatus === "Cancelled";
    return {
      status: 408,
      error: `Timed out. Status verified: ${isCancelled ? "CANCELLED ✓" : booking.bookingStatus}`
    };
  }
  throw err;
}
```

### 5. Manual Escalation Path

**When to escalate:**
- Cancel API returns error and BookingDetail check also fails
- Cannot determine final booking status
- Customer needs manual assistance

**Escalation Process:**
1. Log error with full details
2. Return error message with ops email
3. Include booking reference and timestamp
4. Customer contacts ops@tbo.com
5. TBO team processes manually offline

**Email Template for Customer:**
```
Subject: Hotel Booking Cancellation - Manual Assistance Required

Dear Customer,

Your request to cancel booking [BookingRefNo] could not be processed automatically.
Please contact our support team at ops@tbo.com with the following information:

Booking Reference: [BookingRefNo]
Booking ID: [BookingId]
Timestamp: [RequestTime]
Request Status: [LastKnownStatus]

The TBO operations team will manually process your cancellation and provide
confirmation within 24 business hours.

Best regards,
[Your Travel Company]
```

## User Journey

### Path A: Successful Cancellation

```
1. Customer opens booking page
   → Sees "Cancel Booking" button
   ↓
2. Click "Cancel Booking"
   → Confirmation modal appears
   → Shows cancellation charges
   ↓
3. Customer confirms cancellation
   ↓
4. POST /api/hotels/cancel
   → TBO processes immediately
   → Returns changeRequestId
   ↓
5. Check status (optional)
   → GET /api/hotels/cancel/status?changeRequestId=999
   → Shows "Processed"
   ↓
6. Success
   → Status: "✓ Cancelled"
   → Refund amount shown
   → Email confirmation sent
```

### Path B: Cancellation Request Pending

```
1-4. [Same as Path A]
   ↓
5. TBO processing is slow
   → GET /api/hotels/cancel/status
   → Shows "InProgress"
   ↓
6. Customer waits
   → Notification: "Your cancellation is being processed"
   ↓
7. Later: Status check again
   → Shows "Processed"
   → Booking cancelled
```

### Path C: Timeout During Cancel (Critical)

```
1-4. [Same as Path A]
   ↓
5. TBO server slow or no response
   → 120 seconds pass
   → fetchWithTimeout() aborts
   ↓
6. Timeout Error Handler
   → isTimeoutError() = true
   → Fallback: tboGetHotelBookingDetail()
   → Check booking status
   ↓
7. Case 1: BookingDetail shows "Cancelled"
   → Return HTTP 408: "Status verified: CANCELLED ✓"
   → Customer sees: Success! Booking cancelled.
   
7. Case 2: BookingDetail shows "Confirmed"
   → Return HTTP 408: "Status verified: Still Confirmed"
   → Customer sees: Cancellation still pending. Retry later.
   
7. Case 3: BookingDetail call also fails
   → Return HTTP 408: "Cannot verify. Contact ops@tbo.com"
   → Customer must contact support
```

### Path D: Manual Escalation (Rare)

```
1-6. [Same as Path C]
   ↓
7. Both cancel and detail checks fail
   → Cannot determine status
   → Cannot recover automatically
   ↓
8. Return error with ops@tbo.com
   → Customer receives error message
   → Includes booking reference
   ↓
9. Customer contacts ops@tbo.com
   → Provides booking reference
   ↓
10. TBO team processes manually
    → Cancels booking offline
    → Confirms to customer
    → Email confirmation sent
```

## Validation Points

### Frontend (Client-Side)
1. ✅ Confirmation dialog before cancel
2. ✅ Show cancellation charges
3. ✅ Show refund amount
4. ✅ Disable button while processing
5. ✅ Display status updates

### Backend (Server-Side)
1. ✅ Validate bookingId and bookingRefNo
2. ✅ 120-second timeout on cancel request
3. ✅ Timeout detection and fallback
4. ✅ BookingDetail verification on timeout
5. ✅ Error logging and escalation info

### TBO API
1. ✅ Process cancellation request
2. ✅ Return changeRequestId
3. ✅ Provide status via GetChangeRequestStatus
4. ✅ Support BookingDetail for verification

## Files Created

1. **`client/src/app/api/hotels/cancel/route.ts`**
   - Main cancel endpoint
   - Error handling with fallback
   - Timeout recovery via BookingDetail
   - Escalation recommendations

2. **`client/src/app/api/hotels/cancel/status/route.ts`**
   - Status polling endpoint
   - Fallback verification
   - Status tracking

3. **`CANCEL_HANDLING.md`** (this file)
   - Complete documentation
   - Error scenarios
   - User journeys

## Files Modified

1. **`client/src/lib/adapters/tbo/hotel/sendChangeRequest.ts`**
   - Added fetchWithTimeout import
   - Added timeout handling (120s)
   - Enhanced error logging

## Testing Scenarios

### Scenario 1: Normal Cancellation
1. POST /api/hotels/cancel with bookingId
2. TBO responds successfully
3. Return changeRequestId and status
✅ **Expected**: Cancellation initiated

### Scenario 2: Slow Processing
1. POST /api/hotels/cancel
2. Status = "InProgress"
3. Customer polls GET /api/hotels/cancel/status
4. Eventually returns "Processed"
✅ **Expected**: Customer can track progress

### Scenario 3: Timeout (Worst Case)
1. POST /api/hotels/cancel
2. 120 seconds pass, no response
3. Timeout caught, fallback to BookingDetail
4. BookingDetail shows "Cancelled"
5. Return HTTP 408 with verified status
✅ **Expected**: Customer knows booking IS cancelled despite timeout

### Scenario 4: Timeout + Verification Fails
1. POST /api/hotels/cancel → timeout
2. Fallback: BookingDetail → also fails
3. Return HTTP 408: "Cannot verify. Contact ops@tbo.com"
✅ **Expected**: Customer guided to manual escalation

### Scenario 5: API Error
1. POST /api/hotels/cancel
2. TBO returns error (e.g., booking not found)
3. Return HTTP 422 with error message
✅ **Expected**: Clear error, customer knows what went wrong

## Compliance Checklist

✅ Cancel method implemented
✅ 120-second timeout enforced
✅ Timeout detection and logging
✅ BookingDetail fallback on timeout
✅ Status verification before returning to customer
✅ Escalation path to ops@tbo.com
✅ Clear error messages
✅ Manual escalation information provided
✅ API for status polling
✅ Comprehensive error handling
