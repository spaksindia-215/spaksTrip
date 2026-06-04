import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { PartnerResourceModel, RESOURCE_TYPES, type ResourceType } from "../models/PartnerResource";
import { BookingModel } from "../models/Booking";
import { HotelListingModel } from "../models/partner/HotelListing";
import { TaxiListingModel } from "../models/partner/TaxiListing";
import {
  validateResourceCreate,
  validateResourceUpdate,
} from "../validators/partner.validators";
import { validateHotelListing } from "../validators/hotelListing.validators";
import { validateTaxiListing } from "../validators/taxiListing.validators";
import { hotelImageUrl } from "../middleware/upload";
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

// Parse a multipart text field that carries a JSON string. Missing → fallback.
function parseJsonField(req: Request, field: string, fallback: unknown): unknown {
  const raw = (req.body as Record<string, unknown>)?.[field];
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, `${field} must be valid JSON`);
  }
}

// POST /api/partner/hotels — multipart/form-data from the partner hotel form.
// Sections arrive as JSON strings; images as files (hotelImages + roomImages-<id>).
export async function createHotelListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);

    const hotel = parseJsonField(req, "hotel", {});
    const rooms = parseJsonField(req, "rooms", []);
    const rates = parseJsonField(req, "rates", []);
    const inventory = parseJsonField(req, "inventory", []);
    const pricing = parseJsonField(req, "pricing", {});
    const promotions = parseJsonField(req, "promotions", []);

    // Group uploaded files: `hotelImages` → property images; `roomImages-<id>`
    // → that room's images (keyed by the client-generated room id).
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const hotelImageUrls: string[] = [];
    const roomImageUrls: Record<string, string[]> = {};
    for (const f of files) {
      const url = hotelImageUrl(f.filename);
      if (f.fieldname === "hotelImages") {
        hotelImageUrls.push(url);
      } else if (f.fieldname.startsWith("roomImages-")) {
        const roomKey = f.fieldname.slice("roomImages-".length);
        (roomImageUrls[roomKey] ??= []).push(url);
      }
    }

    const input = validateHotelListing({
      hotel,
      rooms,
      rates,
      inventory,
      pricing,
      promotions,
      hotelImageUrls,
      roomImageUrls,
    });

    const doc = await HotelListingModel.create({ ...input, partner: partnerId });
    res.status(201).json({ item: doc.toJSON() });
  } catch (e) {
    next(e);
  }
}

// POST /api/partner/taxis — JSON body is the client list-your-taxi listing
// (flat shape); the validator adapts it into the MTI TaxiListing model.
export async function createTaxiListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const input = validateTaxiListing(req.body);
    const doc = await TaxiListingModel.create({ ...input, partner: partnerId });
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
