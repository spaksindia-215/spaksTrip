// TBO body-mutation hooks.
//
// This file is auto-loaded by run-tbo-tests.js (and therefore by
// run-failing-cases.js) if present. Override the path with TBO_HOOKS_FILE.
//
// Use it to rewrite outgoing request bodies — e.g. swap routes / dates,
// change Sources, force a specific ResultIndex shape, inject vendor-specific
// fields — without editing the Postman collection or the runner.
//
// API:
//   mutateBody(ctx, body) -> string | null | undefined
//   - return a new body string to override
//   - return anything falsy to keep the existing body
//   ctx = {
//     caseNum, stepIdx, stepName, url, vars: { ...all collection vars },
//     journeyType: "1"|"2"|"3"|"4"|"5"|""
//   }
//
// Examples below are commented out. Uncomment / adapt as needed.

"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_ROUTE_OVERRIDES = {
  case07: {
    activeRoute: "BOM_CCU",
    routes: {
      DEL_BLR: ["DEL", "BLR"],
      DEL_MAA: ["DEL", "MAA"],
      DEL_HYD: ["DEL", "HYD"],
      BOM_BLR: ["BOM", "BLR"],
      BOM_CCU: ["BOM", "CCU"],
    },
  },
};

const ROUTE_OVERRIDE_FILE = process.env.TBO_ROUTE_OVERRIDES_FILE
  ? path.resolve(process.env.TBO_ROUTE_OVERRIDES_FILE)
  : path.join(__dirname, "tbo-route-overrides.json");

function mergeRouteConfig(base, override) {
  return {
    ...base,
    ...override,
    routes: {
      ...(base?.routes || {}),
      ...(override?.routes || {}),
    },
  };
}

function loadRouteOverrides() {
  if (!fs.existsSync(ROUTE_OVERRIDE_FILE)) return DEFAULT_ROUTE_OVERRIDES;
  try {
    const parsed = JSON.parse(fs.readFileSync(ROUTE_OVERRIDE_FILE, "utf8"));
    return {
      ...DEFAULT_ROUTE_OVERRIDES,
      ...parsed,
      case07: mergeRouteConfig(DEFAULT_ROUTE_OVERRIDES.case07, parsed.case07),
    };
  } catch {
    return DEFAULT_ROUTE_OVERRIDES;
  }
}

function parseRouteChoice(choice, routes) {
  if (Array.isArray(choice) && choice.length >= 2) {
    return [String(choice[0]).toUpperCase(), String(choice[1]).toUpperCase()];
  }

  if (typeof choice !== "string") return null;

  const trimmed = choice.trim();
  if (!trimmed) return null;

  if (routes && Array.isArray(routes[trimmed])) {
    return parseRouteChoice(routes[trimmed], routes);
  }

  const match = trimmed.toUpperCase().match(/\b([A-Z]{3})\b[^A-Z0-9]*\b([A-Z]{3})\b/);
  return match ? [match[1], match[2]] : null;
}

function resolveCaseRoute(caseNum) {
  const config = loadRouteOverrides();
  const padded = String(caseNum).padStart(2, "0");
  const caseConfig = config[`case${padded}`] || config[`case${caseNum}`];
  if (!caseConfig) return null;

  const envChoice =
    process.env[`TBO_CASE${padded}_ROUTE`] ||
    process.env[`TBO_CASE${caseNum}_ROUTE`];

  return (
    parseRouteChoice(envChoice, caseConfig.routes) ||
    parseRouteChoice(caseConfig.activeRoute, caseConfig.routes) ||
    parseRouteChoice(caseConfig.route, caseConfig.routes)
  );
}

module.exports = {
  mutateBody(ctx, body) {
    // ── Example 1: force comma-separated OB,IB ResultIndex on JT=5 FR/FQ ───
    // (the failing-cases collection already does this in the body — example
    // here is for when you import a different collection that doesn't.)
    //
    // if (ctx.journeyType === "5" && /farequote|farerule/i.test(ctx.stepName)) {
    //   const ob = ctx.vars.OB_RESULT_INDEX;
    //   const ib = ctx.vars.IB_RESULT_INDEX;
    //   if (ob && ib) {
    //     return body.replace(/"ResultIndex"\s*:\s*"[^"]*"/,
    //       `"ResultIndex": "${ob},${ib}"`);
    //   }
    // }

    // ── Example 2: swap route in case 6 Search ─────────────────────────────
    //
    // if (ctx.caseNum === 6 && /search/i.test(ctx.stepName)) {
    //   const obj = JSON.parse(body);
    //   obj.Segments[0].Origin = "DEL";
    //   obj.Segments[0].Destination = "BLR";
    //   obj.Segments[1].Origin = "BLR";
    //   obj.Segments[1].Destination = "DEL";
    //   obj.Sources = ["6E"];
    //   return JSON.stringify(obj);
    // }

    // ── Case 7: route override via tbo-route-overrides.json or env vars ────
    // Change case07.activeRoute in the JSON, or use TBO_CASE07_ROUTE.
    if (ctx.caseNum === 7 && /search/i.test(ctx.stepName)) {
      try {
        const obj = JSON.parse(body);
        const route = resolveCaseRoute(ctx.caseNum);
        if (route && Array.isArray(obj.Segments) && obj.Segments.length >= 2) {
          const [origin, destination] = route;
          obj.Segments[0].Origin = origin;
          obj.Segments[0].Destination = destination;
          obj.Segments[1].Origin = destination;
          obj.Segments[1].Destination = origin;
          return JSON.stringify(obj);
        }
      } catch { /* leave body untouched on parse failure */ }
    }

    // ── Case 7: normalize Meal/Seat on Non-LCC Book/Ticket passengers ──────
    // Three problems this rule fixes:
    //   - "Invalid Meal Data" / "Invalid Seat Data" when SSR returned no codes
    //     and the body POSTs { Code: "", Description: "" }
    //   - TBO WCF deserializer rejects Description as string — it must be int 2
    //   - Infants (PaxType 3) need Seat: { Code: "NoSeat", Description: 2 }
    //
    // Behavior per passenger:
    //   - Meal.Code empty (or still a {{var}}) → delete the Meal key entirely
    //   - Meal.Code present                    → force Description = 2 (int)
    //   - Adult/Child Seat empty               → delete Seat
    //   - Adult/Child Seat present             → force Description = 2 (int)
    //   - Infant (PaxType 3)                   → Seat = { Code: "NoSeat", Description: 2 }
    if (ctx.caseNum === 7 && /book|ticket/i.test(ctx.stepName)) {
      try {
        const obj = JSON.parse(body);
        if (Array.isArray(obj.Passengers)) {
          const isEmpty = (s) => !s || s.startsWith("{{");
          obj.Passengers = obj.Passengers.map((p) => {
            const out = { ...p };

            if (out.Meal !== undefined) {
              if (isEmpty(out.Meal.Code)) delete out.Meal;
              else out.Meal = { Code: out.Meal.Code, Description: 2 };
            }

            if (out.PaxType === 3) {
              out.Seat = { Code: "NoSeat", Description: 2 };
            } else if (out.Seat !== undefined) {
              if (isEmpty(out.Seat.Code)) delete out.Seat;
              else out.Seat = { Code: out.Seat.Code, Description: 2 };
            }

            return out;
          });
          return JSON.stringify(obj);
        }
      } catch { /* leave body untouched on parse failure */ }
    }

    // ── Example 3: shift all PreferredDepartureTime values forward 60 days ──
    //
    // if (/search/i.test(ctx.stepName)) {
    //   const obj = JSON.parse(body);
    //   if (Array.isArray(obj.Segments)) {
    //     obj.Segments = obj.Segments.map((s) => {
    //       const shift = (iso) => {
    //         const [d, t = "00:00:00"] = String(iso).split("T");
    //         const dt = new Date(d + "T00:00:00Z");
    //         dt.setUTCDate(dt.getUTCDate() + 60);
    //         return `${dt.toISOString().slice(0,10)}T${t}`;
    //       };
    //       return {
    //         ...s,
    //         PreferredDepartureTime: shift(s.PreferredDepartureTime),
    //         PreferredArrivalTime:   shift(s.PreferredArrivalTime),
    //       };
    //     });
    //   }
    //   return JSON.stringify(obj);
    // }

    return null;
  },
};
