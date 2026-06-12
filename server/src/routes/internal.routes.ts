import mongoose from "mongoose";
import { Router, type Request, type Response, type NextFunction } from "express";
import { getAgentConfig } from "../lib/agentCache";
import { getPlatformConfig } from "../lib/platformConfig";
import { BookingModel, PRODUCT_TYPES, type ProductType } from "../models/Booking";
import { HttpError } from "../middleware/error";

const router = Router();

// GET /api/internal/agent-config?slug=raj
// Called by the Next.js middleware for subdomain routing. No auth header required
// because it only returns non-sensitive branding + markup data (no KYC fields).
// Never add a corresponding Next.js proxy route — this must not be browser-reachable.
router.get(
  "/agent-config",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.query;
      if (!slug || typeof slug !== "string") {
        throw new HttpError(400, "slug query param is required");
      }

      const agent = await getAgentConfig(slug);
      if (!agent) {
        throw new HttpError(404, "agent not found");
      }

      res.json(agent);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/internal/platform-config
// Called by Next.js API route handlers to fetch the L1 markup.
// Returns only the markup subdoc — not version, updatedBy, or timestamps.
// Never add a Next.js proxy route for this — must not be browser-reachable.
router.get(
  "/platform-config",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await getPlatformConfig();
      res.json({ markup: config.markup });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/internal/record-booking
// Called by Next.js routes after TBO confirms a subdomain customer booking.
// Creates a BookingModel entry so the agent's settlement query sees all bookings.
// ownerId is set to agentId — the agent "owns" subdomain bookings for dashboard display.
router.post(
  "/record-booking",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        agentId: agentIdStr,
        productType,
        pnr,
        tboFare,
        platformMarkup,
        agentNetRate,
        agentMarkup,
        customerPaid,
      } = req.body as {
        agentId:        string;
        productType:    string;
        pnr?:           string;
        tboFare:        number;
        platformMarkup: number;
        agentNetRate:   number;
        agentMarkup:    number;
        customerPaid:   number;
      };

      if (!agentIdStr || !mongoose.isValidObjectId(agentIdStr)) {
        throw new HttpError(400, "agentId must be a valid ObjectId");
      }
      if (!(PRODUCT_TYPES as readonly string[]).includes(productType)) {
        throw new HttpError(400, `productType must be one of: ${PRODUCT_TYPES.join(", ")}`);
      }
      if (typeof customerPaid !== "number" || customerPaid <= 0) {
        throw new HttpError(400, "customerPaid must be a positive number");
      }

      const agentId = new mongoose.Types.ObjectId(agentIdStr);

      const booking = await BookingModel.create({
        ownerId:        agentId,
        ownerRole:      "agent",
        agentId,
        productType:    productType as ProductType,
        status:         "active",
        pnr,
        amount:         customerPaid,
        currency:       "INR",
        tboFare,
        platformMarkup,
        netFare:        agentNetRate,
        agentMarkup,
        customerPaid,
        details:        {},
      });

      res.status(201).json({ bookingId: String(booking._id) });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
