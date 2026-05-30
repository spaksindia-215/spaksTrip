#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = 'https://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest';
const AUTH_URL_STR = 'https://sharedapi.tektravels.com/SharedData.svc/rest/Authenticate';

function tboUrl(ep) {
  return { raw: `${BASE}/${ep}`, protocol: 'https', host: ['api','tektravels','com'], path: ['BookingEngineService_Air','AirService.svc','rest',ep] };
}
function authUrl() {
  return { raw: AUTH_URL_STR, protocol: 'https', host: ['sharedapi','tektravels','com'], path: ['SharedData.svc','rest','Authenticate'] };
}
function req(name, url, body, exec) {
  const r = { name, request: { method:'POST', header:[{key:'Content-Type',value:'application/json'}], body:{mode:'raw',raw:JSON.stringify(body,null,2),options:{raw:{language:'json'}}}, url } };
  if (exec && exec.length) r.event = [{listen:'test',script:{exec,type:'text/javascript'}}];
  return r;
}

// --- Test scripts ---
const AUTH_TEST = [
  "var r=pm.response.json();",
  "if(r&&r.Response&&r.Response.TokenAgentDetails){",
  "  pm.collectionVariables.set('TOKEN',r.Response.TokenAgentDetails.TokenId);",
  "  console.log('TOKEN set:',r.Response.TokenAgentDetails.TokenId);",
  "}",
  "pm.test('HTTP 200',function(){pm.response.to.have.status(200);});"
];
const SEARCH_TEST = [
  "var r=pm.response.json();",
  "if(r&&r.Response&&r.Response.TraceId) pm.collectionVariables.set('TRACE_ID',r.Response.TraceId);",
  "console.log('TRACE_ID:',pm.collectionVariables.get('TRACE_ID'));",
  "console.log('ACTION: Set RESULT_INDEX from target flight in Results[].');"
];
const SEARCH_OB_IB_TEST = [
  "var r=pm.response.json();",
  "if(r&&r.Response&&r.Response.TraceId) pm.collectionVariables.set('TRACE_ID',r.Response.TraceId);",
  "console.log('ACTION: Set OB_RESULT_INDEX from Results[0], IB_RESULT_INDEX from Results[1].');"
];
const FQ_TEST = [
  "var r=pm.response.json(),resp=r&&r.Response,res=resp&&resp.Results;",
  "if(resp&&resp.TraceId) pm.collectionVariables.set('FQ_TRACE_ID',resp.TraceId);",
  "if(res&&res.IsLCC!==undefined) pm.collectionVariables.set('IS_LCC',String(res.IsLCC));",
  "if(res&&res.FareBreakdown){res.FareBreakdown.forEach(function(bd){",
  "  var c=bd.PassengerCount||1,pt=bd.PassengerType,b=String(bd.BaseFare/c),t=String(bd.Tax/c),y=String((bd.YQTax||0)/c);",
  "  if(pt===1){pm.collectionVariables.set('ADT_BASE_FARE',b);pm.collectionVariables.set('ADT_TAX',t);pm.collectionVariables.set('ADT_YQ_TAX',y);}",
  "  else if(pt===2){pm.collectionVariables.set('CHD_BASE_FARE',b);pm.collectionVariables.set('CHD_TAX',t);pm.collectionVariables.set('CHD_YQ_TAX',y);}",
  "  else if(pt===3){pm.collectionVariables.set('INF_BASE_FARE',b);pm.collectionVariables.set('INF_TAX',t);pm.collectionVariables.set('INF_YQ_TAX',y);}",
  "});}"
];
const FQ_SR_TEST = [...FQ_TEST,
  "if(res&&res.ResultIndex){pm.collectionVariables.set('FQ_RESULT_INDEX',res.ResultIndex);console.log('FQ_RESULT_INDEX:',res.ResultIndex);}"
];
const FQ_OB_TEST = [
  "var r=pm.response.json(),resp=r&&r.Response,res=resp&&resp.Results;",
  "if(resp&&resp.TraceId) pm.collectionVariables.set('FQ_TRACE_OB',resp.TraceId);",
  "if(res&&res.FareBreakdown){res.FareBreakdown.forEach(function(bd){",
  "  var c=bd.PassengerCount||1,pt=bd.PassengerType,b=String(bd.BaseFare/c),t=String(bd.Tax/c),y=String((bd.YQTax||0)/c);",
  "  if(pt===1){pm.collectionVariables.set('OB_ADT_BASE_FARE',b);pm.collectionVariables.set('OB_ADT_TAX',t);pm.collectionVariables.set('OB_ADT_YQ_TAX',y);}",
  "  else if(pt===2){pm.collectionVariables.set('OB_CHD_BASE_FARE',b);pm.collectionVariables.set('OB_CHD_TAX',t);pm.collectionVariables.set('OB_CHD_YQ_TAX',y);}",
  "  else if(pt===3){pm.collectionVariables.set('OB_INF_BASE_FARE',b);pm.collectionVariables.set('OB_INF_TAX',t);pm.collectionVariables.set('OB_INF_YQ_TAX',y);}",
  "});}"
];
const FQ_IB_TEST = [
  "var r=pm.response.json(),resp=r&&r.Response,res=resp&&resp.Results;",
  "if(resp&&resp.TraceId) pm.collectionVariables.set('FQ_TRACE_IB',resp.TraceId);",
  "if(res&&res.FareBreakdown){res.FareBreakdown.forEach(function(bd){",
  "  var c=bd.PassengerCount||1,pt=bd.PassengerType,b=String(bd.BaseFare/c),t=String(bd.Tax/c),y=String((bd.YQTax||0)/c);",
  "  if(pt===1){pm.collectionVariables.set('IB_ADT_BASE_FARE',b);pm.collectionVariables.set('IB_ADT_TAX',t);pm.collectionVariables.set('IB_ADT_YQ_TAX',y);}",
  "  else if(pt===2){pm.collectionVariables.set('IB_CHD_BASE_FARE',b);pm.collectionVariables.set('IB_CHD_TAX',t);pm.collectionVariables.set('IB_CHD_YQ_TAX',y);}",
  "  else if(pt===3){pm.collectionVariables.set('IB_INF_BASE_FARE',b);pm.collectionVariables.set('IB_INF_TAX',t);pm.collectionVariables.set('IB_INF_YQ_TAX',y);}",
  "});}"
];
const SSR_LCC_TEST = [
  "var r=pm.response.json(),det=r&&r.Response&&r.Response.SSRDetails;",
  "function capSSR(seg,pfx,bag){if(!seg)return;",
  "  if(bag){var b=seg.Baggage&&seg.Baggage[0];if(b){",
  "    pm.collectionVariables.set(pfx+'_BAG_CODE',b.Code||'');",
  "    pm.collectionVariables.set(pfx+'_BAG_WEIGHT',String(b.Weight||0));",
  "    pm.collectionVariables.set(pfx+'_BAG_PRICE',String(b.Price||0));",
  "    pm.collectionVariables.set(pfx+'_BAG_ORIGIN',b.Origin||'');",
  "    pm.collectionVariables.set(pfx+'_BAG_DEST',b.Destination||'');",
  "    pm.collectionVariables.set(pfx+'_BAG_AIRLINE',b.AirlineCode||'');",
  "    pm.collectionVariables.set(pfx+'_BAG_FLIGHT',b.FlightNumber||'');",
  "    pm.collectionVariables.set(pfx+'_BAG_WAYTYPE',String(b.WayType||1));}}",
  "  var m=seg.MealDynamic&&seg.MealDynamic[0];if(m){",
  "    pm.collectionVariables.set(pfx+'_MEAL_CODE',m.Code||'');",
  "    pm.collectionVariables.set(pfx+'_MEAL_DESC',m.AirlineDescription||'');",
  "    pm.collectionVariables.set(pfx+'_MEAL_PRICE',String(m.Price||0));",
  "    pm.collectionVariables.set(pfx+'_MEAL_ORIGIN',m.Origin||'');",
  "    pm.collectionVariables.set(pfx+'_MEAL_DEST',m.Destination||'');",
  "    pm.collectionVariables.set(pfx+'_MEAL_AIRLINE',m.AirlineCode||'');",
  "    pm.collectionVariables.set(pfx+'_MEAL_FLIGHT',m.FlightNumber||'');}}",
  "if(det){capSSR(det[0],'ADT',true);capSSR(det[1],'CHD',true);capSSR(det[2],'INF',false);}",
  "console.log('SSR variables captured. Verify before running Ticket.');"
];
const SSR_NONLCC_TEST = [
  "var r=pm.response.json(),det=r&&r.Response&&r.Response.SSRDetails,seg=det&&det[0];",
  "if(seg){",
  "  var m=seg.MealPref&&seg.MealPref[0];",
  "  if(m){pm.collectionVariables.set('MEAL_CODE',m.Code||'');pm.collectionVariables.set('MEAL_DESCRIPTION',m.Description||'');}",
  "  var s=seg.SeatPref&&seg.SeatPref[0];",
  "  if(s){pm.collectionVariables.set('SEAT_CODE',s.Code||'');pm.collectionVariables.set('SEAT_DESCRIPTION',s.Description||'');}",
  "  console.log('MEAL_CODE:',pm.collectionVariables.get('MEAL_CODE'),'SEAT_CODE:',pm.collectionVariables.get('SEAT_CODE'));",
  "}"
];
const BOOK_TEST = [
  "var r=pm.response.json(),fi=r&&r.Response&&r.Response.FlightItinerary;",
  "if(fi){pm.collectionVariables.set('BOOKING_ID',String(fi.BookingId||''));pm.collectionVariables.set('PNR',fi.PNR||'');",
  "  console.log('BookingId:',fi.BookingId,'PNR:',fi.PNR);}"
];
const BOOK_OB_TEST = [
  "var r=pm.response.json(),fi=r&&r.Response&&r.Response.FlightItinerary;",
  "if(fi){pm.collectionVariables.set('OB_BOOKING_ID',String(fi.BookingId||''));pm.collectionVariables.set('OB_PNR',fi.PNR||'');",
  "  console.log('OB BookingId:',fi.BookingId,'OB PNR:',fi.PNR);}"
];
const BOOK_IB_TEST = [
  "var r=pm.response.json(),fi=r&&r.Response&&r.Response.FlightItinerary;",
  "if(fi){pm.collectionVariables.set('IB_BOOKING_ID',String(fi.BookingId||''));pm.collectionVariables.set('IB_PNR',fi.PNR||'');",
  "  console.log('IB BookingId:',fi.BookingId,'IB PNR:',fi.PNR);}"
];
const TICKET_TEST = [
  "var r=pm.response.json(),fi=r&&r.Response&&r.Response.FlightItinerary;",
  "if(fi){var nums=(fi.Passenger||[]).map(function(p){return p.Ticket&&p.Ticket.TicketNumber;}).filter(Boolean);",
  "  console.log('Tickets:',nums.join(', '));console.log('Status:',fi.BookingStatus,'(1=Confirmed)');",
  "  if(fi.BookingId) pm.collectionVariables.set('BOOKING_ID',String(fi.BookingId));",
  "  if(fi.PNR) pm.collectionVariables.set('PNR',fi.PNR);}"
];
const TICKET_OB_TEST = [
  "var r=pm.response.json(),fi=r&&r.Response&&r.Response.FlightItinerary;",
  "if(fi){var nums=(fi.Passenger||[]).map(function(p){return p.Ticket&&p.Ticket.TicketNumber;}).filter(Boolean);",
  "  console.log('OB Tickets:',nums.join(', '));",
  "  if(fi.BookingId) pm.collectionVariables.set('OB_BOOKING_ID',String(fi.BookingId));",
  "  if(fi.PNR) pm.collectionVariables.set('OB_PNR',fi.PNR);}"
];
const TICKET_IB_TEST = [
  "var r=pm.response.json(),fi=r&&r.Response&&r.Response.FlightItinerary;",
  "if(fi){var nums=(fi.Passenger||[]).map(function(p){return p.Ticket&&p.Ticket.TicketNumber;}).filter(Boolean);",
  "  console.log('IB Tickets:',nums.join(', '));",
  "  if(fi.BookingId) pm.collectionVariables.set('IB_BOOKING_ID',String(fi.BookingId));",
  "  if(fi.PNR) pm.collectionVariables.set('IB_PNR',fi.PNR);}"
];
const CALENDAR_TEST = [
  "var r=pm.response.json(),results=r&&r.Response&&r.Response.SearchResults;",
  "if(results){var best=null;results.forEach(function(d){if(d.IsLowestFareOfMonth)best=d;});",
  "  if(best&&best.DepartureDate){var d=best.DepartureDate.replace('T00:00:00','');",
  "    pm.collectionVariables.set('BEST_DATE',d);console.log('Best date:',d,'Fare:',best.Fare);}}"
];
const PRICERBD_TEST = [
  "var r=pm.response.json(),resp=r&&r.Response;",
  "if(resp){if(resp.TraceId) pm.collectionVariables.set('RBD_TRACE_ID',resp.TraceId);",
  "  var res=resp.Results;var pick=Array.isArray(res)?(Array.isArray(res[0])?res[0][0]:res[0]):res;",
  "  if(pick&&pick.ResultIndex){pm.collectionVariables.set('RBD_RESULT_INDEX',pick.ResultIndex);console.log('RBD_RESULT_INDEX:',pick.ResultIndex);}}"
];
const SEARCH_RBD_TEST = [
  "var r=pm.response.json();",
  "if(r&&r.Response&&r.Response.TraceId) pm.collectionVariables.set('TRACE_ID',r.Response.TraceId);",
  "console.log('ACTION: From Results[], pick a GDS Air India Non-LCC result and set these collection vars:');",
  "console.log('  SEARCH_RESULT_INDEX = Results[i].ResultIndex');",
  "console.log('  SOURCE = Results[i].Source (e.g. 4)');",
  "console.log('  IS_REFUNDABLE = Results[i].IsRefundable (true/false)');",
  "console.log('  FLIGHT_NO = Results[i].Segments[0][0].Airline.FlightNumber');",
  "console.log('  RBD = Results[i].Segments[0][0].Airline.FareClass');"
];

// --- Body helpers ---
function seg(o,d,date,cabin){return{Origin:o,Destination:d,FlightCabinClass:String(cabin||2),PreferredDepartureTime:`${date}T00:00:00`,PreferredArrivalTime:`${date}T00:00:00`};}
function searchBody(a,c,i,jt,segs){return{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',AdultCount:String(a),ChildCount:String(c),InfantCount:String(i),DirectFlight:'false',OneStopFlight:'false',JourneyType:String(jt),PreferredAirlines:null,Segments:segs,Sources:null};}
function fare(bv,tv,yv){return{Currency:'INR',BaseFare:`{{${bv}}}`,Tax:`{{${tv}}}`,TaxBreakup:[],YQTax:`{{${yv}}}`,AdditionalTxnFeeOfrd:0,AdditionalTxnFeePub:0,PGCharge:0,OtherCharges:0,ChargeBU:[],Discount:0,PublishedFare:0,CommissionEarned:0,PLBEarned:0,IncentiveEarned:0,OfferedFare:0,TdsOnCommission:0,TdsOnPLB:0,TdsOnIncentive:0,ServiceFee:0};}
const FA=fare('ADT_BASE_FARE','ADT_TAX','ADT_YQ_TAX');
const FC=fare('CHD_BASE_FARE','CHD_TAX','CHD_YQ_TAX');
const FI=fare('INF_BASE_FARE','INF_TAX','INF_YQ_TAX');
const OB_FA=fare('OB_ADT_BASE_FARE','OB_ADT_TAX','OB_ADT_YQ_TAX');
const OB_FC=fare('OB_CHD_BASE_FARE','OB_CHD_TAX','OB_CHD_YQ_TAX');
const OB_FI=fare('OB_INF_BASE_FARE','OB_INF_TAX','OB_INF_YQ_TAX');
const IB_FA=fare('IB_ADT_BASE_FARE','IB_ADT_TAX','IB_ADT_YQ_TAX');
const IB_FC=fare('IB_CHD_BASE_FARE','IB_CHD_TAX','IB_CHD_YQ_TAX');
const IB_FI=fare('IB_INF_BASE_FARE','IB_INF_TAX','IB_INF_YQ_TAX');

const GST={GSTCompanyAddress:'',GSTCompanyContactNumber:'',GSTCompanyName:'',GSTNumber:'',GSTCompanyEmail:''};
function pax(title,first,last,pt,dob,gender,lead,ppNo,ppExp,email,phone,f,extra){
  const p=Object.assign({Title:title,FirstName:first,LastName:last,PaxType:pt,DateOfBirth:dob,Gender:gender,PassportNo:ppNo||'',PassportExpiry:ppExp||'2030-01-01T00:00:00',AddressLine1:'45 Prithviraj Road',City:'New Delhi',CountryCode:'IN',CountryName:'India',Nationality:'IN',Email:email||'',ContactNo:phone||'',IsLeadPax:lead},GST,{Fare:f});
  if(extra) Object.assign(p,extra);
  return p;
}
// Domestic (no passport)
const RD=(f,x)=>pax('Mr','RAHUL','SHARMA',1,'1985-03-15T00:00:00',1,true,'','2030-01-01T00:00:00','rahul.sharma@example.com','9810001234',f,x);
const PD=(f,x)=>pax('Mrs','PRIYA','SHARMA',1,'1988-07-22T00:00:00',2,false,'','2030-01-01T00:00:00','','',f,x);
const ROD=(f,x)=>pax('Mstr','ROHAN','SHARMA',2,'2017-05-10T00:00:00',1,false,'','2030-01-01T00:00:00','','',f,x);
const RYD=(f,x)=>pax('Miss','RIYA','SHARMA',2,'2016-08-20T00:00:00',2,false,'','2030-01-01T00:00:00','','',f,x);
const KD=(f,x)=>pax('Mstr','KABIR','SHARMA',3,'2025-01-20T00:00:00',1,false,'','2030-01-01T00:00:00','','',f,x);
function AMD(f,x){const p=pax('Mr','AMIT','KUMAR',1,'1982-11-08T00:00:00',1,false,'','2030-01-01T00:00:00','','',f,x);p.AddressLine1='12 Connaught Place';return p;}
// International (with passport)
const RI=(f,x)=>pax('Mr','RAHUL','SHARMA',1,'1985-03-15T00:00:00',1,true,'Z1234567','2030-12-31T00:00:00','rahul.sharma@example.com','9810001234',f,x);
const PI=(f,x)=>pax('Mrs','PRIYA','SHARMA',1,'1988-07-22T00:00:00',2,false,'Z7654321','2030-06-30T00:00:00','','',f,x);
const ROI=(f,x)=>pax('Mstr','ROHAN','SHARMA',2,'2017-05-10T00:00:00',1,false,'Z5555555','2030-12-31T00:00:00','','',f,x);
const RYI=(f,x)=>pax('Miss','RIYA','SHARMA',2,'2016-08-20T00:00:00',2,false,'Z6666666','2030-12-31T00:00:00','','',f,x);
const KI=(f,x)=>pax('Mstr','KABIR','SHARMA',3,'2025-01-20T00:00:00',1,false,'Z9999999','2030-12-31T00:00:00','','',f,x);

// SSR extras
const ADT_LCC={Baggage:[{Code:'{{ADT_BAG_CODE}}',Weight:'{{ADT_BAG_WEIGHT}}',Price:'{{ADT_BAG_PRICE}}',Currency:'INR',Origin:'{{ADT_BAG_ORIGIN}}',Destination:'{{ADT_BAG_DEST}}',AirlineCode:'{{ADT_BAG_AIRLINE}}',FlightNumber:'{{ADT_BAG_FLIGHT}}',WayType:'{{ADT_BAG_WAYTYPE}}',Description:0}],MealDynamic:[{Code:'{{ADT_MEAL_CODE}}',AirlineDescription:'{{ADT_MEAL_DESC}}',Price:'{{ADT_MEAL_PRICE}}',Currency:'INR',Origin:'{{ADT_MEAL_ORIGIN}}',Destination:'{{ADT_MEAL_DEST}}',AirlineCode:'{{ADT_MEAL_AIRLINE}}',FlightNumber:'{{ADT_MEAL_FLIGHT}}',WayType:1,Quantity:1,Description:0}],SeatDynamic:[]};
const CHD_LCC={Baggage:[{Code:'{{CHD_BAG_CODE}}',Weight:'{{CHD_BAG_WEIGHT}}',Price:'{{CHD_BAG_PRICE}}',Currency:'INR',Origin:'{{CHD_BAG_ORIGIN}}',Destination:'{{CHD_BAG_DEST}}',AirlineCode:'{{CHD_BAG_AIRLINE}}',FlightNumber:'{{CHD_BAG_FLIGHT}}',WayType:'{{CHD_BAG_WAYTYPE}}',Description:0}],MealDynamic:[{Code:'{{CHD_MEAL_CODE}}',AirlineDescription:'{{CHD_MEAL_DESC}}',Price:'{{CHD_MEAL_PRICE}}',Currency:'INR',Origin:'{{CHD_MEAL_ORIGIN}}',Destination:'{{CHD_MEAL_DEST}}',AirlineCode:'{{CHD_MEAL_AIRLINE}}',FlightNumber:'{{CHD_MEAL_FLIGHT}}',WayType:1,Quantity:1,Description:0}],SeatDynamic:[]};
const INF_LCC={MealDynamic:[{Code:'{{INF_MEAL_CODE}}',AirlineDescription:'{{INF_MEAL_DESC}}',Price:'{{INF_MEAL_PRICE}}',Currency:'INR',Origin:'{{INF_MEAL_ORIGIN}}',Destination:'{{INF_MEAL_DEST}}',AirlineCode:'{{INF_MEAL_AIRLINE}}',FlightNumber:'{{INF_MEAL_FLIGHT}}',WayType:1,Quantity:1,Description:0}]};
const EMPTY_SSR={Baggage:[],MealDynamic:[],SeatDynamic:[]};
// Description is sent as integer 2 (TBO WCF deserializer rejects string).
// Infants carry Seat:{Code:"NoSeat", Description:2} per supplier rule.
// When MEAL_CODE / SEAT_CODE end up empty (SSR returned no options), the
// runtime hook in tbo-hooks.js drops the Meal/Seat keys entirely on Book/Ticket
// so we never POST { Code:"", Description:2 } and trip "Invalid Meal Data".
const ADT_NLCC={Meal:{Code:'{{MEAL_CODE}}',Description:2},Seat:{Code:'{{SEAT_CODE}}',Description:2}};
const CHD_NLCC={Meal:{Code:'{{MEAL_CODE}}',Description:2},Seat:{Code:'{{SEAT_CODE}}',Description:2}};
const INF_NLCC={Meal:{Code:'{{MEAL_CODE}}',Description:2},Seat:{Code:'NoSeat',Description:2}};

// Common bodies
const AUTH={ClientId:'ApiIntegrationNew',UserName:'{{TBO_USERNAME}}',Password:'{{TBO_PASSWORD}}',EndUserIp:'1.1.1.1'};
const FR_STD={TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'};
const FQ_STD={TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'};
const SSR_STD={TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{RESULT_INDEX}}',TraceId:'{{FQ_TRACE_ID}}'};
const TKT_NLCC={TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',BookingId:'{{BOOKING_ID}}'};
const GBD_STD={TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',BookingId:'{{BOOKING_ID}}'};
function bookBody(ri,ti,paxArr){return{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:ri,TraceId:ti,Passengers:paxArr};}
function lccTicket(ri,ti,paxArr){return{PreferredCurrency:'INR',IsBaseCurrencyRequired:'true',TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',TraceId:ti,ResultIndex:ri,Passengers:paxArr};}

// Short-hand request builders
const A=()=>req('Step 1 — Authenticate',authUrl(),AUTH,AUTH_TEST);
const FR=(name,body)=>req(name,tboUrl('FareRule'),body||FR_STD,[]);
const FQ=(name,body,test)=>req(name,tboUrl('FareQuote'),body||FQ_STD,test||FQ_TEST);
const SSR=(name,body,test)=>req(name,tboUrl('SSR'),body||SSR_STD,test||SSR_LCC_TEST);
const BK=(name,body)=>req(name,tboUrl('Book'),body,BOOK_TEST);
const TK_NL=(name,body)=>req(name,tboUrl('Ticket'),body||TKT_NLCC,TICKET_TEST);
const TK_LC=(name,body)=>req(name,tboUrl('Ticket'),body,TICKET_TEST);
const GBD=(name,body)=>req(name,tboUrl('GetBookingDetails'),body||GBD_STD,[]);

// ===== CASES =====

const case01={name:'Case 01 — GDS Domestic Oneway · 1A (AI DEL→BOM, Non-LCC)',item:[
  A(),
  req('Step 2 — Search (JT=1, 1A, AI DEL→BOM 2026-06-15)',tboUrl('Search'),searchBody(1,0,0,1,[seg('DEL','BOM','2026-06-15')]),SEARCH_TEST),
  FR('Step 3 — FareRule'),
  FQ('Step 4 — FareQuote'),
  BK('Step 5 — Book (Non-LCC)',bookBody('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RD(FA)])),
  TK_NL('Step 6 — Ticket (Non-LCC)'),
  GBD('Step 7 — GetBookingDetails')
]};

const case02={name:'Case 02 — LCC Domestic Oneway · 1A+1C+1I with SSR (6E DEL→BOM)',item:[
  A(),
  req('Step 2 — Search (JT=1, 1A+1C+1I, 6E DEL→BOM 2026-06-15)',tboUrl('Search'),searchBody(1,1,1,1,[seg('DEL','BOM','2026-06-15')]),SEARCH_TEST),
  FR('Step 3 — FareRule'),
  FQ('Step 4 — FareQuote'),
  SSR('Step 5 — SSR (LCC — captures bag+meal vars)'),
  TK_LC('Step 6 — Ticket (LCC + SSR)',lccTicket('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RD(FA,ADT_LCC),ROD(FC,CHD_LCC),KD(FI,INF_LCC)])),
  GBD('Step 7 — GetBookingDetails')
]};

const case03={name:'Case 03 — LCC Domestic Return · 2A+2C+1I dual-PNR (6E DEL↔BOM, JT=2)',item:[
  A(),
  req('Step 2 — Search (JT=2, 2A+2C+1I, DEL↔BOM)',tboUrl('Search'),searchBody(2,2,1,2,[seg('DEL','BOM','2026-06-15'),seg('BOM','DEL','2026-06-22')]),SEARCH_OB_IB_TEST),
  req('Step 3a — FareRule (OB)',tboUrl('FareRule'),{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{OB_RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'}, []),
  FQ('Step 4a — FareQuote (OB)',{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{OB_RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'},FQ_OB_TEST),
  req('Step 5 — Ticket OB (LCC)',tboUrl('Ticket'),lccTicket('{{OB_RESULT_INDEX}}','{{FQ_TRACE_OB}}',[RD(OB_FA,EMPTY_SSR),PD(OB_FA,EMPTY_SSR),ROD(OB_FC,EMPTY_SSR),RYD(OB_FC,EMPTY_SSR),KD(OB_FI)]),TICKET_OB_TEST),
  req('Step 6a — FareRule (IB)',tboUrl('FareRule'),{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{IB_RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'}, []),
  FQ('Step 7a — FareQuote (IB)',{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{IB_RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'},FQ_IB_TEST),
  req('Step 8 — Ticket IB (LCC)',tboUrl('Ticket'),lccTicket('{{IB_RESULT_INDEX}}','{{FQ_TRACE_IB}}',[RD(IB_FA,EMPTY_SSR),PD(IB_FA,EMPTY_SSR),ROD(IB_FC,EMPTY_SSR),RYD(IB_FC,EMPTY_SSR),KD(IB_FI)]),TICKET_IB_TEST),
  req('Step 9 — GetBookingDetails OB',tboUrl('GetBookingDetails'),{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',BookingId:'{{OB_BOOKING_ID}}'}, []),
  req('Step 10 — GetBookingDetails IB',tboUrl('GetBookingDetails'),{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',BookingId:'{{IB_BOOKING_ID}}'}, [])
]};

const case04={name:'Case 04 — LCC International Oneway · 1A+1C+1I with SSR + Passport (6E/SG DEL→DXB)',item:[
  A(),
  req('Step 2 — Search (JT=1, 1A+1C+1I, DEL→DXB 2026-07-01)',tboUrl('Search'),searchBody(1,1,1,1,[seg('DEL','DXB','2026-07-01')]),SEARCH_TEST),
  FR('Step 3 — FareRule'),
  FQ('Step 4 — FareQuote'),
  SSR('Step 5 — SSR (LCC)'),
  TK_LC('Step 6 — Ticket (LCC + SSR + Passport)',lccTicket('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RI(FA,ADT_LCC),ROI(FC,CHD_LCC),KI(FI,INF_LCC)])),
  GBD('Step 7 — GetBookingDetails')
]};

const case05={name:'Case 05 — GDS International Return · 2A+2C+1I single PNR (AI DEL↔LHR, JT=2)',item:[
  A(),
  req('Step 2 — Search (JT=2, 2A+2C+1I, AI DEL↔LHR)',tboUrl('Search'),searchBody(2,2,1,2,[seg('DEL','LHR','2026-07-01'),seg('LHR','DEL','2026-07-15')]),SEARCH_TEST),
  FR('Step 3 — FareRule'),
  FQ('Step 4 — FareQuote'),
  BK('Step 5 — Book (Non-LCC + Passport)',bookBody('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RI(FA),PI(FA),ROI(FC),RYI(FC),KI(FI)])),
  TK_NL('Step 6 — Ticket (Non-LCC)'),
  GBD('Step 7 — GetBookingDetails')
]};

const FQ_SR_BODY={TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{OB_RESULT_INDEX}},{{IB_RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'};
const case06={name:'Case 06 — LCC Special Return · 2A+1C (6E DEL↔BOM, JT=5, one PNR)',item:[
  A(),
  req('Step 2 — Search (JT=5, 2A+1C, DEL↔BOM)',tboUrl('Search'),searchBody(2,1,0,5,[seg('DEL','BOM','2026-06-15'),seg('BOM','DEL','2026-06-22')]),SEARCH_OB_IB_TEST),
  req('Step 3 — FareRule (OB only)',tboUrl('FareRule'),{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{OB_RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'}, []),
  FQ('Step 4 — FareQuote (OB,IB comma-separated — returns FQ_RESULT_INDEX)',FQ_SR_BODY,FQ_SR_TEST),
  TK_LC('Step 5 — Ticket (LCC, use FQ_RESULT_INDEX)',lccTicket('{{FQ_RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RD(FA,EMPTY_SSR),PD(FA,EMPTY_SSR),ROD(FC,EMPTY_SSR)])),
  GBD('Step 6 — GetBookingDetails')
]};

const case07={name:'Case 07 — GDS Special Return + SSR · 2A+2C+1I (AI DEL↔BOM, JT=5, Non-LCC)',item:[
  A(),
  req('Step 2 — Search (JT=5, 2A+2C+1I, DEL↔BOM)',tboUrl('Search'),searchBody(2,2,1,5,[seg('DEL','BOM','2026-06-15'),seg('BOM','DEL','2026-06-22')]),SEARCH_OB_IB_TEST),
  req('Step 3 — FareRule (OB only)',tboUrl('FareRule'),{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{OB_RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'}, []),
  FQ('Step 4 — FareQuote (JT=5 OB only — returns FQ_RESULT_INDEX)',{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{OB_RESULT_INDEX}}',TraceId:'{{TRACE_ID}}'},FQ_SR_TEST),
  SSR('Step 5 — SSR (Non-LCC, use FQ_RESULT_INDEX)',{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{FQ_RESULT_INDEX}}',TraceId:'{{FQ_TRACE_ID}}'},SSR_NONLCC_TEST),
  BK('Step 6 — Book (Non-LCC + SSR objects)',bookBody('{{FQ_RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RD(FA,ADT_NLCC),PD(FA,ADT_NLCC),ROD(FC,CHD_NLCC),RYD(FC,CHD_NLCC),KD(FI,INF_NLCC)])),
  TK_NL('Step 7 — Ticket (Non-LCC)'),
  GBD('Step 8 — GetBookingDetails')
]};

const case08={name:'Case 08 — GDS Multiway · 2A (AI DEL→BOM→MAA, JT=3)',item:[
  A(),
  req('Step 2 — Search (JT=3, 2A, DEL→BOM 2026-06-15, BOM→MAA 2026-06-20)',tboUrl('Search'),searchBody(2,0,0,3,[seg('DEL','BOM','2026-06-15'),seg('BOM','MAA','2026-06-20')]),SEARCH_TEST),
  FR('Step 3 — FareRule'),
  FQ('Step 4 — FareQuote'),
  BK('Step 5 — Book (Non-LCC, 2 ADT)',bookBody('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RD(FA),AMD(FA)])),
  TK_NL('Step 6 — Ticket (Non-LCC)'),
  GBD('Step 7 — GetBookingDetails')
]};

const CAL_SEARCH={TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',AdultCount:'2',ChildCount:'0',InfantCount:'0',DirectFlight:'false',OneStopFlight:'false',JourneyType:'1',PreferredAirlines:null,Segments:[{Origin:'DEL',Destination:'BOM',FlightCabinClass:'2',PreferredDepartureTime:'{{BEST_DATE}}T00:00:00',PreferredArrivalTime:'{{BEST_DATE}}T00:00:00'}],Sources:null};
const case09={name:'Case 09 — Calendar Fare Oneway · 2A (DEL→BOM, lowest-fare day)',item:[
  A(),
  req('Step 2 — GetCalendarFare (captures BEST_DATE)',tboUrl('GetCalendarFare'),searchBody(2,0,0,1,[seg('DEL','BOM','2026-06-01')]),CALENDAR_TEST),
  req('Step 3 — UpdateCalendarFareOfDay (use BEST_DATE)',tboUrl('UpdateCalendarFareOfDay'),CAL_SEARCH,[]),
  req('Step 4 — Search (use BEST_DATE)',tboUrl('Search'),CAL_SEARCH,SEARCH_TEST),
  FR('Step 5 — FareRule'),
  FQ('Step 6 — FareQuote (check IS_LCC)'),
  BK('Step 7a — Book (if Non-LCC — skip if LCC)',bookBody('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RD(FA),AMD(FA)])),
  TK_NL('Step 8a — Ticket (if Non-LCC)'),
  TK_LC('Step 7b — Ticket (if LCC — skip Step 7a/8a)',lccTicket('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RD(FA,EMPTY_SSR),AMD(FA,EMPTY_SSR)])),
  GBD('Step 9 — GetBookingDetails')
]};

const case10SearchBody={TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',AdultCount:'2',ChildCount:'0',InfantCount:'0',DirectFlight:'false',OneStopFlight:'false',JourneyType:'1',PreferredAirlines:['AI'],Segments:[seg('DEL','BOM','2026-08-20',1)],Sources:null};
const case10PriceRBDBody={EndUserIp:'1.1.1.1',TokenId:'{{TOKEN}}',TraceId:'{{TRACE_ID}}',AdultCount:'2',ChildCount:'0',InfantCount:'0',AirSearchResult:[{ResultIndex:'{{SEARCH_RESULT_INDEX}}',Source:'{{SOURCE}}',IsLCC:false,IsRefundable:'{{IS_REFUNDABLE}}',AirlineRemark:'',Segments:[[{TripIndicator:1,SegmentIndicator:1,Airline:{AirlineCode:'AI',AirlineName:'Air India',FlightNumber:'{{FLIGHT_NO}}',FareClass:'{{RBD}}',OperatingCarrier:''}}]]}]};
const case10={name:'Case 10 — GDS Search + PriceRBD · 2A (AI DEL→BOM, JT=1)',item:[
  A(),
  req('Step 2 — Search (JT=1, FlightCabinClass=1, AI DEL→BOM)',tboUrl('Search'),case10SearchBody,SEARCH_RBD_TEST),
  req('Step 3 — PriceRBD (captures RBD_RESULT_INDEX)',tboUrl('PriceRBD'),case10PriceRBDBody,PRICERBD_TEST),
  req('Step 4 — FareRule (use RBD vars)',tboUrl('FareRule'),{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{RBD_RESULT_INDEX}}',TraceId:'{{RBD_TRACE_ID}}'}, []),
  FQ('Step 5 — FareQuote (use RBD vars)',{TokenId:'{{TOKEN}}',EndUserIp:'1.1.1.1',ResultIndex:'{{RBD_RESULT_INDEX}}',TraceId:'{{RBD_TRACE_ID}}'},FQ_TEST),
  BK('Step 6 — Book (Non-LCC)',bookBody('{{RBD_RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RD(FA),AMD(FA)])),
  TK_NL('Step 7 — Ticket (Non-LCC)'),
  GBD('Step 8 — GetBookingDetails')
]};

const case11={name:'Case 11 — NDC International Oneway · 2A+2C with SSR (AI NDC DEL→LHR)',item:[
  A(),
  req('Step 2 — Search (JT=1, 2A+2C, DEL→LHR — pick NDC result)',tboUrl('Search'),searchBody(2,2,0,1,[seg('DEL','LHR','2026-07-01')]),SEARCH_TEST),
  FR('Step 3 — FareRule'),
  FQ('Step 4 — FareQuote (IS_LCC determines NDC flow)'),
  SSR('Step 5 — SSR (LCC arrays if IsLCC=true, else use Non-LCC SSR test)',SSR_STD,SSR_LCC_TEST),
  BK('Step 6a — Book (if Non-LCC — skip if LCC)',bookBody('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RI(FA),PI(FA),ROI(FC),RYI(FC)])),
  TK_NL('Step 6b — Ticket (if Non-LCC, after Book)'),
  TK_LC('Step 6c — Ticket (if LCC — skip 6a/6b)',lccTicket('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RI(FA,ADT_LCC),PI(FA,ADT_LCC),ROI(FC,CHD_LCC),RYI(FC,CHD_LCC)])),
  GBD('Step 7 — GetBookingDetails')
]};

const case12={name:'Case 12 — NDC International Return · 2A+2C (AI NDC DEL↔LHR, JT=2)',item:[
  A(),
  req('Step 2 — Search (JT=2, 2A+2C, DEL↔LHR — pick NDC result)',tboUrl('Search'),searchBody(2,2,0,2,[seg('DEL','LHR','2026-08-25'),seg('LHR','DEL','2026-09-08')]),SEARCH_TEST),
  FR('Step 3 — FareRule'),
  FQ('Step 4 — FareQuote (IS_LCC determines NDC flow)'),
  BK('Step 5a — Book (if Non-LCC — skip if LCC)',bookBody('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RI(FA),PI(FA),ROI(FC),RYI(FC)])),
  TK_NL('Step 5b — Ticket (if Non-LCC, after Book)'),
  TK_LC('Step 5c — Ticket (if LCC — skip 5a/5b)',lccTicket('{{RESULT_INDEX}}','{{FQ_TRACE_ID}}',[RI(FA,EMPTY_SSR),PI(FA,EMPTY_SSR),ROI(FC,EMPTY_SSR),RYI(FC,EMPTY_SSR)])),
  GBD('Step 6 — GetBookingDetails')
]};

// ===== COLLECTION =====
const VARS=[
  ['TBO_USERNAME',''],['TBO_PASSWORD',''],['TOKEN',''],
  ['TRACE_ID',''],['RESULT_INDEX',''],['FQ_TRACE_ID',''],['IS_LCC',''],
  ['BOOKING_ID',''],['PNR',''],
  ['ADT_BASE_FARE','0'],['ADT_TAX','0'],['ADT_YQ_TAX','0'],
  ['CHD_BASE_FARE','0'],['CHD_TAX','0'],['CHD_YQ_TAX','0'],
  ['INF_BASE_FARE','0'],['INF_TAX','0'],['INF_YQ_TAX','0'],
  ['OB_RESULT_INDEX',''],['IB_RESULT_INDEX',''],['FQ_RESULT_INDEX',''],
  ['OB_BOOKING_ID',''],['OB_PNR',''],['IB_BOOKING_ID',''],['IB_PNR',''],
  ['FQ_TRACE_OB',''],['FQ_TRACE_IB',''],
  ['OB_ADT_BASE_FARE','0'],['OB_ADT_TAX','0'],['OB_ADT_YQ_TAX','0'],
  ['OB_CHD_BASE_FARE','0'],['OB_CHD_TAX','0'],['OB_CHD_YQ_TAX','0'],
  ['OB_INF_BASE_FARE','0'],['OB_INF_TAX','0'],['OB_INF_YQ_TAX','0'],
  ['IB_ADT_BASE_FARE','0'],['IB_ADT_TAX','0'],['IB_ADT_YQ_TAX','0'],
  ['IB_CHD_BASE_FARE','0'],['IB_CHD_TAX','0'],['IB_CHD_YQ_TAX','0'],
  ['IB_INF_BASE_FARE','0'],['IB_INF_TAX','0'],['IB_INF_YQ_TAX','0'],
  ['SEARCH_RESULT_INDEX',''],['RBD_RESULT_INDEX',''],['RBD_TRACE_ID',''],
  ['SOURCE','4'],['IS_REFUNDABLE','true'],['FLIGHT_NO',''],['RBD',''],
  ['BEST_DATE','2026-06-15'],
  ['MEAL_CODE',''],['MEAL_DESCRIPTION',''],['SEAT_CODE',''],['SEAT_DESCRIPTION',''],
  ['ADT_BAG_CODE',''],['ADT_BAG_WEIGHT','0'],['ADT_BAG_PRICE','0'],
  ['ADT_BAG_ORIGIN',''],['ADT_BAG_DEST',''],['ADT_BAG_AIRLINE',''],['ADT_BAG_FLIGHT',''],['ADT_BAG_WAYTYPE','1'],
  ['ADT_MEAL_CODE',''],['ADT_MEAL_DESC',''],['ADT_MEAL_PRICE','0'],
  ['ADT_MEAL_ORIGIN',''],['ADT_MEAL_DEST',''],['ADT_MEAL_AIRLINE',''],['ADT_MEAL_FLIGHT',''],
  ['CHD_BAG_CODE',''],['CHD_BAG_WEIGHT','0'],['CHD_BAG_PRICE','0'],
  ['CHD_BAG_ORIGIN',''],['CHD_BAG_DEST',''],['CHD_BAG_AIRLINE',''],['CHD_BAG_FLIGHT',''],['CHD_BAG_WAYTYPE','1'],
  ['CHD_MEAL_CODE',''],['CHD_MEAL_DESC',''],['CHD_MEAL_PRICE','0'],
  ['CHD_MEAL_ORIGIN',''],['CHD_MEAL_DEST',''],['CHD_MEAL_AIRLINE',''],['CHD_MEAL_FLIGHT',''],
  ['INF_MEAL_CODE',''],['INF_MEAL_DESC',''],['INF_MEAL_PRICE','0'],
  ['INF_MEAL_ORIGIN',''],['INF_MEAL_DEST',''],['INF_MEAL_AIRLINE',''],['INF_MEAL_FLIGHT','']
].map(([key,value])=>({key,value,type:'string'}));

const collection={
  info:{
    _postman_id:'tbo-cert-tests-2026',
    name:'TBO Air API — Certification Tests',
    description:'12 TBO/TekTravels B2B air certification test cases.\n\nSetup:\n1. Set TBO_USERNAME and TBO_PASSWORD in collection variables.\n2. Run Authenticate in each folder first — TOKEN is auto-captured.\n3. After each Search, manually copy the target ResultIndex into RESULT_INDEX (or OB/IB variants).\n4. SSR variables are auto-captured from the SSR request test script.\n5. FareQuote auto-computes per-pax fare by dividing FareBreakdown totals by PassengerCount.',
    schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable:VARS,
  item:[case01,case02,case03,case04,case05,case06,case07,case08,case09,case10,case11,case12]
};

const out=path.join(__dirname,'TBO_Certification_Tests.postman_collection.json');
fs.writeFileSync(out,JSON.stringify(collection,null,2));
console.log('Written:',out);
console.log('Size:',Math.round(fs.statSync(out).size/1024),'KB');
