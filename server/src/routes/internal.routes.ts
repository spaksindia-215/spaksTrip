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
// Called by Next.js routes after TBO confirms a booking.
// Creates a BookingModel entry so the customer dashboard and agent settlement sees all bookings.
// For agent bookings: ownerId=agentId, ownerRole="agent", agentId=agentId
// For customer bookings: ownerId=customerId (extracted from ownerIdStr if provided), ownerRole="customer"
router.post(
  "/record-booking",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        agentId: agentIdStr,
        customerId: customerIdStr,
        productType,
        status,
        pnr,
        tboFare,
        platformMarkup,
        agentNetRate,
        agentMarkup,
        customerPaid,
      } = req.body as {
        agentId?:       string;
        customerId?:    string;
        productType:    string;
        status?:        string;
        pnr?:           string;
        tboFare:        number;
        platformMarkup: number;
        agentNetRate:   number;
        agentMarkup:    number;
        customerPaid:   number;
      };

      if (!(PRODUCT_TYPES as readonly string[]).includes(productType)) {
        throw new HttpError(400, `productType must be one of: ${PRODUCT_TYPES.join(", ")}`);
      }
      if (typeof customerPaid !== "number" || customerPaid <= 0) {
        throw new HttpError(400, "customerPaid must be a positive number");
      }

      // Determine owner based on whether this is an agent or customer booking
      let ownerId: mongoose.Types.ObjectId;
      let ownerRole: "agent" | "customer";
      let agentIdObj: mongoose.Types.ObjectId | undefined;

      if (agentIdStr) {
        // Agent booking (subdomain customer)
        if (!mongoose.isValidObjectId(agentIdStr)) {
          throw new HttpError(400, "agentId must be a valid ObjectId");
        }
        ownerId = new mongoose.Types.ObjectId(agentIdStr);
        ownerRole = "agent";
        agentIdObj = ownerId;
      } else if (customerIdStr) {
        // Regular customer booking
        if (!mongoose.isValidObjectId(customerIdStr)) {
          throw new HttpError(400, "customerId must be a valid ObjectId");
        }
        ownerId = new mongoose.Types.ObjectId(customerIdStr);
        ownerRole = "customer";
        agentIdObj = undefined;
      } else {
        throw new HttpError(400, "Either agentId or customerId must be provided");
      }

      const booking = await BookingModel.create({
        ownerId,
        ownerRole,
        agentId:        agentIdObj,
        productType:    productType as ProductType,
        status:         (status as any) || "active",
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

// GET /api/internal/egress-ip
// Diagnostic: returns the public IP that THIS server uses for outbound calls.
// Used to confirm Railway provides a stable static egress IP before whitelisting
// it with TBO. Call it across several redeploys and verify the value is constant.
// Never add a Next.js proxy route — keep it off the browser-reachable surface.
router.get(
  "/egress-ip",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const upstream = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(10_000),
      });
      if (!upstream.ok) {
        throw new HttpError(502, `ipify returned HTTP ${upstream.status}`);
      }
      const data = (await upstream.json()) as { ip?: string };
      res.json({ egressIp: data.ip ?? null, checkedAt: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
