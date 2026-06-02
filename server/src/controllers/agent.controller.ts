import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { BookingModel, BOOKING_STATUSES, type BookingStatus } from "../models/Booking";
import { UserModel, type Role } from "../models/User";
import { validateBookingCreate } from "../validators/agent.validators";
import { HttpError } from "../middleware/error";

function ownerIdFrom(req: Request): string {
  if (!req.user) throw new HttpError(401, "Unauthorized");
  return req.user.sub;
}

function ownerRoleFrom(req: Request): Role {
  if (!req.user) throw new HttpError(401, "Unauthorized");
  return req.user.role;
}

function paramId(req: Request): string {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
  return id;
}

// Lazily expire held bookings whose window has passed (on-read enforcement).
// This also frees the credit those holds were consuming.
async function sweepExpiredHolds(ownerId: string): Promise<void> {
  await BookingModel.updateMany(
    { ownerId, status: "held", holdExpiresAt: { $lte: new Date() } },
    { $set: { status: "cancelled" } },
  );
}

// Outstanding credit consumed by live holds.
async function creditUsed(ownerId: string): Promise<number> {
  const rows = await BookingModel.aggregate<{ total: number }>([
    { $match: { ownerId: new mongoose.Types.ObjectId(ownerId), status: "held" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return rows[0]?.total ?? 0;
}

export async function listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = ownerIdFrom(req);
    await sweepExpiredHolds(ownerId);

    const filter: Record<string, unknown> = { ownerId };
    const { status } = req.query;
    if (typeof status === "string" && status.length > 0) {
      if (!(BOOKING_STATUSES as readonly string[]).includes(status)) {
        throw new HttpError(400, `status must be one of: ${BOOKING_STATUSES.join(", ")}`);
      }
      filter.status = status as BookingStatus;
    }

    const items = await BookingModel.find(filter).sort({ createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  } catch (e) {
    next(e);
  }
}

export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = ownerIdFrom(req);
    const ownerRole = ownerRoleFrom(req);
    const input = validateBookingCreate(req.body);

    // Holds consume credit — enforce the per-agent limit.
    if (input.status === "held") {
      await sweepExpiredHolds(ownerId);
      const user = await UserModel.findById(ownerId);
      if (!user) throw new HttpError(401, "User not found");
      if (user.creditLimit == null) {
        throw new HttpError(403, "Your credit limit hasn't been set yet. Please contact admin.");
      }
      const used = await creditUsed(ownerId);
      if (used + input.amount > user.creditLimit) {
        const available = Math.max(0, user.creditLimit - used);
        throw new HttpError(403, `Hold exceeds available credit (₹${available} remaining)`);
      }
    }

    const booking = await BookingModel.create({
      ownerId,
      ownerRole,
      productType: input.productType,
      status: input.status,
      pnr: input.pnr,
      amount: input.amount,
      currency: input.currency ?? "INR",
      holdExpiresAt:
        input.status === "held" ? new Date(Date.now() + input.holdMinutes * 60_000) : undefined,
      details: input.details,
    });

    res.status(201).json({ booking: booking.toJSON() });
  } catch (e) {
    next(e);
  }
}

// Transition a held booking to confirmed ("active").
export async function confirmHold(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = ownerIdFrom(req);
    const id = paramId(req);
    const booking = await BookingModel.findOneAndUpdate(
      { _id: id, ownerId, status: "held", holdExpiresAt: { $gt: new Date() } },
      { $set: { status: "active" }, $unset: { holdExpiresAt: "" } },
      { new: true },
    );
    if (!booking) throw new HttpError(404, "Active hold not found (it may have expired)");
    res.json({ booking: booking.toJSON() });
  } catch (e) {
    next(e);
  }
}

// Cancel an active booking or release a held one.
export async function cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = ownerIdFrom(req);
    const id = paramId(req);
    const booking = await BookingModel.findOneAndUpdate(
      { _id: id, ownerId, status: { $in: ["active", "held"] } },
      { $set: { status: "cancelled" } },
      { new: true },
    );
    if (!booking) throw new HttpError(404, "Booking not found or not cancellable");
    res.json({ booking: booking.toJSON() });
  } catch (e) {
    next(e);
  }
}

export async function lookupPnr(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = ownerIdFrom(req);
    const pnr = typeof req.params.pnr === "string" ? req.params.pnr.trim() : "";
    if (!pnr) throw new HttpError(400, "PNR is required");
    const booking = await BookingModel.findOne({ ownerId, pnr });
    if (!booking) throw new HttpError(404, "No booking found for that PNR");
    res.json({ booking: booking.toJSON() });
  } catch (e) {
    next(e);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = ownerIdFrom(req);
    await sweepExpiredHolds(ownerId);
    const user = await UserModel.findById(ownerId);
    if (!user) throw new HttpError(404, "User not found");

    const used = await creditUsed(ownerId);
    const limit = user.creditLimit;
    res.json({
      profile: {
        id: String(user._id),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        kyc: {
          aadharProvided: Boolean(user.aadhar),
          gst: user.gst ?? null,
          pan: user.pan ?? null,
        },
        creditLimit: limit,
        creditUsed: used,
        creditAvailable: limit != null ? Math.max(0, limit - used) : null,
        walletBalance: user.walletBalance,
      },
    });
  } catch (e) {
    next(e);
  }
}
