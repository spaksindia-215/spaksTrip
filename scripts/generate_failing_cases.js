#!/usr/bin/env node
// Builds Failing_Cases.postman_collection.json covering the 7 cases that were
// failing in the certification run (Cases 1, 2, 3, 4, 5, 6, 8).
//
// Fixes vs. the original collection:
//  - Non-LCC Book passenger SSR uses Meal:{Code,Description} and Seat:{Code,Description}
//    as single objects (NOT arrays), with Description as the integer 2.
//  - Infants in Non-LCC Book carry Seat:{Code:"NoSeat",Description:2} (no real seat).
//  - JT=5 (Case 6, LCC Special Return) sends OB-only ResultIndex to FareQuote;
//    its FQ response yields a single FQ_RESULT_INDEX used for Ticket.
//  - Search test scripts auto-extract TraceId + first ResultIndex per direction.
//  - FareQuote auto-extracts FQ_RESULT_INDEX + FQ_TRACE_ID + IS_LCC + per-pax fare.
//  - SSR test scripts auto-extract Baggage/Meal codes for ADT/CHD/INF.

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

// ── Test scripts ─────────────────────────────────────────────────────────────

const AUTH_TEST = [
  "var r = pm.response.json();",
  "var tok = r && (r.TokenId || (r.Response && (r.Response.TokenId || (r.Response.TokenAgentDetails && r.Response.TokenAgentDetails.TokenId))));",
  "if (tok) { pm.collectionVariables.set('TOKEN', tok); console.log('TOKEN:', tok); }",
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
  "var err = r && (r.Error || (r.Response && r.Response.Error));",
  "if (err && err.ErrorCode && String(err.ErrorCode) !== '0') console.warn('Auth error:', err.ErrorCode, err.ErrorMessage);",
];

// Auto-pick first result per direction; prefer IsLCC=true when the case is LCC
// (case name contains "LCC" but not "GDS"). Capture TraceId and chosen ResultIndex.
const SEARCH_TEST = [
  "var r = pm.response.json();",
  "var resp = r && r.Response;",
  "if (resp && resp.TraceId) pm.collectionVariables.set('TRACE_ID', resp.TraceId);",
  "var caseName = (pm.info && pm.info.requestName) ? pm.info.requestName : '';",
  "var preferLcc = /LCC/i.test(caseName) && !/GDS/i.test(caseName);",
  "function flatten(x) { return Array.isArray(x) ? x[0] : x; }",
  "function pickFirst(arr) {",
  "  if (!Array.isArray(arr) || !arr.length) return null;",
  "  if (preferLcc) {",
  "    var lcc = arr.find(function (f) { var fl = flatten(f); return fl && fl.IsLCC === true; });",
  "    if (lcc) return flatten(lcc);",
  "  }",
  "  return flatten(arr[0]);",
  "}",
  "var results = resp && resp.Results;",
  "if (Array.isArray(results)) {",
  "  if (results.length && Array.isArray(results[0])) {",
  "    // Return / Special Return shape: Results[0]=OB, Results[1]=IB",
  "    var ob = pickFirst(results[0]);",
  "    var ib = pickFirst(results[1]);",
  "    if (ob && ob.ResultIndex) pm.collectionVariables.set('OB_RESULT_INDEX', ob.ResultIndex);",
  "    if (ib && ib.ResultIndex) pm.collectionVariables.set('IB_RESULT_INDEX', ib.ResultIndex);",
  "    console.log('Auto OB (LCC pref=' + preferLcc + '):', ob && ob.ResultIndex,",
  "                'IB:', ib && ib.ResultIndex);",
  "  } else {",
  "    var first = pickFirst(results);",
  "    if (first && first.ResultIndex) {",
  "      pm.collectionVariables.set('RESULT_INDEX', first.ResultIndex);",
  "      console.log('Auto RESULT_INDEX (LCC pref=' + preferLcc + '):', first.ResultIndex);",
  "    }",
  "  }",
  "}",
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
];

// FareQuote: capture FQ_TRACE_ID, FQ_RESULT_INDEX (always — used for SSR/Book/Ticket),
// IS_LCC, and per-pax fare from FareBreakdown.
const FQ_TEST = [
  "var r = pm.response.json();",
  "var resp = r && r.Response;",
  "var res = resp && resp.Results;",
  "if (resp && resp.TraceId) pm.collectionVariables.set('FQ_TRACE_ID', resp.TraceId);",
  "if (res && res.ResultIndex) {",
  "  pm.collectionVariables.set('FQ_RESULT_INDEX', res.ResultIndex);",
  "  console.log('FQ_RESULT_INDEX:', res.ResultIndex);",
  "}",
  "if (res && res.IsLCC !== undefined) pm.collectionVariables.set('IS_LCC', String(res.IsLCC));",
  "if (res && res.Fare) {",
  "  // Fare from FareQuote response (already per-pax breakdown via FareBreakdown[])",
  "  if (res.FareBreakdown) {",
  "    res.FareBreakdown.forEach(function (bd) {",
  "      var c = bd.PassengerCount || 1;",
  "      var pt = bd.PassengerType;",
  "      var b = String(bd.BaseFare / c);",
  "      var t = String(bd.Tax / c);",
  "      var y = String((bd.YQTax || 0) / c);",
  "      if (pt === 1) { pm.collectionVariables.set('ADT_BASE_FARE', b); pm.collectionVariables.set('ADT_TAX', t); pm.collectionVariables.set('ADT_YQ_TAX', y); }",
  "      else if (pt === 2) { pm.collectionVariables.set('CHD_BASE_FARE', b); pm.collectionVariables.set('CHD_TAX', t); pm.collectionVariables.set('CHD_YQ_TAX', y); }",
  "      else if (pt === 3) { pm.collectionVariables.set('INF_BASE_FARE', b); pm.collectionVariables.set('INF_TAX', t); pm.collectionVariables.set('INF_YQ_TAX', y); }",
  "    });",
  "  }",
  "}",
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
];

// FareQuote OB-only test (Case 03 dual-PNR — OB leg).
const FQ_OB_TEST = [
  "var r = pm.response.json();",
  "var resp = r && r.Response;",
  "var res = resp && resp.Results;",
  "if (resp && resp.TraceId) pm.collectionVariables.set('FQ_TRACE_OB', resp.TraceId);",
  "if (res && res.ResultIndex) pm.collectionVariables.set('FQ_OB_RESULT_INDEX', res.ResultIndex);",
  "if (res && res.FareBreakdown) {",
  "  res.FareBreakdown.forEach(function (bd) {",
  "    var c = bd.PassengerCount || 1;",
  "    var pt = bd.PassengerType;",
  "    var b = String(bd.BaseFare / c);",
  "    var t = String(bd.Tax / c);",
  "    var y = String((bd.YQTax || 0) / c);",
  "    if (pt === 1) { pm.collectionVariables.set('OB_ADT_BASE_FARE', b); pm.collectionVariables.set('OB_ADT_TAX', t); pm.collectionVariables.set('OB_ADT_YQ_TAX', y); }",
  "    else if (pt === 2) { pm.collectionVariables.set('OB_CHD_BASE_FARE', b); pm.collectionVariables.set('OB_CHD_TAX', t); pm.collectionVariables.set('OB_CHD_YQ_TAX', y); }",
  "    else if (pt === 3) { pm.collectionVariables.set('OB_INF_BASE_FARE', b); pm.collectionVariables.set('OB_INF_TAX', t); pm.collectionVariables.set('OB_INF_YQ_TAX', y); }",
  "  });",
  "}",
];

// FareQuote IB-only test (Case 03 dual-PNR — IB leg).
const FQ_IB_TEST = [
  "var r = pm.response.json();",
  "var resp = r && r.Response;",
  "var res = resp && resp.Results;",
  "if (resp && resp.TraceId) pm.collectionVariables.set('FQ_TRACE_IB', resp.TraceId);",
  "if (res && res.ResultIndex) pm.collectionVariables.set('FQ_IB_RESULT_INDEX', res.ResultIndex);",
  "if (res && res.FareBreakdown) {",
  "  res.FareBreakdown.forEach(function (bd) {",
  "    var c = bd.PassengerCount || 1;",
  "    var pt = bd.PassengerType;",
  "    var b = String(bd.BaseFare / c);",
  "    var t = String(bd.Tax / c);",
  "    var y = String((bd.YQTax || 0) / c);",
  "    if (pt === 1) { pm.collectionVariables.set('IB_ADT_BASE_FARE', b); pm.collectionVariables.set('IB_ADT_TAX', t); pm.collectionVariables.set('IB_ADT_YQ_TAX', y); }",
  "    else if (pt === 2) { pm.collectionVariables.set('IB_CHD_BASE_FARE', b); pm.collectionVariables.set('IB_CHD_TAX', t); pm.collectionVariables.set('IB_CHD_YQ_TAX', y); }",
  "    else if (pt === 3) { pm.collectionVariables.set('IB_INF_BASE_FARE', b); pm.collectionVariables.set('IB_INF_TAX', t); pm.collectionVariables.set('IB_INF_YQ_TAX', y); }",
  "  });",
  "}",
];

// SSR (LCC): TBO returns Baggage[seg][option] and MealDynamic[seg][option] at Response root.
// Capture first non-included option per type for ADT/CHD; INF only carries Meal.
const SSR_LCC_TEST = [
  "var r = pm.response.json();",
  "var resp = r && r.Response;",
  "var bag0  = resp && Array.isArray(resp.Baggage)     && resp.Baggage[0];",
  "var meal0 = resp && Array.isArray(resp.MealDynamic) && resp.MealDynamic[0];",
  "function pick(arr, noCode) { if (!arr) return null; var paid = arr.find(function(x){return x.Price>0 && x.Code!==noCode;}); return paid || arr[0]; }",
  "var b = pick(bag0,  'NoBaggage');",
  "var m = pick(meal0, 'NoMeal');",
  "if (b) {",
  "  ['ADT','CHD'].forEach(function (pfx) {",
  "    pm.collectionVariables.set(pfx+'_BAG_CODE',    b.Code || '');",
  "    pm.collectionVariables.set(pfx+'_BAG_WEIGHT',  String(b.Weight || 0));",
  "    pm.collectionVariables.set(pfx+'_BAG_PRICE',   String(b.Price  || 0));",
  "    pm.collectionVariables.set(pfx+'_BAG_ORIGIN',  b.Origin       || '');",
  "    pm.collectionVariables.set(pfx+'_BAG_DEST',    b.Destination  || '');",
  "    pm.collectionVariables.set(pfx+'_BAG_AIRLINE', b.AirlineCode  || '');",
  "    pm.collectionVariables.set(pfx+'_BAG_FLIGHT',  b.FlightNumber || '');",
  "    pm.collectionVariables.set(pfx+'_BAG_WAYTYPE', String(b.WayType || 2));",
  "  });",
  "  console.log('SSR BAG:', b.Code, b.Weight+'kg', 'INR', b.Price);",
  "}",
  "if (m) {",
  "  ['ADT','CHD','INF'].forEach(function (pfx) {",
  "    pm.collectionVariables.set(pfx+'_MEAL_CODE',    m.Code               || '');",
  "    pm.collectionVariables.set(pfx+'_MEAL_DESC',    m.AirlineDescription || '');",
  "    pm.collectionVariables.set(pfx+'_MEAL_PRICE',   String(m.Price       || 0));",
  "    pm.collectionVariables.set(pfx+'_MEAL_ORIGIN',  m.Origin             || '');",
  "    pm.collectionVariables.set(pfx+'_MEAL_DEST',    m.Destination        || '');",
  "    pm.collectionVariables.set(pfx+'_MEAL_AIRLINE', m.AirlineCode        || '');",
  "    pm.collectionVariables.set(pfx+'_MEAL_FLIGHT',  m.FlightNumber       || '');",
  "  });",
  "  console.log('SSR MEAL:', m.Code, m.AirlineDescription, 'INR', m.Price);",
  "}",
];

// SSR (Non-LCC): MealPref + SeatPref at SSRDetails[0]. Captures codes for Book request.
const SSR_NONLCC_TEST = [
  "var r = pm.response.json();",
  "var resp = r && r.Response;",
  "var det  = resp && resp.SSRDetails;",
  "var seg  = det && det[0];",
  "if (seg) {",
  "  var m = (seg.MealPref && seg.MealPref[0]) || null;",
  "  var s = (seg.SeatPref && seg.SeatPref[0]) || null;",
  "  if (m) { pm.collectionVariables.set('MEAL_CODE', m.Code || ''); }",
  "  if (s) { pm.collectionVariables.set('SEAT_CODE', s.Code || ''); }",
  "  console.log('MEAL_CODE:', pm.collectionVariables.get('MEAL_CODE'), 'SEAT_CODE:', pm.collectionVariables.get('SEAT_CODE'));",
  "}",
];

const BOOK_TEST = [
  "var r = pm.response.json();",
  "var inner = (r && r.Response && r.Response.Response) || (r && r.Response) || {};",
  "var fi = inner.FlightItinerary || null;",
  "var bookingId = inner.BookingId || (fi && fi.BookingId);",
  "var pnr = inner.PNR || (fi && fi.PNR);",
  "if (bookingId !== undefined && bookingId !== null) pm.collectionVariables.set('BOOKING_ID', String(bookingId));",
  "if (pnr) pm.collectionVariables.set('PNR', pnr);",
  "if (fi && fi.IsLCC !== undefined) pm.collectionVariables.set('IS_LCC', String(fi.IsLCC));",
  "console.log('Book → BookingId:', bookingId, 'PNR:', pnr);",
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

const TICKET_OB_TEST = [
  "var r = pm.response.json();",
  "var inner = (r && r.Response && r.Response.Response) || (r && r.Response) || {};",
  "var fi = inner.FlightItinerary || null;",
  "if (fi) {",
  "  if (fi.BookingId) pm.collectionVariables.set('OB_BOOKING_ID', String(fi.BookingId));",
  "  if (fi.PNR) pm.collectionVariables.set('OB_PNR', fi.PNR);",
  "  console.log('OB BookingId:', fi.BookingId, 'OB PNR:', fi.PNR);",
  "}",
];

const TICKET_IB_TEST = [
  "var r = pm.response.json();",
  "var inner = (r && r.Response && r.Response.Response) || (r && r.Response) || {};",
  "var fi = inner.FlightItinerary || null;",
  "if (fi) {",
  "  if (fi.BookingId) pm.collectionVariables.set('IB_BOOKING_ID', String(fi.BookingId));",
  "  if (fi.PNR) pm.collectionVariables.set('IB_PNR', fi.PNR);",
  "  console.log('IB BookingId:', fi.BookingId, 'IB PNR:', fi.PNR);",
  "}",
];

// ── Body builders ────────────────────────────────────────────────────────────

function seg(o, d, date) {
  return {
    Origin: o,
    Destination: d,
    FlightCabinClass: '2',
    PreferredDepartureTime: `${date}T00:00:00`,
    PreferredArrivalTime: `${date}T00:00:00`,
  };
}
function searchBody(a, c, i, jt, segs) {
  return {
    TokenId: '{{TOKEN}}',
    EndUserIp: '{{END_USER_IP}}',
    AdultCount: String(a),
    ChildCount: String(c),
    InfantCount: String(i),
    DirectFlight: 'false',
    OneStopFlight: 'false',
    JourneyType: String(jt),
    PreferredAirlines: null,
    Segments: segs,
    Sources: null,
  };
}
function fare(bv, tv, yv) {
  return {
    Currency: 'INR',
    BaseFare: `{{${bv}}}`,
    Tax: `{{${tv}}}`,
    TaxBreakup: [],
    YQTax: `{{${yv}}}`,
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
const FA   = fare('ADT_BASE_FARE','ADT_TAX','ADT_YQ_TAX');
const FC   = fare('CHD_BASE_FARE','CHD_TAX','CHD_YQ_TAX');
const FI   = fare('INF_BASE_FARE','INF_TAX','INF_YQ_TAX');
const OB_FA= fare('OB_ADT_BASE_FARE','OB_ADT_TAX','OB_ADT_YQ_TAX');
const OB_FC= fare('OB_CHD_BASE_FARE','OB_CHD_TAX','OB_CHD_YQ_TAX');
const OB_FI= fare('OB_INF_BASE_FARE','OB_INF_TAX','OB_INF_YQ_TAX');
const IB_FA= fare('IB_ADT_BASE_FARE','IB_ADT_TAX','IB_ADT_YQ_TAX');
const IB_FC= fare('IB_CHD_BASE_FARE','IB_CHD_TAX','IB_CHD_YQ_TAX');
const IB_FI= fare('IB_INF_BASE_FARE','IB_INF_TAX','IB_INF_YQ_TAX');

const GST = {
  GSTCompanyAddress: '',
  GSTCompanyContactNumber: '',
  GSTCompanyName: '',
  GSTNumber: '',
  GSTCompanyEmail: '',
};

// Passport fields intentionally omitted from every pax: TBO rejects requests
// where PassportNo is empty but PassportExpiry is provided. If a case needs
// passport for international travel, add { PassportNo, PassportExpiry } via the
// `extra` argument so they're only set when both values are present.
function pax(title, first, last, pt, dob, gender, lead, ppNo, ppExp, email, phone, f, extra) {
  const p = Object.assign(
    {
      Title: title,
      FirstName: first,
      LastName: last,
      PaxType: pt,
      DateOfBirth: dob,
      Gender: gender,
      AddressLine1: '45 Prithviraj Road',
      City: 'New Delhi',
      CountryCode: 'IN',
      CountryName: 'India',
      Nationality: 'IN',
      Email: email || '',
      ContactNo: phone || '',
      IsLeadPax: lead,
    },
    GST,
    { Fare: f },
  );
  if (extra) Object.assign(p, extra);
  return p;
}

// Domestic (no passport)
const RD  = (f, x) => pax('Mr',   'RAHUL', 'SHARMA', 1, '1985-03-15T00:00:00', 1, true,  '', '2030-01-01T00:00:00', 'rahul.sharma@example.com', '9810001234', f, x);
const PD  = (f, x) => pax('Mrs',  'PRIYA', 'SHARMA', 1, '1988-07-22T00:00:00', 2, false, '', '2030-01-01T00:00:00', '', '', f, x);
const ROD = (f, x) => pax('Mstr', 'ROHAN', 'SHARMA', 2, '2017-05-10T00:00:00', 1, false, '', '2030-01-01T00:00:00', '', '', f, x);
const RYD = (f, x) => pax('Miss', 'RIYA',  'SHARMA', 2, '2016-08-20T00:00:00', 2, false, '', '2030-01-01T00:00:00', '', '', f, x);
const KD  = (f, x) => pax('Mstr', 'KABIR', 'SHARMA', 3, '2025-01-20T00:00:00', 1, false, '', '2030-01-01T00:00:00', '', '', f, x);
function AMD(f, x) {
  const p = pax('Mr','AMIT','KUMAR',1,'1982-11-08T00:00:00',1,false,'','2030-01-01T00:00:00','','',f,x);
  p.AddressLine1 = '12 Connaught Place';
  return p;
}
// International (with passport)
const RI  = (f, x) => pax('Mr',   'RAHUL', 'SHARMA', 1, '1985-03-15T00:00:00', 1, true,  'Z1234567', '2030-12-31T00:00:00', 'rahul.sharma@example.com', '9810001234', f, x);
const PI  = (f, x) => pax('Mrs',  'PRIYA', 'SHARMA', 1, '1988-07-22T00:00:00', 2, false, 'Z7654321', '2030-06-30T00:00:00', '', '', f, x);
const ROI = (f, x) => pax('Mstr', 'ROHAN', 'SHARMA', 2, '2017-05-10T00:00:00', 1, false, 'Z5555555', '2030-12-31T00:00:00', '', '', f, x);
const RYI = (f, x) => pax('Miss', 'RIYA',  'SHARMA', 2, '2016-08-20T00:00:00', 2, false, 'Z6666666', '2030-12-31T00:00:00', '', '', f, x);
const KI  = (f, x) => pax('Mstr', 'KABIR', 'SHARMA', 3, '2025-01-20T00:00:00', 1, false, 'Z9999999', '2030-12-31T00:00:00', '', '', f, x);

// LCC SSR per pax (Ticket request: arrays of Baggage / MealDynamic).
// WayType + Description sent as integers (TBO WCF deserializer expects ints here).
const ADT_LCC = {
  Baggage: [{
    AirlineCode: '{{ADT_BAG_AIRLINE}}',
    FlightNumber: '{{ADT_BAG_FLIGHT}}',
    WayType: 2,
    Code: '{{ADT_BAG_CODE}}',
    Description: 2,
    Weight: '{{ADT_BAG_WEIGHT}}',
    Currency: 'INR',
    Price: '{{ADT_BAG_PRICE}}',
    Origin: '{{ADT_BAG_ORIGIN}}',
    Destination: '{{ADT_BAG_DEST}}',
  }],
  MealDynamic: [{
    AirlineCode: '{{ADT_MEAL_AIRLINE}}',
    FlightNumber: '{{ADT_MEAL_FLIGHT}}',
    WayType: 2,
    Code: '{{ADT_MEAL_CODE}}',
    Description: 2,
    AirlineDescription: '{{ADT_MEAL_DESC}}',
    Quantity: 1,
    Currency: 'INR',
    Price: '{{ADT_MEAL_PRICE}}',
    Origin: '{{ADT_MEAL_ORIGIN}}',
    Destination: '{{ADT_MEAL_DEST}}',
  }],
  SeatDynamic: [],
};
const CHD_LCC = {
  Baggage: [{
    AirlineCode: '{{CHD_BAG_AIRLINE}}',
    FlightNumber: '{{CHD_BAG_FLIGHT}}',
    WayType: 2,
    Code: '{{CHD_BAG_CODE}}',
    Description: 2,
    Weight: '{{CHD_BAG_WEIGHT}}',
    Currency: 'INR',
    Price: '{{CHD_BAG_PRICE}}',
    Origin: '{{CHD_BAG_ORIGIN}}',
    Destination: '{{CHD_BAG_DEST}}',
  }],
  MealDynamic: [{
    AirlineCode: '{{CHD_MEAL_AIRLINE}}',
    FlightNumber: '{{CHD_MEAL_FLIGHT}}',
    WayType: 2,
    Code: '{{CHD_MEAL_CODE}}',
    Description: 2,
    AirlineDescription: '{{CHD_MEAL_DESC}}',
    Quantity: 1,
    Currency: 'INR',
    Price: '{{CHD_MEAL_PRICE}}',
    Origin: '{{CHD_MEAL_ORIGIN}}',
    Destination: '{{CHD_MEAL_DEST}}',
  }],
  SeatDynamic: [],
};
const INF_LCC = {
  MealDynamic: [{
    AirlineCode: '{{INF_MEAL_AIRLINE}}',
    FlightNumber: '{{INF_MEAL_FLIGHT}}',
    WayType: 2,
    Code: '{{INF_MEAL_CODE}}',
    Description: 2,
    AirlineDescription: '{{INF_MEAL_DESC}}',
    Quantity: 1,
    Currency: 'INR',
    Price: '{{INF_MEAL_PRICE}}',
    Origin: '{{INF_MEAL_ORIGIN}}',
    Destination: '{{INF_MEAL_DEST}}',
  }],
};
const EMPTY_LCC = { Baggage: [], MealDynamic: [], SeatDynamic: [] };

// Non-LCC SSR per pax (Book request): Meal + Seat are SINGLE OBJECTS, Description = 2 (integer).
// Infant: Seat = { Code:"NoSeat", Description:2 } per TBO validator.
const ADT_NLCC = {
  Meal: { Code: '{{MEAL_CODE}}', Description: 2 },
  Seat: { Code: '{{SEAT_CODE}}', Description: 2 },
};
const CHD_NLCC = {
  Meal: { Code: '{{MEAL_CODE}}', Description: 2 },
  Seat: { Code: '{{SEAT_CODE}}', Description: 2 },
};
const INF_NLCC = {
  Meal: { Code: '{{MEAL_CODE}}', Description: 2 },
  Seat: { Code: 'NoSeat',        Description: 2 },
};

// ── Common bodies ────────────────────────────────────────────────────────────

const AUTH = {
  ClientId: 'ApiIntegrationNew',
  UserName: '{{TBO_USERNAME}}',
  Password: '{{TBO_PASSWORD}}',
  EndUserIp: '{{END_USER_IP}}',
};

function frBody(ri, ti) {
  return { TokenId: '{{TOKEN}}', EndUserIp: '{{END_USER_IP}}', ResultIndex: ri, TraceId: ti };
}
function fqBody(ri, ti) {
  return { TokenId: '{{TOKEN}}', EndUserIp: '{{END_USER_IP}}', ResultIndex: ri, TraceId: ti };
}
function ssrBody(ri, ti) {
  return { TokenId: '{{TOKEN}}', EndUserIp: '{{END_USER_IP}}', ResultIndex: ri, TraceId: ti };
}
function bookBody(ri, ti, paxArr) {
  return { TokenId: '{{TOKEN}}', EndUserIp: '{{END_USER_IP}}', ResultIndex: ri, TraceId: ti, Passengers: paxArr };
}
function nonLccTicket() {
  return {
    PreferredCurrency: null,
    AgentReferenceNo: '',
    TokenId: '{{TOKEN}}',
    EndUserIp: '{{END_USER_IP}}',
    TraceId: '{{FQ_TRACE_ID}}',
    PNR: '{{PNR}}',
    BookingId: '{{BOOKING_ID}}',
    Passport: [],
  };
}
function lccTicket(ri, ti, paxArr) {
  return {
    PreferredCurrency: 'INR',
    AgentReferenceNo: '',
    IsBaseCurrencyRequired: true,
    TokenId: '{{TOKEN}}',
    EndUserIp: '{{END_USER_IP}}',
    TraceId: ti,
    ResultIndex: ri,
    Passengers: paxArr,
  };
}
function gbdBody(bookingId) {
  return { TokenId: '{{TOKEN}}', EndUserIp: '{{END_USER_IP}}', BookingId: bookingId };
}

// ── Request shorthand ────────────────────────────────────────────────────────

const A    = () => req('Step 1 — Authenticate', authUrl(), AUTH, AUTH_TEST);
const FR   = (name, body) => req(name, tboUrl('FareRule'),         body, []);
const FQ   = (name, body, test) => req(name, tboUrl('FareQuote'),  body, test || FQ_TEST);
const SSR  = (name, body, test) => req(name, tboUrl('SSR'),        body, test || SSR_LCC_TEST);
const BK   = (name, body) => req(name, tboUrl('Book'),             body, BOOK_TEST);
const TK_N = (name)       => req(name, tboUrl('Ticket'),           nonLccTicket(), TICKET_TEST);
const TK_L = (name, body, test) => req(name, tboUrl('Ticket'),     body, test || TICKET_TEST);
const GBD  = (name, body) => req(name, tboUrl('GetBookingDetails'),body, []);

// ── Cases ────────────────────────────────────────────────────────────────────
// Numbered 1..7 in the new collection but labelled with their original case ID.

// Case 1: GDS Domestic Oneway · 1 Adult (AI DEL→BOM)
const case1 = {
  name: 'Case 1 (orig 01) — GDS Domestic Oneway · 1A · AI DEL→BOM (Non-LCC)',
  item: [
    A(),
    req(
      'Step 2 — Search (JT=1, 1A, DEL→BOM 2026-06-15)',
      tboUrl('Search'),
      searchBody(1, 0, 0, 1, [seg('DEL', 'BOM', '2026-06-15')]),
      SEARCH_TEST,
    ),
    FR('Step 3 — FareRule', frBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    FQ('Step 4 — FareQuote', fqBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    SSR('Step 5 — SSR (Non-LCC — captures MEAL_CODE / SEAT_CODE)',
        ssrBody('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}'), SSR_NONLCC_TEST),
    BK('Step 6 — Book (Non-LCC + Meal/Seat objects)',
       bookBody('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}', [RD(FA, ADT_NLCC)])),
    TK_N('Step 7 — Ticket (Non-LCC, after Book)'),
    GBD('Step 8 — GetBookingDetails', gbdBody('{{BOOKING_ID}}')),
  ],
};

// Case 2: LCC Domestic Oneway · 1A + 1C + 1I with SSR (6E DEL→BOM)
const case2 = {
  name: 'Case 2 (orig 02) — LCC Domestic Oneway · 1A+1C+1I with SSR · 6E DEL→BOM',
  item: [
    A(),
    req(
      'Step 2 — Search (JT=1, 1A+1C+1I, DEL→BOM 2026-06-15)',
      tboUrl('Search'),
      searchBody(1, 1, 1, 1, [seg('DEL', 'BOM', '2026-06-15')]),
      SEARCH_TEST,
    ),
    FR('Step 3 — FareRule', frBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    FQ('Step 4 — FareQuote', fqBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    SSR('Step 5 — SSR (LCC — captures Bag/Meal codes)',
        ssrBody('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}')),
    TK_L('Step 6 — Ticket (LCC + SSR arrays)',
         lccTicket('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}',
                   [RD(FA, ADT_LCC), ROD(FC, CHD_LCC), KD(FI, INF_LCC)])),
    GBD('Step 7 — GetBookingDetails', gbdBody('{{BOOKING_ID}}')),
  ],
};

// Case 3: LCC Domestic Return · 2A + 2C + 1I (dual-PNR, JT=2)
const case3 = {
  name: 'Case 3 (orig 03) — LCC Domestic Return · 2A+2C+1I dual-PNR · 6E DEL↔BOM (JT=2)',
  item: [
    A(),
    req(
      'Step 2 — Search (JT=2, 2A+2C+1I, DEL↔BOM)',
      tboUrl('Search'),
      searchBody(2, 2, 1, 2, [
        seg('DEL', 'BOM', '2026-06-15'),
        seg('BOM', 'DEL', '2026-06-22'),
      ]),
      SEARCH_TEST,
    ),
    FR('Step 3a — FareRule (OB)', frBody('{{OB_RESULT_INDEX}}', '{{TRACE_ID}}')),
    FQ('Step 4a — FareQuote (OB)', fqBody('{{OB_RESULT_INDEX}}', '{{TRACE_ID}}'), FQ_OB_TEST),
    req('Step 5a — Ticket OB (LCC, no SSR)',
        tboUrl('Ticket'),
        lccTicket('{{FQ_OB_RESULT_INDEX}}', '{{FQ_TRACE_OB}}',
                  [RD(OB_FA, EMPTY_LCC), PD(OB_FA, EMPTY_LCC),
                   ROD(OB_FC, EMPTY_LCC), RYD(OB_FC, EMPTY_LCC),
                   KD(OB_FI, { MealDynamic: [] })]),
        TICKET_OB_TEST),
    FR('Step 3b — FareRule (IB)', frBody('{{IB_RESULT_INDEX}}', '{{TRACE_ID}}')),
    FQ('Step 4b — FareQuote (IB)', fqBody('{{IB_RESULT_INDEX}}', '{{TRACE_ID}}'), FQ_IB_TEST),
    req('Step 5b — Ticket IB (LCC, no SSR)',
        tboUrl('Ticket'),
        lccTicket('{{FQ_IB_RESULT_INDEX}}', '{{FQ_TRACE_IB}}',
                  [RD(IB_FA, EMPTY_LCC), PD(IB_FA, EMPTY_LCC),
                   ROD(IB_FC, EMPTY_LCC), RYD(IB_FC, EMPTY_LCC),
                   KD(IB_FI, { MealDynamic: [] })]),
        TICKET_IB_TEST),
    GBD('Step 6a — GetBookingDetails (OB)', gbdBody('{{OB_BOOKING_ID}}')),
    GBD('Step 6b — GetBookingDetails (IB)', gbdBody('{{IB_BOOKING_ID}}')),
  ],
};

// Case 4: LCC International Oneway · 1A + 1C + 1I with SSR + Passport (6E/SG DEL→DXB)
const case4 = {
  name: 'Case 4 (orig 04) — LCC International Oneway · 1A+1C+1I with SSR + Passport · DEL→DXB',
  item: [
    A(),
    req(
      'Step 2 — Search (JT=1, 1A+1C+1I, DEL→DXB 2026-07-01)',
      tboUrl('Search'),
      searchBody(1, 1, 1, 1, [seg('DEL', 'DXB', '2026-07-01')]),
      SEARCH_TEST,
    ),
    FR('Step 3 — FareRule', frBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    FQ('Step 4 — FareQuote', fqBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    SSR('Step 5 — SSR (LCC)',
        ssrBody('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}')),
    TK_L('Step 6 — Ticket (LCC + SSR + Passport)',
         lccTicket('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}',
                   [RI(FA, ADT_LCC), ROI(FC, CHD_LCC), KI(FI, INF_LCC)])),
    GBD('Step 7 — GetBookingDetails', gbdBody('{{BOOKING_ID}}')),
  ],
};

// Case 5: GDS International Return · 2A + 2C + 1I single-PNR (AI DEL↔LHR, JT=2)
const case5 = {
  name: 'Case 5 (orig 05) — GDS International Return · 2A+2C+1I single-PNR · AI DEL↔LHR (JT=2)',
  item: [
    A(),
    req(
      'Step 2 — Search (JT=2, 2A+2C+1I, DEL↔LHR)',
      tboUrl('Search'),
      searchBody(2, 2, 1, 2, [
        seg('DEL', 'LHR', '2026-07-01'),
        seg('LHR', 'DEL', '2026-07-15'),
      ]),
      SEARCH_TEST,
    ),
    FR('Step 3 — FareRule', frBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    FQ('Step 4 — FareQuote', fqBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    SSR('Step 5 — SSR (Non-LCC — captures MEAL_CODE / SEAT_CODE)',
        ssrBody('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}'), SSR_NONLCC_TEST),
    BK('Step 6 — Book (Non-LCC + Meal/Seat objects + Passport)',
       bookBody('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}',
                [RI(FA, ADT_NLCC), PI(FA, ADT_NLCC),
                 ROI(FC, CHD_NLCC), RYI(FC, CHD_NLCC),
                 KI(FI, INF_NLCC)])),
    TK_N('Step 7 — Ticket (Non-LCC, after Book)'),
    GBD('Step 8 — GetBookingDetails', gbdBody('{{BOOKING_ID}}')),
  ],
};

// Case 6: LCC Domestic Special Return · 2A + 1C (6E DEL↔MAA, JT=5, one PNR)
// Supplier here wants ResultIndex as "OB,IB" comma-separated for both FR and FQ.
// FareQuote response then returns the combined FQ_RESULT_INDEX that Ticket consumes.
// (If your supplier instead rejects comma-separated, switch to single OB index.)
// Route chosen DEL↔MAA so both OB and IB legs return IsLCC:true (6E dense coverage).
const case6 = {
  name: 'Case 6 (orig 06) — LCC Special Return · 2A+1C · 6E DEL↔MAA (JT=5, one PNR)',
  item: [
    A(),
    req(
      'Step 2 — Search (JT=5, 2A+1C, DEL↔MAA)',
      tboUrl('Search'),
      searchBody(2, 1, 0, 5, [
        seg('DEL', 'MAA', '2026-06-15'),
        seg('MAA', 'DEL', '2026-06-22'),
      ]),
      SEARCH_TEST,
    ),
    FR('Step 3 — FareRule (OB,IB comma-separated)',
       frBody('{{OB_RESULT_INDEX}},{{IB_RESULT_INDEX}}', '{{TRACE_ID}}')),
    FQ('Step 4 — FareQuote (OB,IB comma-separated — returns combined FQ_RESULT_INDEX)',
       fqBody('{{OB_RESULT_INDEX}},{{IB_RESULT_INDEX}}', '{{TRACE_ID}}')),
    TK_L('Step 5 — Ticket (LCC, use FQ_RESULT_INDEX — covers both legs, no SSR)',
         lccTicket('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}',
                   [RD(FA, EMPTY_LCC), PD(FA, EMPTY_LCC), ROD(FC, EMPTY_LCC)])),
    GBD('Step 6 — GetBookingDetails', gbdBody('{{BOOKING_ID}}')),
  ],
};

// Case 7 (display) / orig 08: GDS Multiway · 2A (AI DEL→BOM→MAA, JT=3)
const case8 = {
  name: 'Case 7 (orig 08) — GDS Multiway · 2A · AI DEL→BOM→MAA (JT=3)',
  item: [
    A(),
    req(
      'Step 2 — Search (JT=3, 2A, DEL→BOM 2026-06-15, BOM→MAA 2026-06-20)',
      tboUrl('Search'),
      searchBody(2, 0, 0, 3, [
        seg('DEL', 'BOM', '2026-06-15'),
        seg('BOM', 'MAA', '2026-06-20'),
      ]),
      SEARCH_TEST,
    ),
    FR('Step 3 — FareRule', frBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    FQ('Step 4 — FareQuote', fqBody('{{RESULT_INDEX}}', '{{TRACE_ID}}')),
    SSR('Step 5 — SSR (Non-LCC — captures MEAL_CODE / SEAT_CODE)',
        ssrBody('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}'), SSR_NONLCC_TEST),
    BK('Step 6 — Book (Non-LCC + Meal/Seat objects, 2 ADT)',
       bookBody('{{FQ_RESULT_INDEX}}', '{{FQ_TRACE_ID}}',
                [RD(FA, ADT_NLCC), AMD(FA, ADT_NLCC)])),
    TK_N('Step 7 — Ticket (Non-LCC, after Book)'),
    GBD('Step 8 — GetBookingDetails', gbdBody('{{BOOKING_ID}}')),
  ],
};

// ── Collection ───────────────────────────────────────────────────────────────

const VARS = [
  ['TBO_USERNAME', ''], ['TBO_PASSWORD', ''], ['TOKEN', ''],
  ['END_USER_IP', '1.1.1.1'],
  ['TRACE_ID', ''], ['RESULT_INDEX', ''], ['FQ_TRACE_ID', ''], ['FQ_RESULT_INDEX', ''],
  ['IS_LCC', ''], ['BOOKING_ID', ''], ['PNR', ''],
  ['MEAL_CODE', ''], ['SEAT_CODE', ''],
  ['OB_RESULT_INDEX', ''], ['IB_RESULT_INDEX', ''],
  ['FQ_OB_RESULT_INDEX', ''], ['FQ_IB_RESULT_INDEX', ''],
  ['FQ_TRACE_OB', ''], ['FQ_TRACE_IB', ''],
  ['OB_BOOKING_ID', ''], ['OB_PNR', ''], ['IB_BOOKING_ID', ''], ['IB_PNR', ''],
  ['ADT_BASE_FARE', '0'], ['ADT_TAX', '0'], ['ADT_YQ_TAX', '0'],
  ['CHD_BASE_FARE', '0'], ['CHD_TAX', '0'], ['CHD_YQ_TAX', '0'],
  ['INF_BASE_FARE', '0'], ['INF_TAX', '0'], ['INF_YQ_TAX', '0'],
  ['OB_ADT_BASE_FARE', '0'], ['OB_ADT_TAX', '0'], ['OB_ADT_YQ_TAX', '0'],
  ['OB_CHD_BASE_FARE', '0'], ['OB_CHD_TAX', '0'], ['OB_CHD_YQ_TAX', '0'],
  ['OB_INF_BASE_FARE', '0'], ['OB_INF_TAX', '0'], ['OB_INF_YQ_TAX', '0'],
  ['IB_ADT_BASE_FARE', '0'], ['IB_ADT_TAX', '0'], ['IB_ADT_YQ_TAX', '0'],
  ['IB_CHD_BASE_FARE', '0'], ['IB_CHD_TAX', '0'], ['IB_CHD_YQ_TAX', '0'],
  ['IB_INF_BASE_FARE', '0'], ['IB_INF_TAX', '0'], ['IB_INF_YQ_TAX', '0'],
  ['ADT_BAG_CODE', ''], ['ADT_BAG_WEIGHT', '0'], ['ADT_BAG_PRICE', '0'],
  ['ADT_BAG_ORIGIN', ''], ['ADT_BAG_DEST', ''], ['ADT_BAG_AIRLINE', ''], ['ADT_BAG_FLIGHT', ''],
  ['ADT_MEAL_CODE', ''], ['ADT_MEAL_DESC', ''], ['ADT_MEAL_PRICE', '0'],
  ['ADT_MEAL_ORIGIN', ''], ['ADT_MEAL_DEST', ''], ['ADT_MEAL_AIRLINE', ''], ['ADT_MEAL_FLIGHT', ''],
  ['CHD_BAG_CODE', ''], ['CHD_BAG_WEIGHT', '0'], ['CHD_BAG_PRICE', '0'],
  ['CHD_BAG_ORIGIN', ''], ['CHD_BAG_DEST', ''], ['CHD_BAG_AIRLINE', ''], ['CHD_BAG_FLIGHT', ''],
  ['CHD_MEAL_CODE', ''], ['CHD_MEAL_DESC', ''], ['CHD_MEAL_PRICE', '0'],
  ['CHD_MEAL_ORIGIN', ''], ['CHD_MEAL_DEST', ''], ['CHD_MEAL_AIRLINE', ''], ['CHD_MEAL_FLIGHT', ''],
  ['INF_MEAL_CODE', ''], ['INF_MEAL_DESC', ''], ['INF_MEAL_PRICE', '0'],
  ['INF_MEAL_ORIGIN', ''], ['INF_MEAL_DEST', ''], ['INF_MEAL_AIRLINE', ''], ['INF_MEAL_FLIGHT', ''],
].map(([key, value]) => ({ key, value, type: 'string' }));

const description = [
  'TBO Air API — 7 failing-case rerun (Cases 1, 2, 3, 4, 5, 6, 8 from the 12-case cert).',
  '',
  'Setup:',
  '1. Set TBO_USERNAME, TBO_PASSWORD, END_USER_IP in collection variables.',
  '2. Run Authenticate first; TOKEN is auto-captured.',
  '3. Search test scripts auto-pick the first ResultIndex per direction (TRACE_ID, RESULT_INDEX, OB/IB).',
  '4. FareQuote auto-captures FQ_TRACE_ID, FQ_RESULT_INDEX, IS_LCC, per-pax fare.',
  '5. SSR auto-captures Baggage/Meal codes (LCC) or MEAL_CODE/SEAT_CODE (Non-LCC).',
  '',
  'Key shape fixes applied here:',
  ' - Non-LCC Book Passenger.Meal / Passenger.Seat are SINGLE OBJECTS (not arrays).',
  ' - Description sent as integer 2 (not string).',
  ' - Infant Non-LCC Seat = { Code: "NoSeat", Description: 2 }.',
  ' - Case 6 (LCC JT=5) sends OB-only ResultIndex to FareQuote; uses combined FQ_RESULT_INDEX for Ticket.',
  ' - Case 8 (GDS JT=3) Multiway sends a single ResultIndex covering all 3+ legs.',
].join('\n');

const collection = {
  info: {
    _postman_id: 'tbo-failing-cases-2026',
    name: 'TBO Air API — 7 Failing Cases (1,2,3,4,5,6,8)',
    description,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: VARS,
  item: [case1, case2, case3, case4, case5, case6, case8],
};

const out = path.join(__dirname, 'Failing_Cases.postman_collection.json');
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
console.log('Written:', out);
console.log('Size:', Math.round(fs.statSync(out).size / 1024), 'KB');
console.log('Cases:', collection.item.map((c) => c.name).join('\n  '));
