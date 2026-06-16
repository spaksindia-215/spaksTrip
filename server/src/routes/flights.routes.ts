import { Router } from "express";
import * as flights from "../controllers/flights.controller";

// TBO flight endpoints. Paths mirror the Next.js /api/flights/* routes 1:1 so the
// Vercel thin-proxy (proxyToRailway) maps straight through. These are PUBLIC (no
// auth middleware) exactly like the original Next handlers — agent context arrives
// via the forwarded x-agent-id / x-agent-slug headers, not a session.
const router = Router();

// Specific paths first, then the /:id/* patterns.
router.post("/search", flights.searchFlights);
router.post("/calendar-fare", flights.calendarFare);
router.post("/calendar-fare/update", flights.calendarFareUpdate);
router.post("/razorpay/create-order", flights.createPaymentOrder);
router.post("/razorpay/verify-payment", flights.verifyPayment);
router.post("/book", flights.book);
router.post("/ticket", flights.ticket);
router.get("/booking/:id", flights.bookingDetail);

router.get("/:id/fare-quote", flights.fareQuote);
router.get("/:id/fare-rule", flights.fareRule);
router.get("/:id/ssr", flights.ssr);

export default router;
