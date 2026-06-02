import { Router } from "express";
import {
  listBookings,
  createBooking,
  confirmHold,
  cancelBooking,
  lookupPnr,
  getProfile,
} from "../controllers/agent.controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const router = Router();

// Shared by Agent and B2B Agent — both use the same booking backend.
router.use(authMiddleware, roleMiddleware("agent", "b2b_agent"));

router.get("/bookings", listBookings);
router.post("/bookings", createBooking);
router.post("/bookings/:id/confirm", confirmHold);
router.post("/bookings/:id/cancel", cancelBooking);
router.get("/bookings/pnr/:pnr", lookupPnr);
router.get("/profile", getProfile);

export default router;
