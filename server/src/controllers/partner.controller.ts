import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { PartnerResourceModel, RESOURCE_TYPES, type ResourceType } from "../models/PartnerResource";
import { BookingModel } from "../models/Booking";
import {
  validateResourceCreate,
  validateResourceUpdate,
} from "../validators/partner.validators";
import { HttpError } from "../middleware/error";

function partnerIdFrom(req: Request): string {
  if (!req.user) throw new HttpError(401, "Unauthorized");
  return req.user.sub;
}

function ensureValidId(id: string): void {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
}

export async function listResources(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const filter: Record<string, unknown> = { partnerId };
    const { type } = req.query;
    if (typeof type === "string") {
      if (!(RESOURCE_TYPES as readonly string[]).includes(type)) {
        throw new HttpError(400, `type must be one of: ${RESOURCE_TYPES.join(", ")}`);
      }
      filter.type = type as ResourceType;
    }
    const items = await PartnerResourceModel.find(filter).sort({ createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  } catch (e) {
    next(e);
  }
}

export async function createResource(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const input = validateResourceCreate(req.body);
    const doc = await PartnerResourceModel.create({ ...input, partnerId });
    res.status(201).json({ item: doc.toJSON() });
  } catch (e) {
    next(e);
  }
}

function paramId(req: Request): string {
  const raw = req.params.id;
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  ensureValidId(id);
  return id;
}

export async function updateResource(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const id = paramId(req);
    const updates = validateResourceUpdate(req.body);
    const doc = await PartnerResourceModel.findOneAndUpdate(
      { _id: id, partnerId },
      { $set: updates },
      { new: true },
    );
    if (!doc) throw new HttpError(404, "Resource not found");
    res.json({ item: doc.toJSON() });
  } catch (e) {
    next(e);
  }
}

// Bookings placed against this partner's inventory (scoped by partnerId).
export async function listBookings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const items = await BookingModel.find({ partnerId }).sort({ createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  } catch (e) {
    next(e);
  }
}

export async function deleteResource(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const id = paramId(req);
    const result = await PartnerResourceModel.findOneAndDelete({ _id: id, partnerId });
    if (!result) throw new HttpError(404, "Resource not found");
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
