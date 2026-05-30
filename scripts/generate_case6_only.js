#!/usr/bin/env node
// Builds Case6_Only.postman_collection.json — a focused collection containing
// only Case 6 (LCC Special Return JT=5). Every request body is spelled out
// inline (no helper functions) so it's easy to hand-edit in Postman or in the
// generated JSON file directly.
//
// Edit points:
//   1. This file → re-run `node test-cases/generate_case6_only.js`
//   2. Generated JSON → search the step name → edit `request.body.raw`
//   3. Postman UI → import the JSON, edit the Body tab
//   4. Programmatic → tbo-hooks.js (runs after var substitution)

'use strict';
const fs = require('fs');
const path = require('path');

const BASE = 'https://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest';
const AUTH_URL_STR = 'https://sharedapi.tektravels.com/SharedData.svc/rest/Authenticate';

function tboUrl(ep) {
  return {
    raw: `${BASE}/${ep}`,
    protocol: 'https',
    host: ['api', 'tektravels', 'com'],
    path: ['BookingEngineService_Air', 'AirService.svc', 'rest', ep],
  };
}
function authUrl() {
  return {
    raw: AUTH_URL_STR,
    protocol: 'https',
    host: ['sharedapi', 'tektravels', 'com'],
    path: ['SharedData.svc', 'rest', 'Authenticate'],
  };
}
function req(name, url, body, exec) {
  const r = {
    name,
    request: {
      method: 'POST',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } },
      url,
    },
  };
  if (exec && exec.length) r.event = [{ listen: 'test', script: { exec, type: 'text/javascript' } }];
  return r;
}

// ── Test scripts (auto-capture vars between steps) ──────────────────────────

const AUTH_TEST = [
  "var r = pm.response.json();",
  "var tok = r && (r.TokenId || (r.Response && (r.Response.TokenId || (r.Response.TokenAgentDetails && r.Response.TokenAgentDetails.TokenId))));",
  "if (tok) { pm.collectionVariables.set('TOKEN', tok); console.log('TOKEN:', tok); }",
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
];

const SEARCH_TEST = [
  "var r = pm.response.json();",
  "var resp = r && r.Response;",
  "if (resp && resp.TraceId) pm.collectionVariables.set('TRACE_ID', resp.TraceId);",
  "function flatten(x) { return Array.isArray(x) ? x[0] : x; }",
  "function pickLcc(arr) {",
  "  if (!Array.isArray(arr) || !arr.length) return null;",
  "  var lcc = arr.find(function (f) { var fl = flatten(f); return fl && fl.IsLCC === true; });",
  "  return lcc ? flatten(lcc) : flatten(arr[0]);",
  "}",
  "var results = resp && resp.Results;",
  "if (Array.isArray(results) && results.length && Array.isArray(results[0])) {",
  "  var ob = pickLcc(results[0]);",
  "  var ib = pickLcc(results[1]);",
  "  if (ob && ob.ResultIndex) pm.collectionVariables.set('OB_RESULT_INDEX', ob.ResultIndex);",
  "  if (ib && ib.ResultIndex) pm.collectionVariables.set('IB_RESULT_INDEX', ib.ResultIndex);",
  "  console.log('Auto OB:', ob && ob.ResultIndex);",
  "  console.log('Auto IB:', ib && ib.ResultIndex);",
  "}",
];

const FQ_TEST = [
  "var r = pm.response.json();",
  "var resp = r && r.Response;",
  "var res  = resp && resp.Results;",
  "if (resp && resp.TraceId) pm.collectionVariables.set('FQ_TRACE_ID', resp.TraceId);",
  "if (res && res.ResultIndex) {",
  "  pm.collectionVariables.set('FQ_RESULT_INDEX', res.ResultIndex);",
  "  console.log('FQ_RESULT_INDEX:', res.ResultIndex);",
  "}",
  "if (res && res.IsLCC !== undefined) pm.collectionVariables.set('IS_LCC', String(res.IsLCC));",
  "if (res && res.FareBreakdown) {",
  "  res.FareBreakdown.forEach(function (bd) {",
  "    var c = bd.PassengerCount || 1;",
  "    var pt = bd.PassengerType;",
  "    var b = String(bd.BaseFare / c);",
  "    var t = String(bd.Tax / c);",
  "    var y = String((bd.YQTax || 0) / c);",
  "    if (pt === 1) { pm.collectionVariables.set('ADT_BASE_FARE', b); pm.collectionVariables.set('ADT_TAX', t); pm.collectionVariables.set('ADT_YQ_TAX', y); }",
  "    else if (pt === 2) { pm.collectionVariables.set('CHD_BASE_FARE', b); pm.collectionVariables.set('CHD_TAX', t); pm.collectionVariables.set('CHD_YQ_TAX', y); }",
  "  });",
  "}",
];

const TICKET_TEST = [
  "var r = pm.response.json();",
  "var inner = (r && r.Response && r.Response.Response) || (r && r.Response) || {};",
  "var fi = inner.FlightItinerary || null;",
  "if (fi) {",
  "  var nums = (fi.Passenger || []).map(function (p) { return p.Ticket && p.Ticket.TicketNumber; }).filter(Boolean);",
  "  console.log('Tickets:', nums.join(', '));",
  "  console.log('Status:', fi.BookingStatus, '(1=Confirmed)');",
  "  if (fi.BookingId) pm.collectionVariables.set('BOOKING_ID', String(fi.BookingId));",
  "  if (fi.PNR) pm.collectionVariables.set('PNR', fi.PNR);",
  "}",
];

// ── Inline passenger objects (Case 6 = 2 ADT + 1 CHD, all domestic) ─────────

const FARE_ADT = {
  Currency: 'INR',
  BaseFare: '{{ADT_BASE_FARE}}',
  Tax: '{{ADT_TAX}}',
  TaxBreakup: [],
  YQTax: '{{ADT_YQ_TAX}}',
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
const FARE_CHD = {
  ...FARE_ADT,
  BaseFare: '{{CHD_BASE_FARE}}',
  Tax: '{{CHD_TAX}}',
  YQTax: '{{CHD_YQ_TAX}}',
};

const GST = {
  GSTCompanyAddress: '',
  GSTCompanyContactNumber: '',
  GSTCompanyName: '',
  GSTNumber: '',
  GSTCompanyEmail: '',
};

const PAX_ADULT_LEAD = {
  Title: 'Mr',
  FirstName: 'RAHUL',
  LastName: 'SHARMA',
  PaxType: 1,
  DateOfBirth: '1985-03-15T00:00:00',
  Gender: 1,
  AddressLine1: '45 Prithviraj Road',
  City: 'New Delhi',
  CountryCode: 'IN',
  CountryName: 'India',
  Nationality: 'IN',
  Email: 'rahul.sharma@example.com',
  ContactNo: '9810001234',
  IsLeadPax: true,
  ...GST,
  Fare: FARE_ADT,
  Baggage: [],
  MealDynamic: [],
  SeatDynamic: [],
};
const PAX_ADULT_2 = {
  ...PAX_ADULT_LEAD,
  FirstName: 'PRIYA',
  Gender: 2,
  Title: 'Mrs',
  DateOfBirth: '1988-07-22T00:00:00',
  Email: '',
  ContactNo: '',
  IsLeadPax: false,
};
const PAX_CHILD = {
  Title: 'Mstr',
  FirstName: 'ROHAN',
  LastName: 'SHARMA',
  PaxType: 2,
  DateOfBirth: '2017-05-10T00:00:00',
  Gender: 1,
  AddressLine1: '45 Prithviraj Road',
  City: 'New Delhi',
  CountryCode: 'IN',
  CountryName: 'India',
  Nationality: 'IN',
  Email: '',
  ContactNo: '',
  IsLeadPax: false,
  ...GST,
  Fare: FARE_CHD,
  Baggage: [],
  MealDynamic: [],
  SeatDynamic: [],
};

// ── Request bodies (inline, hand-editable) ──────────────────────────────────

const STEP1_AUTH = {
  ClientId: 'ApiIntegrationNew',
  UserName: '{{TBO_USERNAME}}',
  Password: '{{TBO_PASSWORD}}',
  EndUserIp: '{{END_USER_IP}}',
};

const STEP2_SEARCH = {
  TokenId: '{{TOKEN}}',
  EndUserIp: '{{END_USER_IP}}',
  AdultCount: '2',
  ChildCount: '1',
  InfantCount: '0',
  DirectFlight: 'false',
  OneStopFlight: 'false',
  JourneyType: '5',
  PreferredAirlines: null,
  Segments: [
    {
      Origin: 'DEL',
      Destination: 'MAA',
      FlightCabinClass: '2',
      PreferredDepartureTime: '2026-06-15T00:00:00',
      PreferredArrivalTime: '2026-06-15T00:00:00',
    },
    {
      Origin: 'MAA',
      Destination: 'DEL',
      FlightCabinClass: '2',
      PreferredDepartureTime: '2026-06-22T00:00:00',
      PreferredArrivalTime: '2026-06-22T00:00:00',
    },
  ],
  Sources: null,
};

const STEP3_FARERULE = {
  TokenId: '{{TOKEN}}',
  EndUserIp: '{{END_USER_IP}}',
  ResultIndex: '{{OB_RESULT_INDEX}},{{IB_RESULT_INDEX}}',
  TraceId: '{{TRACE_ID}}',
};

const STEP4_FAREQUOTE = {
  TokenId: '{{TOKEN}}',
  EndUserIp: '{{END_USER_IP}}',
  ResultIndex: '{{OB_RESULT_INDEX}},{{IB_RESULT_INDEX}}',
  TraceId: '{{TRACE_ID}}',
};

const STEP5_TICKET = {
  PreferredCurrency: 'INR',
  AgentReferenceNo: '',
  IsBaseCurrencyRequired: true,
  TokenId: '{{TOKEN}}',
  EndUserIp: '{{END_USER_IP}}',
  TraceId: '{{FQ_TRACE_ID}}',
  ResultIndex: '{{FQ_RESULT_INDEX}}',
  Passengers: [PAX_ADULT_LEAD, PAX_ADULT_2, PAX_CHILD],
};

const STEP6_GBD = {
  TokenId: '{{TOKEN}}',
  EndUserIp: '{{END_USER_IP}}',
  BookingId: '{{BOOKING_ID}}',
};

// ── Case folder ─────────────────────────────────────────────────────────────

const case6 = {
  name: 'Case 6 — LCC Special Return · 2A+1C · 6E DEL↔MAA (JT=5, one PNR)',
  item: [
    req('Step 1 — Authenticate', authUrl(),         STEP1_AUTH,     AUTH_TEST),
    req('Step 2 — Search (JT=5, 2A+1C, DEL↔MAA)', tboUrl('Search'),    STEP2_SEARCH,   SEARCH_TEST),
    req('Step 3 — FareRule (OB,IB comma-separated)', tboUrl('FareRule'),  STEP3_FARERULE, []),
    req('Step 4 — FareQuote (OB,IB comma-separated — returns FQ_RESULT_INDEX)', tboUrl('FareQuote'), STEP4_FAREQUOTE, FQ_TEST),
    req('Step 5 — Ticket (LCC, use FQ_RESULT_INDEX — covers both legs)', tboUrl('Ticket'),    STEP5_TICKET,   TICKET_TEST),
    req('Step 6 — GetBookingDetails', tboUrl('GetBookingDetails'), STEP6_GBD, []),
  ],
};

const VARS = [
  ['TBO_USERNAME', ''],
  ['TBO_PASSWORD', ''],
  ['END_USER_IP', '1.1.1.1'],
  ['TOKEN', ''],
  ['TRACE_ID', ''],
  ['OB_RESULT_INDEX', ''],
  ['IB_RESULT_INDEX', ''],
  ['FQ_TRACE_ID', ''],
  ['FQ_RESULT_INDEX', ''],
  ['IS_LCC', ''],
  ['BOOKING_ID', ''],
  ['PNR', ''],
  ['ADT_BASE_FARE', '0'],
  ['ADT_TAX', '0'],
  ['ADT_YQ_TAX', '0'],
  ['CHD_BASE_FARE', '0'],
  ['CHD_TAX', '0'],
  ['CHD_YQ_TAX', '0'],
].map(([key, value]) => ({ key, value, type: 'string' }));

const description = [
  'Case 6 only — LCC Special Return (JT=5) DEL↔MAA, 2A+1C, one PNR.',
  '',
  'Each step\'s body is a plain JSON block, edit-in-place friendly:',
  ' - In Postman: import this file, click a request, edit Body → raw.',
  ' - In text editor: open this file, find the step name, edit `request.body.raw`.',
  ' - In source: edit test-cases/generate_case6_only.js, regenerate.',
  '',
  'Flow: Authenticate → Search → FareRule (OB,IB) → FareQuote (OB,IB) → Ticket → GetBookingDetails.',
  'Variables auto-captured: TOKEN, TRACE_ID, OB/IB_RESULT_INDEX, FQ_TRACE_ID, FQ_RESULT_INDEX, IS_LCC, BOOKING_ID, PNR, per-pax fare.',
].join('\n');

const collection = {
  info: {
    _postman_id: 'tbo-case6-only-2026',
    name: 'TBO Air API — Case 6 only (LCC Special Return JT=5)',
    description,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: VARS,
  item: [case6],
};

const out = path.join(__dirname, 'Case6_Only.postman_collection.json');
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
console.log('Written:', out);
console.log('Size:', Math.round(fs.statSync(out).size / 1024), 'KB');
