==================================================================
SpaksTrip — Flight Sample Verification Logs
==================================================================

Scenario (per TBO SampleVerification.aspx):
  LCC Domestic Return (JT=2), DEL <-> BLR, 2 Adult + 1 Child + 1 Infant
  Outbound: DEL -> BLR on 2026-06-20
  Inbound : BLR -> DEL on 2026-06-27

  Primary destination: BLR
  Fallbacks (in order): CCU, MAA
  The run-sample-verification.js script auto-falls-back if no LCC
  return pair is found for the primary destination.

Pax mix:
  Adult 1 (LeadPax): Mr  RAHUL SHARMA  (Gender 1, DOB 1985-03-15)
  Adult 2          : Mrs PRIYA SHARMA  (Gender 2, DOB 1988-07-22)
  Child            : Mstr ROHAN SHARMA (Gender 1, DOB 2017-05-10)
  Infant (Male)    : Mstr KABIR SHARMA (Gender 1, DOB 2025-01-20)

------------------------------------------------------------------
HOW TO USE THIS FOLDER
------------------------------------------------------------------
Option A — Automated (recommended)
  cd /home/rishi215/spaksTrip
  node scripts/run-sample-verification.js
  # Reads TBO creds from client/.env.local
  # Tries DEL<->BLR first, falls back to CCU then MAA
  # Writes every request + response into this folder
  # Builds consolidated.txt automatically

Option B — Manual (Postman)
1. Import ../test-cases/SpaksTrip_SampleVerification.postman_collection.json
   into Postman.
2. Set collection variables: TBO_USERNAME, TBO_PASSWORD, END_USER_IP.
3. Run steps 1 -> 11 in order. Test scripts auto-populate
   TOKEN, TRACE_ID, ResultIndexes, per-pax fares, BookingIds, PNRs.
4. For each step, copy:
     - the rendered REQUEST body  -> the matching *Request.txt file
     - the full RESPONSE body     -> the matching *Response.txt file
5. Concatenate everything (in order) into consolidated.txt.

Either way, email consolidated.txt to TBO with subject:
  "Flight Sample verification - SpaksTrip"

------------------------------------------------------------------
FILE ORDER (matches the Postman collection steps)
------------------------------------------------------------------
  01. authRequest.txt                  / authResponse.txt
  02. searchRequest.txt                / searchResponse.txt
  03. fareRuleRequest.txt              / fareRuleResponse.txt
  04. fareQuoteObRequest.txt           / fareQuoteObResponse.txt
  05. fareQuoteIbRequest.txt           / fareQuoteIbResponse.txt
  06. ssrObRequest.txt                 / ssrObResponse.txt
  07. ssrIbRequest.txt                 / ssrIbResponse.txt
  08. ticketObRequest.txt              / ticketObResponse.txt
  09. ticketIbRequest.txt              / ticketIbResponse.txt
  10. getBookingDetailsObRequest.txt   / getBookingDetailsObResponse.txt
  11. getBookingDetailsIbRequest.txt   / getBookingDetailsIbResponse.txt

  consolidated.txt  - final file to send to TBO

------------------------------------------------------------------
SAMPLE VERIFICATION RULES (all enforced by this collection)
------------------------------------------------------------------
1.  Same TokenId + TraceId throughout the booking session.
2.  Search criteria fixed (Domestic Return, 2A+1C+1I, DEL<->BOM).
3.  Same ResultIndex per leg from Search -> FareRule -> FareQuote -> Ticket.
4.  IsLeadPax = true only for Adult 1; false for everyone else.
5.  Gender, Title, AddressLine1, City, CountryCode, Nationality,
    CountryName passed for ALL four passengers.
6.  Title matches Gender (Mr=1, Mrs=2, Mstr=male child/infant).
7.  Male infant Title = "Mstr".
8.  LCC SSR fields (Baggage/MealDynamic/SeatDynamic) are OMITTED
    in the Ticket payload because no SSR is being selected for the
    sample. (Per rule: "do not pass blank nodes" when SSR not used.)
    Infant carries no Baggage / Seat in any case.
9.  Child + Infant DOB present in every Ticket request.
    (Adult DOB also included for completeness; optional for domestic LCC.)
10. Per-pax BaseFare / Tax / YQTax in Ticket request = FareBreakdown
    value / PassengerCount, captured automatically by the FareQuote
    test script and stored in OB_/IB_ collection variables.
