# PAN (Permanent Account Number) Validation

## Overview

**TBO Requirement:** PAN validation must be implemented per TBO Hotel API specifications. TBO sends PAN requirements in the PreBook response which MUST be followed. **TBO will NOT take liability for financial loss if PAN validation is missing or incomplete.**

## Implementation Strategy

### 1. Two-Source Requirement Determination

PAN requirement is determined from **TWO sources** (OR logic):

#### Source 1: Nationality-Based Rules (Hard-coded)
File: `nationalityValidation.ts:54-64`

```
Indian national + International hotel → PAN REQUIRED
Foreign national + Domestic hotel → Passport REQUIRED
Other combinations → No document required
```

#### Source 2: PreBook Response (Dynamic from TBO)
File: `hotelBookingStore.ts:29`

```
PreBook.panMandatory = boolean (from TBO Hotel API)
PreBook.passportMandatory = boolean (from TBO Hotel API)
```

**Logic:** `panRequired = nationalityRule.panRequired OR preBook.panMandatory`

If EITHER source says it's required, it's required.

### 2. PAN Format Validation

**Pattern:** `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`

**Example:** `AAAPN5055K`

**Components:**
- Position 1-5: 5 uppercase letters (A-Z)
- Position 6-9: 4 digits (0-9)
- Position 10: 1 uppercase letter (A-Z)

**Error Messages:**
- Empty: "PAN is required"
- Invalid format: "Invalid PAN format. Expected: AAAPN5055K"

### 3. Frontend Form Display

File: `components/accommodation/GuestDetailsForm.tsx`

**Flow:**
1. Receive `preBookPanMandatory` prop from parent
2. Calculate: `panRequired = identityReq.panRequired OR preBookPanMandatory`
3. Show PAN input only if `panRequired = true`
4. Display blue info box: "ℹ PAN is mandatory per TBO Hotel API requirements" (if from PreBook)
5. Show "*" (asterisk) indicating required field
6. Display hint: "10 characters (5 letters, 4 digits, 1 letter)"

### 4. Backend Validation

File: `app/api/hotels/book/route.ts`

**Server-Side Checks:**
```typescript
// Validate PAN format before sending to TBO
if (panRequired && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
  return err("Invalid PAN format", 400);
}
```

Returns HTTP 400 if PAN is invalid.

### 5. Guest Details Page Validation

File: `app/hotel/[id]/guest/page.tsx`

**On Form Submission:**
1. Check if PAN required: `panRequired = nationalityRule OR preBook.panMandatory`
2. If required, validate using `validatePAN()`
3. Prevent form submission if PAN is invalid
4. Show error message: "Invalid PAN format. Expected: AAAPN5055K"
5. Block progression to payment page

### 6. User Guidance & Disclaimer

**In PreBook Details Section:**
- Display "Required Documents" section showing PAN/Passport requirements
- Show source: "PAN (Permanent Account Number) required for all guests"
- Display disclaimer: "TBO will not take any liability for financial loss if mandatory documents are not provided or invalid"

**On Guest Form:**
- Show hint about format
- Show blue info if PAN required per PreBook
- Inline validation errors

## User Journey

```
1. Search & Select Hotel
   ↓
2. PreBook Request
   → TBO returns: panMandatory = true/false
   ↓
3. Guest Page Loads
   → GuestDetailsForm receives: preBookPanMandatory
   → Form determines: panRequired = nationality rule OR preBook.panMandatory
   ↓
4. User Fills Guest Details
   → Form shows PAN input (if required)
   → Hint: "10 characters (5 letters, 4 digits, 1 letter)"
   → Example: "AAAPN5055K"
   ↓
5. User Submits Form
   → Validation checks: validatePAN(pan)
   → If invalid → Show error, block submission
   → If valid → Allow progression
   ↓
6. Payment Page
   → Book API called with validated PAN
   → Backend validates again before sending to TBO
   ↓
7. TBO API Receives
   → PAN already validated ✓
   → No failures due to PAN format
```

## Validation Points

### Frontend (Client-Side)
1. ✅ Format validation: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
2. ✅ Required field check
3. ✅ Error message display
4. ✅ Form submission gate

### Backend (Server-Side)
1. ✅ Format validation before TBO call
2. ✅ HTTP 400 on invalid format
3. ✅ Error logging

### TBO API
1. ✅ Already validated format
2. ✅ Reduced failure rate
3. ✅ Better user experience

## TBO Liability

**From TBO:**
> "Please make sure to have implemented the PAN validations from your end. You'll receive the corresponding nodes in the Pre Book Response which needs to be followed to pass the details from your end. If the same has not been made clear on the website or the user misses then TBO will not take any liability for any financial loss."

**Implementation Guarantees:**
1. ✅ PAN validation implemented client-side
2. ✅ PAN validation implemented server-side
3. ✅ PreBook response flags respected (panMandatory)
4. ✅ Requirements clearly displayed to user
5. ✅ Disclaimer shown before booking
6. ✅ User cannot proceed without valid PAN (when required)

## Testing Scenarios

### Scenario 1: Indian National + International Hotel
- PreBook.panMandatory = true
- Nationality rule: panRequired = true
- Result: PAN REQUIRED (from both sources)
- User cannot proceed without valid PAN

### Scenario 2: Indian National + Domestic Hotel
- PreBook.panMandatory = false
- Nationality rule: panRequired = false
- Result: PAN OPTIONAL (from both sources)
- User can proceed without PAN

### Scenario 3: Indian National + International Hotel (with PreBook override)
- PreBook.panMandatory = true (explicit override)
- Nationality rule: panRequired = true
- Result: PAN REQUIRED (from both sources)
- User cannot proceed without valid PAN

### Scenario 4: Invalid PAN Format
- User enters: "AAAPN505K" (9 characters, missing digit)
- Validation result: INVALID
- Error message: "Invalid PAN format. Expected: AAAPN5055K"
- Form submission blocked

### Scenario 5: Valid PAN Format
- User enters: "AAAPN5055K"
- Validation result: VALID
- Form submission allowed

## Files Modified

1. `components/accommodation/GuestDetailsForm.tsx`
   - Added preBookPanMandatory, preBookPassportMandatory props
   - Calculate panRequired and passportRequired with OR logic
   - Display blue info box for PreBook-sourced requirements
   - Show TBO requirement clarification

2. `app/hotel/[id]/guest/page.tsx`
   - Pass preBook.panMandatory and preBook.passportMandatory to form
   - Update validation logic to respect both sources
   - Block submission if PAN invalid and required

3. `components/accommodation/PreBookDetailsSection.tsx`
   - Expanded disclaimer to include PAN/Passport validation
   - Clear warning about TBO liability
   - Show what documents are required

4. `lib/validators/nationalityValidation.ts` (existing)
   - validatePAN() function already present
   - PAN format pattern already correct
