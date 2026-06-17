# TBO Insurance API Reference

Complete API documentation for the 5 endpoints used in certification.

## Overview

All endpoints are POST requests with JSON bodies and expect JSON responses.

**Base URLs**:
- Authentication: `http://sharedapi.tektravels.com`
- Insurance APIs: `https://InsuranceBE.tektravels.com`

**Common Headers**:
```
Content-Type: application/json
Accept: application/json
```

---

## 1. Authentication Endpoint

Authenticate and obtain TokenId for subsequent API calls.

### Request

```http
POST http://sharedapi.tektravels.com/SharedData.svc/rest/Authenticate
Content-Type: application/json

{
  "ClientId": "ApiIntegrationNew",
  "UserName": "your_username",
  "Password": "your_password",
  "EndUserIp": "1.1.1.1"
}
```

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ClientId | string | Yes | Always "ApiIntegrationNew" |
| UserName | string | Yes | Your TBO username |
| Password | string | Yes | Your TBO password |
| EndUserIp | string | Yes | Public IP where request originates |

### Response - Success (Status 1)

```json
{
  "Status": 1,
  "TokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

### Response - Failure (Status ≠ 1)

```json
{
  "Status": 2,
  "Error": {
    "ErrorCode": 1,
    "ErrorMessage": "Invalid Username or Password"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| Status | number | 1 = Success, 2+ = Failure |
| TokenId | string | Required for all subsequent API calls |
| Error | object | Present only on failure |
| Error.ErrorCode | number | Error code (see Error Codes) |
| Error.ErrorMessage | string | Human-readable error message |
| Member | object | Agency member details (on success) |

### Error Codes

| Code | Message |
|------|---------|
| 1 | Invalid Username or Password |
| 2 | Account locked or disabled |
| 3 | IP not whitelisted (only on production) |

---

## 2. Insurance Search Endpoint

Search available insurance plans based on trip parameters.

### Request

```http
POST https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Search
Content-Type: application/json

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

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| PlanCategory | number | Yes | 1=Domestic, 2=Overseas |
| PlanType | number | Yes | 1=Annual, 2=Trip-specific |
| PlanCoverage | number | Yes | Coverage type (1-8) |
| TravelStartDate | string | Yes | ISO 8601: YYYY-MM-DDTHH:mm:ss |
| NoOfPax | number | Yes | Number of travelers (1-20) |
| PaxAge | number[] | Yes | Age array [25, 35, ...] |
| EndUserIp | string | Yes | Public IP address |
| TokenId | string | Yes | From Authentication response |

### PlanCategory Values

| Value | Description |
|-------|-------------|
| 1 | Domestic India trip |
| 2 | Overseas/International trip |

### PlanCoverage Values

| Value | Coverage Type |
|-------|---------------|
| 1 | Basic |
| 2 | Standard |
| 3 | Premium |
| 4 | Super Premium |
| 5 | Comprehensive |
| 6 | Gold |
| 7 | Platinum |
| 8 | Diamond |

### Response - Success (ResponseStatus 1)

```json
{
  "Response": {
    "ResponseStatus": 1,
    "TraceId": "TRACE-123-456-789",
    "Results": [
      {
        "ResultIndex": 0,
        "PlanCode": "PLAN-001",
        "PlanType": 1,
        "PlanName": "Standard Insurance Plan",
        "PlanDescription": "Covers hospitalization, emergency evacuation",
        "PlanCoverage": 4,
        "PlanCategory": 1,
        "PolicyStartDate": "2026-07-25T00:00:00",
        "PolicyEndDate": "2026-08-01T23:59:59",
        "PoweredBy": "Supplier Name",
        "SumInsured": "500000",
        "SumInsuredCurrency": "INR",
        "CoverageDetails": [
          {
            "Coverage": "Medical Expense",
            "SumInsured": "500000",
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
            },
            "Price": {
              "Currency": "INR",
              "GrossFare": 300,
              "PublishedPrice": 350,
              "OfferedPrice": 300
            }
          }
        ],
        "Price": {
          "Currency": "INR",
          "GrossFare": 300,
          "PublishedPrice": 350,
          "PublishedPriceRoundedOff": 350,
          "OfferedPrice": 300,
          "OfferedPriceRoundedOff": 300,
          "CommissionEarned": 50
        }
      }
    ]
  }
}
```

### Response - Failure (ResponseStatus ≠ 1)

```json
{
  "Response": {
    "ResponseStatus": 2,
    "Error": {
      "ErrorCode": 2,
      "ErrorMessage": "Insurance inventory not enabled for this agency"
    },
    "TraceId": "TRACE-123-456-789",
    "Results": []
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| ResponseStatus | number | 1 = Success, 2+ = Failure |
| TraceId | string | Trace ID for this search (use in Book call) |
| Results | array | Array of available plans |
| Results[].ResultIndex | number | Index for plan selection in Book call |
| Results[].PlanCode | string | Unique plan identifier |
| Results[].PremiumList | array | Price breakdowns by age group |

### Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 1 | Invalid parameters | Check date format, age values |
| 2 | Insurance not enabled | Contact TBO to enable insurance |
| 3 | No plans available | Check travel dates, destination |

---

## 3. Insurance Book Endpoint

Book a selected insurance plan for passengers.

### Request

```http
POST https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Book
Content-Type: application/json

{
  "TokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "EndUserIp": "1.1.1.1",
  "TraceId": "TRACE-123-456-789",
  "GenerateInsurancePolicy": "false",
  "ResultIndex": 0,
  "Passenger": [
    {
      "Title": "Mr",
      "FirstName": "Traveller",
      "LastName": "One",
      "BeneficiaryName": "Traveller One",
      "RelationShipToInsured": "Self",
      "RelationToBeneficiary": "Self",
      "Gender": "1",
      "Sex": 1,
      "DOB": "1996-01-15T00:00:00",
      "PassportNo": "P123456789",
      "PhoneNumber": "9876543210",
      "EmailId": "traveller1@test.com",
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

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| TokenId | string | Yes | From Authentication |
| EndUserIp | string | Yes | Public IP address |
| TraceId | string | Yes | From Search response |
| GenerateInsurancePolicy | string | Yes | "true" or "false" |
| ResultIndex | number | Yes | From Search Results[].ResultIndex |
| Passenger | array | Yes | Array of passenger objects |
| Passenger[].Title | string | Yes | Mr, Mrs, Miss, Ms, etc. |
| Passenger[].FirstName | string | Yes | Passenger first name |
| Passenger[].LastName | string | Yes | Passenger last name |
| Passenger[].DOB | string | Yes | ISO 8601: YYYY-MM-DDTHH:mm:ss |
| Passenger[].Gender | string | Yes | "1"=Male, "2"=Female |
| Passenger[].Sex | number | Yes | 1=Male, 2=Female |
| Passenger[].PhoneNumber | string | Yes | Contact phone number |
| Passenger[].EmailId | string | Yes | Email address |
| Passenger[].PassportNo | string | Yes | Passport number |
| Passenger[].AddressLine1 | string | Yes | Address line 1 |
| Passenger[].AddressLine2 | string | Yes | Address line 2 |
| Passenger[].CityCode | string | Yes | IATA city code (DEL, BOM, etc.) |
| Passenger[].CountryCode | string | Yes | ISO 3166 country code (IN, US, etc.) |
| Passenger[].PassportCountry | string | Yes | Passport issuing country code |
| Passenger[].MajorDestination | string | Yes | Primary travel destination code |
| Passenger[].PinCode | number | Yes | Postal/ZIP code |
| Passenger[].BeneficiaryName | string | Yes | Beneficiary name (often same as passenger) |
| Passenger[].RelationShipToInsured | string | Yes | "Self" or relationship type |
| Passenger[].RelationToBeneficiary | string | Yes | "Self" or relationship type |

### Response - Success (ResponseStatus 1)

```json
{
  "Response": {
    "ResponseStatus": 1,
    "TraceId": "TRACE-123-456-789",
    "Itinerary": {
      "BookingId": 98765,
      "InsuranceId": 54321,
      "PlanType": 1,
      "PlanName": "Standard Insurance Plan",
      "PlanDescription": "Comprehensive coverage",
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
          "PolicyNo": "POL-2026-123-001",
          "ReferenceId": "REF-123-456",
          "SiebelPolicyNumber": "SBL-123-456",
          "FirstName": "Traveller",
          "LastName": "One",
          "DOB": "1996-01-15",
          "Gender": "Male",
          "Title": "Mr",
          "BeneficiaryName": "Traveller One",
          "RelationShipToInsured": "Self",
          "RelationToBeneficiary": "Self",
          "PhoneNumber": "9876543210",
          "EmailId": "traveller1@test.com",
          "PassportNo": "P123456789",
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
      ],
      "BookingHistory": [
        {
          "CreatedBy": 12345,
          "CreatedByName": "System",
          "CreatedOn": "2026-01-15T10:30:45",
          "EventCategory": 1,
          "Remarks": "Booking created"
        }
      ]
    }
  }
}
```

### Response - Failure

```json
{
  "Response": {
    "ResponseStatus": 2,
    "Error": {
      "ErrorCode": 101,
      "ErrorMessage": "Invalid passenger data"
    },
    "TraceId": "TRACE-123-456-789"
  }
}
```

### Key Response Fields

| Field | Description |
|-------|-------------|
| BookingId | Unique booking identifier (required) |
| Passenger Info[].PolicyNo | Insurance policy number |
| Passenger Info[].ReferenceId | Confirmation/Reference number |
| Status | 1=Success, 2+=Failure |

---

## 4. Generate Policy Endpoint

Generate/finalize policy for a booked insurance.

### Request

```http
POST https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/GeneratePolicy
Content-Type: application/json

{
  "EndUserIp": "1.1.1.1",
  "TokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "BookingId": 98765
}
```

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| EndUserIp | string | Yes | Public IP address |
| TokenId | string | Yes | From Authentication |
| BookingId | number | Yes | From Book response |

### Response

Same structure as Book response (see above).

### Purpose

- Finalizes the insurance policy
- Generates policy document
- Updates booking status to confirmed
- Must be called after successful booking

---

## 5. Get Booking Details Endpoint

Retrieve complete details of a booked insurance.

### Request

```http
POST https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/GetBookingDetails
Content-Type: application/json

{
  "EndUserIp": "1.1.1.1",
  "TokenId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "BookingId": 98765
}
```

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| EndUserIp | string | Yes | Public IP address |
| TokenId | string | Yes | From Authentication |
| BookingId | number | Yes | From Book response |

### Response

Same structure as Book response (see above).

### Purpose

- Retrieves full booking/policy details
- Useful for verification and confirmation
- Can be called multiple times
- Non-destructive read operation

---

## Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 1 | Invalid parameters | Review request payload |
| 2 | Resource not found | Check IDs, TraceId, BookingId |
| 3 | Authentication failed | Verify TokenId, credentials |
| 4 | Authorization failed | Check user permissions |
| 5 | Invalid data format | Validate date, enum values |
| 101 | Invalid passenger data | Check passenger details |
| 102 | Duplicate booking | Check for previous booking |
| 103 | Plan not available | Verify plan exists in search |
| 501 | Server error | Retry after delay |
| 502 | Service unavailable | Retry after delay |

---

## Response Status Codes

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (auth failed) |
| 403 | Forbidden (not permitted) |
| 404 | Not Found |
| 408 | Request Timeout |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |

### TBO ResponseStatus Values

| Code | Meaning |
|------|---------|
| 1 | Success |
| 2 | Failure with error details |
| 3+ | Specific error (see Error Codes) |

---

## Data Formats

### Date Format

All dates use ISO 8601:
```
YYYY-MM-DDTHH:mm:ss
2026-07-25T00:00:00
2026-01-15T10:30:45
```

### Time Format

All times in 24-hour format (UTC or local):
```
00:00:00  (midnight)
12:30:45  (12:30:45 PM)
23:59:59  (11:59:59 PM)
```

### Currency

All prices in INR unless specified otherwise.

### Age Values

- Minimum: 0 (infant)
- Maximum: 100 (elderly)
- Special cases: Handled by plan's premium list

---

## Rate Limiting

TBO may implement rate limiting:

**Limits** (typical):
- 100 requests per minute per agency
- 1000 requests per hour per agency

**Headers** (in response):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
```

**Solution**: Implement delays between requests (2-5 seconds recommended).

---

## Timeouts

Recommended timeouts:
- **Connection timeout**: 10 seconds
- **Read timeout**: 30 seconds
- **Total timeout**: 60 seconds

---

## Security Notes

✓ Always use HTTPS (except auth endpoint in staging)
✓ Never log passwords or full TokenIds
✓ Validate all user inputs before sending
✓ Use endpoint IP whitelisting (provided by TBO)
✓ Implement request signing if required by TBO
✓ Refresh TokenId periodically (TTL: usually 24 hours)

---

## Testing

### Test Credentials

Provided by TBO in email:
- Username: `your_agency_username`
- Password: `your_api_password`
- Environment: Staging first, then Production

### Test Case Parameters

For certification, use provided test cases:
- Domestic 1 Adult: PlanCategory=1, NoOfPax=1, Age=[30]
- Domestic 2 Adults: PlanCategory=1, NoOfPax=2, Age=[30,55]
- Non-US 1 Adult: PlanCategory=2, NoOfPax=1, Age=[35]
- Non-US 2 Adults: PlanCategory=2, NoOfPax=2, Age=[28,60]
- US/Canada 2 Adults: PlanCategory=2, NoOfPax=2, Age=[30,65]

---

## Support

**TBO API Documentation**: https://apidoc.tektravels.com/insurance/
**TBO Support Email**: [contact provided by TBO]
**API Issues**: Include TraceId from response in support ticket

---

## Changelog

### Version 1.0 (Current)
- Authentication endpoint
- Insurance Search
- Book Insurance
- Generate Policy
- Get Booking Details
- Batch booking support (multiple passengers)
- Error handling and retry logic
