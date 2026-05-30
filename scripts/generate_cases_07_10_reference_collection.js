#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const OUT_FILE = path.join(__dirname, "TBO_Cases_07_10_Reference.postman_collection.json");
const BASE = "https://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest";
const AUTH_URL = "https://sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";

function endpointUrl(endpoint) {
  return {
    raw: `${BASE}/${endpoint}`,
    protocol: "https",
    host: ["api", "tektravels", "com"],
    path: ["BookingEngineService_Air", "AirService.svc", "rest", endpoint],
  };
}

function authUrl() {
  return {
    raw: AUTH_URL,
    protocol: "https",
    host: ["sharedapi", "tektravels", "com"],
    path: ["SharedData.svc", "rest", "Authenticate"],
  };
}

function asRaw(body) {
  return typeof body === "string" ? body : JSON.stringify(body, null, 2);
}

function request(name, url, body, exec) {
  const item = {
    name,
    request: {
      method: "POST",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: {
        mode: "raw",
        raw: asRaw(body),
        options: { raw: { language: "json" } },
      },
      url,
    },
  };

  if (exec?.length) {
    item.event = [{ listen: "test", script: { exec, type: "text/javascript" } }];
  }
  return item;
}

const AUTH_TEST = [
  "var r = pm.response.json();",
  "var token = r && (r.TokenId || (r.Response && r.Response.TokenId) || (r.Response && r.Response.TokenAgentDetails && r.Response.TokenAgentDetails.TokenId));",
  "if (token) { pm.collectionVariables.set('TOKEN', token); console.log('TOKEN:', token); }",
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
];

const TRACE_CAPTURE_TEST = [
  "var r = pm.response.json();",
  "var trace = r && r.Response && r.Response.TraceId;",
  "if (trace) { pm.collectionVariables.set('TRACE_ID', trace); console.log('TRACE_ID:', trace); }",
];

const FARE_QUOTE_TEST = [
  "var r = pm.response.json(), resp = r && r.Response, res = resp && resp.Results;",
  "if (resp && resp.TraceId) pm.collectionVariables.set('FQ_TRACE_ID', resp.TraceId);",
  "if (res && res.IsLCC !== undefined) pm.collectionVariables.set('IS_LCC', String(res.IsLCC));",
  "if (res && res.ResultIndex) pm.collectionVariables.set('FQ_RESULT_INDEX', res.ResultIndex);",
  "if (res && res.FareBreakdown) {",
  "  res.FareBreakdown.forEach(function (bd) {",
  "    var c = bd.PassengerCount || 1;",
  "    var base = String((bd.BaseFare || 0) / c);",
  "    var tax = String((bd.Tax || 0) / c);",
  "    var yq = String((bd.YQTax || 0) / c);",
  "    if (bd.PassengerType === 1) { pm.collectionVariables.set('ADT_BASE_FARE', base); pm.collectionVariables.set('ADT_TAX', tax); pm.collectionVariables.set('ADT_YQ_TAX', yq); }",
  "    if (bd.PassengerType === 2) { pm.collectionVariables.set('CHD_BASE_FARE', base); pm.collectionVariables.set('CHD_TAX', tax); pm.collectionVariables.set('CHD_YQ_TAX', yq); }",
  "    if (bd.PassengerType === 3) { pm.collectionVariables.set('INF_BASE_FARE', base); pm.collectionVariables.set('INF_TAX', tax); pm.collectionVariables.set('INF_YQ_TAX', yq); }",
  "  });",
  "}",
];

const STATIC_SSR_TEST = [
  "var r = pm.response.json(), resp = r && r.Response;",
  "var meal = resp && resp.Meal && resp.Meal[0];",
  "var seat = resp && (resp.SeatPreference && resp.SeatPreference[0]);",
  "if (meal) { pm.collectionVariables.set('MEAL_CODE', meal.Code || ''); pm.collectionVariables.set('MEAL_DESCRIPTION', meal.Description || ''); }",
  "if (seat) { pm.collectionVariables.set('SEAT_CODE', seat.Code || ''); pm.collectionVariables.set('SEAT_DESCRIPTION', seat.Description || ''); }",
  "console.log('MEAL_CODE:', pm.collectionVariables.get('MEAL_CODE'), 'SEAT_CODE:', pm.collectionVariables.get('SEAT_CODE'));",
];

const PRICE_RBD_TEST = [
  "var r = pm.response.json(), resp = r && r.Response, res = resp && resp.Results;",
  "var first = Array.isArray(res) ? (Array.isArray(res[0]) ? res[0][0] : res[0]) : res;",
  "if (resp && resp.TraceId) pm.collectionVariables.set('RBD_TRACE_ID', resp.TraceId);",
  "if (first && first.ResultIndex) { pm.collectionVariables.set('RBD_RESULT_INDEX', first.ResultIndex); console.log('RBD_RESULT_INDEX:', first.ResultIndex); }",
];

const BOOK_TEST = [
  "var r = pm.response.json(), resp = r && r.Response, inner = resp && (resp.Response || resp), fi = inner && inner.FlightItinerary;",
  "var bookingId = (inner && inner.BookingId) || (fi && fi.BookingId);",
  "var pnr = (inner && inner.PNR) || (fi && fi.PNR);",
  "if (bookingId !== undefined && bookingId !== null) pm.collectionVariables.set('BOOKING_ID', String(bookingId));",
  "if (pnr) pm.collectionVariables.set('PNR', pnr);",
  "console.log('BOOKING_ID:', pm.collectionVariables.get('BOOKING_ID'), 'PNR:', pm.collectionVariables.get('PNR'));",
];

const TICKET_TEST = [
  "var r = pm.response.json(), resp = r && r.Response, inner = resp && (resp.Response || resp), fi = inner && inner.FlightItinerary;",
  "if (fi) {",
  "  var nums = (fi.Passenger || []).map(function (p) { return p.Ticket && p.Ticket.TicketNumber; }).filter(Boolean);",
  "  if (fi.BookingId) pm.collectionVariables.set('BOOKING_ID', String(fi.BookingId));",
  "  if (fi.PNR) pm.collectionVariables.set('PNR', fi.PNR);",
  "  console.log('Tickets:', nums.join(', '));",
  "}",
];

function fare(prefix) {
  return {
    Currency: "INR",
    BaseFare: `{{${prefix}_BASE_FARE}}`,
    Tax: `{{${prefix}_TAX}}`,
    TaxBreakup: [],
    YQTax: `{{${prefix}_YQ_TAX}}`,
    AdditionalTxnFeeOfrd: 0,
    AdditionalTxnFeePub: 0,
    PGCharge: 0,
    OtherCharges: 0,
    ChargeBU: [],
    Discount: 0,
    PublishedFare: 0,
    CommissionEarned: 0,
    PLBEarned: 0,
    IncentiveEarned: 0,
    OfferedFare: 0,
    TdsOnCommission: 0,
    TdsOnPLB: 0,
    TdsOnIncentive: 0,
    ServiceFee: 0,
  };
}

function basePassenger(overrides) {
  return {
    AddressLine1: "123, Test",
    AddressLine2: "",
    City: "Gurgaon",
    CountryCode: "IN",
    CountryName: "India",
    Nationality: "IN",
    ContactNo: "",
    Email: "",
    IsLeadPax: false,
    FFAirlineCode: null,
    FFNumber: "",
    GSTCompanyAddress: "",
    GSTCompanyContactNumber: "",
    GSTCompanyName: "",
    GSTNumber: "",
    GSTCompanyEmail: "",
    ...overrides,
  };
}

// Minimal Non-LCC GDS Special Return passenger schema for Case 07.
// No Meal/Seat (avoids "Invalid Meal Data" when SSR returns no codes).
// No Passport (domestic, not required). No GST fields. Hardcoded fares.
const case07BookPassengers = [
  {
    Title: "Mr", FirstName: "RAHUL", LastName: "SHARMA",
    PaxType: 1, DateOfBirth: "1985-03-15T00:00:00", Gender: 1,
    AddressLine1: "45 Prithviraj Road", City: "New Delhi",
    CountryCode: "IN", CountryName: "India", Nationality: "IN",
    Email: "rahul.sharma@example.com", ContactNo: "9810001234",
    IsLeadPax: true,
    Fare: { Currency: "INR", BaseFare: 16620, Tax: 5912, YQTax: 2796 },
  },
  {
    Title: "Mrs", FirstName: "PRIYA", LastName: "SHARMA",
    PaxType: 1, DateOfBirth: "1988-07-22T00:00:00", Gender: 2,
    AddressLine1: "45 Prithviraj Road", City: "New Delhi",
    CountryCode: "IN", CountryName: "India", Nationality: "IN",
    Email: "", ContactNo: "", IsLeadPax: false,
    Fare: { Currency: "INR", BaseFare: 16620, Tax: 5912, YQTax: 2796 },
  },
  {
    Title: "Mstr", FirstName: "ROHAN", LastName: "SHARMA",
    PaxType: 2, DateOfBirth: "2017-05-10T00:00:00", Gender: 1,
    AddressLine1: "45 Prithviraj Road", City: "New Delhi",
    CountryCode: "IN", CountryName: "India", Nationality: "IN",
    Fare: { Currency: "INR", BaseFare: 13296, Tax: 5744, YQTax: 2796 },
  },
  {
    Title: "Miss", FirstName: "RIYA", LastName: "SHARMA",
    PaxType: 2, DateOfBirth: "2016-08-20T00:00:00", Gender: 2,
    AddressLine1: "45 Prithviraj Road", City: "New Delhi",
    CountryCode: "IN", CountryName: "India", Nationality: "IN",
    Fare: { Currency: "INR", BaseFare: 13296, Tax: 5744, YQTax: 2796 },
  },
  {
    Title: "Mstr", FirstName: "KABIR", LastName: "SHARMA",
    PaxType: 3, DateOfBirth: "2025-01-20T00:00:00", Gender: 1,
    AddressLine1: "45 Prithviraj Road", City: "New Delhi",
    CountryCode: "IN", CountryName: "India", Nationality: "IN",
    Fare: { Currency: "INR", BaseFare: 3332, Tax: 1634, YQTax: 0 },
  },
];

const case10BookPassengers = [
  basePassenger({
    Title: "Mr",
    FirstName: "PaxOne",
    LastName: "Adult",
    PaxType: 1,
    DateOfBirth: "1987-01-17T00:00:00",
    Gender: 1,
    PassportNo: "KJHHJKJRJH",
    PassportExpiry: "2030-12-06T00:00:00",
    ContactNo: "9849876477",
    Email: "harsh@tbtq.in",
    IsLeadPax: true,
    Fare: fare("ADT"),
    Meal: { Code: "{{MEAL_CODE}}", Description: "{{MEAL_DESCRIPTION}}" },
  }),
  basePassenger({
    Title: "Mr",
    FirstName: "PaxTwo",
    LastName: "Adult",
    PaxType: 1,
    DateOfBirth: "1983-08-13T00:00:00",
    Gender: 1,
    PassportNo: "KJHHJMFKJH",
    PassportExpiry: "2030-12-06T00:00:00",
    ContactNo: "9829979077",
    Email: "harsh@tbtq.in",
    Fare: fare("ADT"),
  }),
  basePassenger({
    Title: "Mr",
    FirstName: "PaxThree",
    LastName: "Child",
    PaxType: 2,
    DateOfBirth: "2015-02-21T00:00:00",
    Gender: 1,
    PassportNo: "KJHHSODKJH",
    PassportExpiry: "2030-12-06T00:00:00",
    ContactNo: "9829989077",
    Email: "harsh@tbtq.in",
    Fare: fare("CHD"),
  }),
  basePassenger({
    Title: "Mr",
    FirstName: "PaxFour",
    LastName: "Child",
    PaxType: 2,
    DateOfBirth: "2015-11-04T00:00:00",
    Gender: 1,
    PassportNo: "KJHHHJYKJH",
    PassportExpiry: "2030-11-06T00:00:00",
    ContactNo: "9829821277",
    Email: "harsh@tbtq.in",
    Fare: fare("CHD"),
  }),
  basePassenger({
    Title: "Mstr",
    FirstName: "PaxFive",
    LastName: "Infant",
    PaxType: 3,
    DateOfBirth: "2019-12-06T00:00:00",
    Gender: 1,
    PassportNo: "KJHHTGPOJH",
    PassportExpiry: "2030-12-06T00:00:00",
    ContactNo: "9845810077",
    Email: "harsh@tbtq.in",
    Fare: fare("INF"),
  }),
];

const priceRbdBody = `{
  "AdultCount": "2",
  "ChildCount": "2",
  "InfantCount": "1",
  "EndUserIp": "1.1.1.1",
  "TokenId": "{{TOKEN}}",
  "TraceId": "{{TRACE_ID}}",
  "AirSearchResult": [
    {{SEARCH_AIR_SEARCH_RESULT}}
  ]
}`;

const collection = {
  info: {
    _postman_id: "tbo-reference-cases-07-10-2026",
    name: "TBO Reference Cases 07 and 10",
    description: [
      "Focused TBO Postman collection built from:",
      "- info/NONLCCDomesticSpecialReturnSSR2Adult2Child1Infant/",
      "- info/NONLCCAdvanceSearchPriceRBD2Adult2Child1Infant/",
      "",
      "Case 07 keeps the domestic GDS special-return SSR flow.",
      "Case 10 uses the PriceRBD + SSR flow from the 2A+2C+1I reference sample.",
    ].join("\n"),
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "TBO_USERNAME", value: "", type: "string" },
    { key: "TBO_PASSWORD", value: "", type: "string" },
    { key: "TOKEN", value: "", type: "string" },
    { key: "TRACE_ID", value: "", type: "string" },
    { key: "OB_RESULT_INDEX", value: "", type: "string" },
    { key: "IB_RESULT_INDEX", value: "", type: "string" },
    { key: "FQ_RESULT_INDEX", value: "", type: "string" },
    { key: "FQ_TRACE_ID", value: "", type: "string" },
    { key: "BOOKING_ID", value: "", type: "string" },
    { key: "PNR", value: "", type: "string" },
    { key: "ADT_BASE_FARE", value: "0", type: "string" },
    { key: "ADT_TAX", value: "0", type: "string" },
    { key: "ADT_YQ_TAX", value: "0", type: "string" },
    { key: "CHD_BASE_FARE", value: "0", type: "string" },
    { key: "CHD_TAX", value: "0", type: "string" },
    { key: "CHD_YQ_TAX", value: "0", type: "string" },
    { key: "INF_BASE_FARE", value: "0", type: "string" },
    { key: "INF_TAX", value: "0", type: "string" },
    { key: "INF_YQ_TAX", value: "0", type: "string" },
    { key: "SEARCH_RESULT_INDEX", value: "", type: "string" },
    { key: "SEARCH_AIR_SEARCH_RESULT", value: "", type: "string" },
    { key: "RBD_RESULT_INDEX", value: "", type: "string" },
    { key: "RBD_TRACE_ID", value: "", type: "string" },
    { key: "MEAL_CODE", value: "", type: "string" },
    { key: "MEAL_DESCRIPTION", value: "", type: "string" },
    { key: "SEAT_CODE", value: "", type: "string" },
    { key: "SEAT_DESCRIPTION", value: "", type: "string" },
    { key: "IS_LCC", value: "", type: "string" },
    { key: "CASE07_FROM", value: "DEL", type: "string" },
    { key: "CASE07_TO", value: "BOM", type: "string" },
    { key: "CASE07_OUTBOUND_DATE", value: "2026-08-25", type: "string" },
    { key: "CASE07_INBOUND_DATE", value: "2026-08-28", type: "string" },
    { key: "CASE10_FROM", value: "DEL", type: "string" },
    { key: "CASE10_TO", value: "DXB", type: "string" },
    { key: "CASE10_DATE", value: "2026-08-20", type: "string" },
  ],
  item: [
    {
      name: "Case 07 — GDS Domestic Special Return SSR · 2A+2C+1I",
      item: [
        request("Step 1 — Authenticate", authUrl(), {
          ClientId: "ApiIntegrationNew",
          UserName: "{{TBO_USERNAME}}",
          Password: "{{TBO_PASSWORD}}",
          EndUserIp: "1.1.1.1",
        }, AUTH_TEST),
        request("Step 2 — Search (JT=5, GDS domestic special return)", endpointUrl("Search"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          AdultCount: "2",
          ChildCount: "2",
          InfantCount: "1",
          DirectFlight: "false",
          OneStopFlight: "false",
          JourneyType: "5",
          PreferredAirlines: null,
          Segments: [
            {
              Origin: "{{CASE07_FROM}}",
              Destination: "{{CASE07_TO}}",
              FlightCabinClass: "1",
              PreferredDepartureTime: "{{CASE07_OUTBOUND_DATE}}T00:00:00",
              PreferredArrivalTime: "{{CASE07_OUTBOUND_DATE}}T00:00:00",
            },
            {
              Origin: "{{CASE07_TO}}",
              Destination: "{{CASE07_FROM}}",
              FlightCabinClass: "1",
              PreferredDepartureTime: "{{CASE07_INBOUND_DATE}}T00:00:00",
              PreferredArrivalTime: "{{CASE07_INBOUND_DATE}}T00:00:00",
            },
          ],
          Sources: ["GDS"],
        }, TRACE_CAPTURE_TEST),
        request("Step 3 — FareRule (OB result)", endpointUrl("FareRule"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          TraceId: "{{TRACE_ID}}",
          ResultIndex: "{{OB_RESULT_INDEX}}",
        }),
        request("Step 4 — FareQuote (OB result)", endpointUrl("FareQuote"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          TraceId: "{{TRACE_ID}}",
          ResultIndex: "{{OB_RESULT_INDEX}}",
        }, FARE_QUOTE_TEST),
        request("Step 5 — SSR (static meal/seat preferences)", endpointUrl("SSR"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          TraceId: "{{FQ_TRACE_ID}}",
          ResultIndex: "{{FQ_RESULT_INDEX}}",
        }, STATIC_SSR_TEST),
        request("Step 6 — Book (Non-LCC, no Meal/Seat)", endpointUrl("Book"), {
          TokenId: "{{TOKEN}}",
          EndUserIp: "1.1.1.1",
          TraceId: "{{FQ_TRACE_ID}}",
          ResultIndex: "{{FQ_RESULT_INDEX}}",
          Passengers: case07BookPassengers,
        }, BOOK_TEST),
        request("Step 7 — Ticket", endpointUrl("Ticket"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          TraceId: "{{FQ_TRACE_ID}}",
          PNR: "{{PNR}}",
          BookingId: "{{BOOKING_ID}}",
        }, TICKET_TEST),
        request("Step 8 — GetBookingDetails", endpointUrl("GetBookingDetails"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          PNR: "{{PNR}}",
          BookingId: "{{BOOKING_ID}}",
        }),
      ],
    },
    {
      name: "Case 10 — GDS Advance Search PriceRBD + SSR · 2A+2C+1I",
      item: [
        request("Step 1 — Authenticate", authUrl(), {
          ClientId: "ApiIntegrationNew",
          UserName: "{{TBO_USERNAME}}",
          Password: "{{TBO_PASSWORD}}",
          EndUserIp: "1.1.1.1",
        }, AUTH_TEST),
        request("Step 2 — Search (JT=4, advance search)", endpointUrl("Search"), {
          AdultCount: "2",
          ChildCount: "2",
          InfantCount: "1",
          JourneyType: "4",
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          Segments: [
            {
              Origin: "{{CASE10_FROM}}",
              Destination: "{{CASE10_TO}}",
              FlightCabinClass: "1",
              PreferredDepartureTime: "{{CASE10_DATE}}T00:00:00",
              PreferredArrivalTime: "{{CASE10_DATE}}T00:00:00",
            },
          ],
          IsBaseCurrencyRequired: false,
          GSTDetailsRequired: false,
          PreferredAirlines: [],
          PreferredCurrency: "INR",
          Sources: ["GDS"],
        }, TRACE_CAPTURE_TEST),
        request("Step 3 — PriceRBD", endpointUrl("PriceRBD"), priceRbdBody, PRICE_RBD_TEST),
        request("Step 4 — FareRule (priced RBD)", endpointUrl("FareRule"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          TraceId: "{{RBD_TRACE_ID}}",
          ResultIndex: "{{RBD_RESULT_INDEX}}",
        }),
        request("Step 5 — FareQuote (priced RBD)", endpointUrl("FareQuote"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          TraceId: "{{RBD_TRACE_ID}}",
          ResultIndex: "{{RBD_RESULT_INDEX}}",
        }, FARE_QUOTE_TEST),
        request("Step 6 — SSR", endpointUrl("SSR"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          TraceId: "{{RBD_TRACE_ID}}",
          ResultIndex: "{{RBD_RESULT_INDEX}}",
        }, STATIC_SSR_TEST),
        request("Step 7 — Book (PriceRBD + SSR)", endpointUrl("Book"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          TraceId: "{{FQ_TRACE_ID}}",
          ResultIndex: "{{RBD_RESULT_INDEX}}",
          Passengers: case10BookPassengers,
        }, BOOK_TEST),
        request("Step 8 — Ticket", endpointUrl("Ticket"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          TraceId: "{{FQ_TRACE_ID}}",
          PNR: "{{PNR}}",
          BookingId: "{{BOOKING_ID}}",
        }, TICKET_TEST),
        request("Step 9 — GetBookingDetails", endpointUrl("GetBookingDetails"), {
          EndUserIp: "1.1.1.1",
          TokenId: "{{TOKEN}}",
          PNR: "{{PNR}}",
          BookingId: "{{BOOKING_ID}}",
        }),
      ],
    },
  ],
};

fs.writeFileSync(OUT_FILE, JSON.stringify(collection, null, 2));
console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
