# TBO Hold Booking & Voucher Generation

## Overview

**TBO Feature:** Hold booking functionality allows customers to defer voucher generation until later, up to a deadline.

**Key Deadlines from PreBook:**
- `LastVoucherDate` - Must generate voucher by this date/time
- `LastCancellationDeadline` - Can cancel free until this date/time

**Risk:** TBO will not take liability if customer misses voucher deadline.

## Implementation

### 1. Booking Option Selection (Payment Page)

**UI Components:**
- Radio buttons: "Hold Booking" vs "Confirm Now (Generate Voucher)"
- Default: "Hold Booking" (deferred voucher)
- Shows voucher deadline from PreBook

**Data Flow:**
```
User selects option
  ↓
bookingOption = "hold" | "voucher"
  ↓
Book API call with isVoucherBooking = (bookingOption === "voucher")
  ↓
TBO creates booking in HOLD state (if isVoucherBooking=false)
  ↓
Booking stored with hold status
```

### 2. Booking States

| State | isVoucherBooking | Status | Action Needed |
|-------|------------------|--------|---------------|
| Hold | false | "held" | Generate voucher before deadline |
| Voucher Now | true | "confirmed" | None, fully booked |
| Vouchered | false→true | "confirmed" | Deadline met, booking confirmed |
| Expired | false + deadline passed | "cancelled" | Cannot be recovered |

### 3. Voucher Deadline Validation

File: `voucherDeadline.ts`

**Function:** `getVoucherDeadlineInfo(lastVoucherDate)`
- Returns: daysRemaining, isExpired, message
- Message: "Voucher must be generated within X days"

**Function:** `validateVoucherDeadline(lastVoucherDate)`
- Throws error if deadline passed
- Prevents voucher generation after deadline

### 4. PreBook Details Display

**What's Shown:**
- "Cancellation Policy & Hold Deadlines (Final)" section
- Cancel policies with dates and charges
- **Hold Booking Deadline** box showing LastVoucherDate
- Warning: "Generate voucher before deadline"
- Disclaimer: "TBO will not take liability if you miss deadline"

### 5. Booking Management Page

**URL:** `/hotel/booking/[id]`

**Functionality:**
1. Fetch booking details via `/api/hotels/booking/[id]`
2. Check if booking is held: `status === "held" && !voucherStatus`
3. Calculate deadline info: `getVoucherDeadlineInfo(lastVoucherDate)`
4. Show "Generate Voucher" button if not expired
5. Prevent action if deadline passed (HTTP 410)
6. Confirm booking and redirect on success

**Deadline Handling:**
```javascript
// On button click
POST /api/hotels/voucher {
  bookingId: number,
  lastVoucherDate: string  // For validation
}

// Endpoint checks: validateVoucherDeadline(lastVoucherDate)
// If expired: returns HTTP 410 (Gone)
// If valid: calls tboGenerateVoucher()
```

### 6. API Endpoints

#### POST `/api/hotels/book`
```json
{
  "bookingCode": "ABC123",
  "netAmount": 5000,
  "isVoucherBooking": false,  // true = voucher now, false = hold
  "guests": [...],
  "guestNationality": "IN"
}
```

**Response:** BookResult with status

#### POST `/api/hotels/voucher`
```json
{
  "bookingId": 12345,
  "lastVoucherDate": "2026-06-15T23:59:59Z",  // For validation
  "roomsDetails": [...]  // Optional, for deferred PAN
}
```

**Responses:**
- `200`: Voucher generated, booking confirmed
- `410`: Voucher deadline passed, cannot generate
- `422`: Other booking errors
- `500`: Server error

#### GET `/api/hotels/booking/[id]`
```
Fetch booking details including:
- status (held/confirmed/cancelled)
- lastVoucherDate
- lastCancellationDeadline
- voucherStatus
```

## User Journey

### Path A: Hold Booking
```
1. Search & Select Hotel
   ↓
2. PreBook Response
   → lastVoucherDate = "2026-06-20"
   ↓
3. Guest Details Page
   → Fill guest information
   ↓
4. Payment Page
   → Option 1: [✓] Hold Booking (selected)
   → Option 2: Confirm Now
   → Shows: "Generate voucher by 2026-06-20"
   ↓
5. Book API Call
   → isVoucherBooking = false
   ↓
6. Confirmation Page
   → Status: "⏸ On Hold"
   → Booking ID & Reference shown
   ↓
7. Customer Receives Email
   → "Your booking is on hold"
   → "Voucher deadline: 2026-06-20"
   → Link to manage booking
   ↓
8. Customer Opens Booking Page
   → /hotel/booking/[id]
   → Shows "Generate Voucher & Confirm Booking" button
   → Shows countdown to deadline
   ↓
9. Customer Clicks Generate Voucher (before deadline)
   → POST /api/hotels/voucher
   → Voucher generated
   → Booking confirmed
   ↓
10. Success
    → "✓ Voucher generated successfully!"
    → Email with voucher details
```

### Path B: Confirm Immediately
```
1-4. [Same as Path A]
   ↓
5. Payment Page
   → Option 1: Hold Booking
   → Option 2: [✓] Confirm Now (selected)
   ↓
6. Book API Call
   → isVoucherBooking = true
   ↓
7. Confirmation Page
   → Status: "✓ Confirmed"
   → Voucher already generated
   → No further action needed
```

### Path C: Hold Booking + Miss Deadline (Not Recommended)
```
1-8. [Same as Path A]
   ↓
9. Customer Receives Reminder Email
   → "Deadline in 2 days"
   ↓
10. Customer Opens Booking Page
    → /hotel/booking/[id]
    → Shows "Voucher deadline has passed"
    → "Generate Voucher" button DISABLED
    ↓
11. Error State
    → Booking automatically cancelled by TBO
    → TBO won't take liability
    → Customer cannot proceed
    → Must contact support
```

## Deadline Deadlines Logic

```javascript
const deadline = new Date(lastVoucherDate);
const now = new Date();
const daysRemaining = Math.ceil((deadline - now) / (24*60*60*1000));

if (now > deadline) {
  // EXPIRED - cannot generate voucher
  status = "expired";
  message = "Deadline has passed. Booking may be cancelled.";
  canGenerate = false;
} else if (daysRemaining === 0) {
  // TODAY - urgent
  message = "Voucher must be generated TODAY";
  canGenerate = true;
} else if (daysRemaining === 1) {
  // TOMORROW - warning
  message = "Voucher must be generated within 1 day";
  canGenerate = true;
} else {
  // NORMAL - future date
  message = `Voucher must be generated within ${daysRemaining} days`;
  canGenerate = true;
}
```

## Validation Points

### Frontend (Client-Side)
1. ✅ Booking option selection (Hold vs Voucher)
2. ✅ Display deadline on payment page
3. ✅ Show deadline countdown on booking page
4. ✅ Disable button if deadline expired

### Backend (Server-Side)
1. ✅ Validate voucher deadline (POST /api/hotels/voucher)
2. ✅ Return HTTP 410 if deadline passed
3. ✅ Call TBO GenerateVoucher API
4. ✅ Handle timeout with status verification

### TBO API
1. ✅ Validate lastVoucherDate not passed
2. ✅ Generate voucher (confirm booking)
3. ✅ Return confirmation details

## TBO Liability Protection

The implementation protects against liability by:

1. **Clear Communication**
   - Payment page shows deadline prominently
   - PreBook section explains Hold feature
   - Booking page displays deadline countdown

2. **Explicit Disclaimers**
   - "TBO will not take liability if you miss deadline"
   - Shows on payment page and booking page
   - Red warning styling

3. **Deadline Enforcement**
   - Cannot generate voucher after deadline
   - API returns HTTP 410 (Gone)
   - Explains deadline has passed

4. **Customer Acknowledgment**
   - Must select booking option (aware of choice)
   - Sees deadline before confirming
   - Can view deadline anytime on booking page

## Files Modified/Created

**Files Created:**
1. `/client/src/lib/adapters/tbo/hotel/voucherDeadline.ts`
   - Deadline calculation and validation

2. `/client/src/app/hotel/booking/[id]/page.tsx`
   - Booking management page
   - Voucher generation UI
   - Deadline display

**Files Modified:**
1. `/client/src/state/hotelBookingStore.ts`
   - Added isVoucherBooking field

2. `/client/src/app/hotel/[id]/payment/page.tsx`
   - Added booking option selection
   - Display deadlines
   - Pass isVoucherBooking to book API

3. `/client/src/components/accommodation/PreBookDetailsSection.tsx`
   - Enhanced cancellation policy display
   - Added hold deadline section
   - Improved disclaimer

4. `/client/src/app/api/hotels/voucher/route.ts`
   - Added deadline validation
   - Returns HTTP 410 on expired deadline
