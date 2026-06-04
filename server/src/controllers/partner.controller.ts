import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { PartnerResourceModel, RESOURCE_TYPES, type ResourceType } from "../models/PartnerResource";
import { BookingModel } from "../models/Booking";
import { HotelListingModel } from "../models/partner/HotelListing";
import { TaxiListingModel } from "../models/partner/TaxiListing";
import { TaxiPackageModel } from "../models/partner/TaxiPackage";
import { TourListingModel } from "../models/partner/TourListing";
import {
  validateResourceCreate,
  validateResourceUpdate,
} from "../validators/partner.validators";
import { validateHotelListing } from "../validators/hotelListing.validators";
import {
  validateTaxiListing,
  validateTaxiListingUpdate,
  parseSlotStrings,
  type TaxiMedia,
} from "../validators/taxiListing.validators";
import { validateTaxiPackage } from "../validators/taxiPackage.validators";
import { validateTourListing } from "../validators/tourListing.validators";
import { uploadToCloudinary, uploadManyToCloudinary } from "../lib/cloudinary";
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

    // Upload to Cloudinary: `hotelImages` → property images; `roomImages-<id>`
    // → that room's images (keyed by the client-generated room id). Property
    // images keep submission order so the first becomes the primary image.
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const hotelImageUrls = await uploadManyToCloudinary(
      files.filter((f) => f.fieldname === "hotelImages"),
      "spakstrip/hotels",
    );
    const roomImageUrls: Record<string, string[]> = {};
    for (const f of files.filter((f) => f.fieldname.startsWith("roomImages-"))) {
      const url = await uploadToCloudinary(f, "spakstrip/hotels/rooms");
      const roomKey = f.fieldname.slice("roomImages-".length);
      (roomImageUrls[roomKey] ??= []).push(url);
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

// POST /api/partner/taxis — multipart: `payload` is the flat list-your-taxi
// listing (JSON string); files are vehiclePhotos[] + doc fields (rcBook,
// insurance, pollutionCertificate, drivingLicense). Uploaded to Cloudinary and
// adapted into the MTI TaxiListing model.
export async function createTaxiListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const payload = parseJsonField(req, "payload", req.body);

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const byField = (name: string) => files.find((f) => f.fieldname === name);

    const vehicleImageUrls = await uploadManyToCloudinary(
      files.filter((f) => f.fieldname === "vehiclePhotos"),
      "spakstrip/taxis",
    );
    const uploadDoc = async (name: string): Promise<string | undefined> => {
      const f = byField(name);
      return f ? uploadToCloudinary(f, "spakstrip/taxis/docs") : undefined;
    };
    const media: TaxiMedia = {
      vehicleImageUrls,
      docs: {
        vehicleRC: await uploadDoc("rcBook"),
        insurance: await uploadDoc("insurance"),
        pollutionCertificate: await uploadDoc("pollutionCertificate"),
        drivingLicense: await uploadDoc("drivingLicense"),
      },
    };

    const input = validateTaxiListing(payload, media);
    const doc = await TaxiListingModel.create({ ...input, partner: partnerId });
    res.status(201).json({ item: doc.toJSON() });
  } catch (e) {
    next(e);
  }
}

// GET /api/partner/taxis — this partner's taxi listings, newest first.
export async function listTaxiListings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const items = await TaxiListingModel.find({ partner: partnerId }).sort({ createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/partner/taxis/:id — apply the dashboard editor's flat fields onto
// the MTI document (single service at index 0) and the availability status.
export async function updateTaxiListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const id = paramId(req);
    const patch = validateTaxiListingUpdate(req.body);

    const doc = await TaxiListingModel.findOne({ _id: id, partner: partnerId });
    if (!doc) throw new HttpError(404, "Taxi listing not found");

    const service = doc.services[0];
    if (patch.operatingCity !== undefined && service) service.coverage.baseCity = patch.operatingCity;
    if (patch.minimumFare !== undefined && service) service.pricing.baseFare = patch.minimumFare;
    if (patch.pricePerKm !== undefined && service) service.pricing.pricePerKm = patch.pricePerKm;
    if (patch.serviceAreas !== undefined && service) service.coverage.servicedCities = patch.serviceAreas;
    if (patch.availableRoutes !== undefined) doc.routes = patch.availableRoutes;
    if (patch.description !== undefined) doc.description = patch.description;
    if (patch.availableDays !== undefined) doc.operatingDays = patch.availableDays;
    if (patch.availableTimeSlots !== undefined) {
      const slots = parseSlotStrings(patch.availableTimeSlots);
      doc.operationalHours.slots = slots;
      doc.operationalHours.available24x7 = slots.length === 0;
    }
    if (patch.amenities !== undefined) doc.vehicle.amenities = patch.amenities;
    if (patch.availabilityEnabled !== undefined) {
      doc.status = patch.availabilityEnabled ? "active" : "paused";
    }

    await doc.save();
    res.json({ item: doc.toJSON() });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/partner/taxis/:id
export async function deleteTaxiListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const id = paramId(req);
    const result = await TaxiListingModel.findOneAndDelete({ _id: id, partner: partnerId });
    if (!result) throw new HttpError(404, "Taxi listing not found");
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

// ── Taxi Packages ────────────────────────────────────────────────────────────

// Resolve an optional vehicle ref to one of this partner's TaxiListings and
// build the denormalized snapshot. Returns {} when no vehicle is linked.
async function resolveTaxiPackageVehicle(
  partnerId: string,
  vehicleId: string | undefined,
): Promise<{ vehicle?: mongoose.Types.ObjectId; vehicleSnapshot?: Record<string, unknown> }> {
  if (!vehicleId) return {};
  if (!mongoose.isValidObjectId(vehicleId)) throw new HttpError(400, "Invalid vehicle id");
  const taxi = await TaxiListingModel.findOne({ _id: vehicleId, partner: partnerId });
  if (!taxi) throw new HttpError(400, "vehicle must be one of your taxi listings");
  return {
    vehicle: taxi._id,
    vehicleSnapshot: {
      make: taxi.vehicle.make,
      model: taxi.vehicle.model,
      type: taxi.vehicle.type,
      seatingCap: taxi.vehicle.seatingCap,
      images: taxi.vehicle.images.map((i) => i.url),
    },
  };
}

// Upload taxi-package media: a single `thumbnail` + many `images`.
async function uploadTaxiPackageMedia(
  files: Express.Multer.File[],
): Promise<{ thumbnail?: string; imageUrls: string[] }> {
  const thumbFile = files.find((f) => f.fieldname === "thumbnail");
  const thumbnail = thumbFile
    ? await uploadToCloudinary(thumbFile, "spakstrip/taxi-packages")
    : undefined;
  const imageUrls = await uploadManyToCloudinary(
    files.filter((f) => f.fieldname === "images"),
    "spakstrip/taxi-packages",
  );
  return { thumbnail, imageUrls };
}

// POST /api/partner/taxi-packages — multipart: `payload` JSON + thumbnail + images.
export async function createTaxiPackage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const payload = parseJsonField(req, "payload", req.body);
    const { fields, vehicleId } = validateTaxiPackage(payload);

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const { thumbnail, imageUrls } = await uploadTaxiPackageMedia(files);
    const { vehicle, vehicleSnapshot } = await resolveTaxiPackageVehicle(partnerId, vehicleId);

    const doc = await TaxiPackageModel.create({
      ...fields,
      partner: partnerId,
      thumbnail,
      images: imageUrls.map((url, i) => ({ url, isPrimary: i === 0 })),
      vehicle,
      vehicleSnapshot,
    });
    res.status(201).json({ item: doc.toJSON() });
  } catch (e) {
    next(e);
  }
}

// GET /api/partner/taxi-packages
export async function listTaxiPackages(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const items = await TaxiPackageModel.find({ partner: partnerId }).sort({ createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/partner/taxi-packages/:id — multipart; the edit form resends the
// full structured payload. New thumbnail/images replace existing ones only when
// files are provided (otherwise the current media is kept).
export async function updateTaxiPackage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const id = paramId(req);
    const payload = parseJsonField(req, "payload", req.body);
    const { fields, vehicleId } = validateTaxiPackage(payload);

    const doc = await TaxiPackageModel.findOne({ _id: id, partner: partnerId });
    if (!doc) throw new HttpError(404, "Taxi package not found");

    doc.set(fields);

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const { thumbnail, imageUrls } = await uploadTaxiPackageMedia(files);
    if (thumbnail) doc.thumbnail = thumbnail;
    if (imageUrls.length > 0) doc.images = imageUrls.map((url, i) => ({ url, isPrimary: i === 0 }));

    if (vehicleId !== undefined) {
      const { vehicle, vehicleSnapshot } = await resolveTaxiPackageVehicle(partnerId, vehicleId);
      doc.vehicle = vehicle;
      doc.vehicleSnapshot = vehicleSnapshot as typeof doc.vehicleSnapshot;
    }

    await doc.save();
    res.json({ item: doc.toJSON() });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/partner/taxi-packages/:id
export async function deleteTaxiPackage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const id = paramId(req);
    const result = await TaxiPackageModel.findOneAndDelete({ _id: id, partner: partnerId });
    if (!result) throw new HttpError(404, "Taxi package not found");
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

// ── Tours ────────────────────────────────────────────────────────────────────

// POST /api/partner/tours — multipart: `payload` JSON + `images`.
export async function createTourListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const payload = parseJsonField(req, "payload", req.body);
    const fields = validateTourListing(payload);

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const imageUrls = await uploadManyToCloudinary(
      files.filter((f) => f.fieldname === "images"),
      "spakstrip/tours",
    );

    const doc = await TourListingModel.create({
      ...fields,
      partner: partnerId,
      images: imageUrls.map((url, i) => ({ url, isPrimary: i === 0 })),
    });
    res.status(201).json({ item: doc.toJSON() });
  } catch (e) {
    next(e);
  }
}

// GET /api/partner/tours
export async function listTourListings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const items = await TourListingModel.find({ partner: partnerId }).sort({ createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/partner/tours/:id — multipart; the edit form resends the full
// payload. New `images` replace existing ones only when files are provided.
export async function updateTourListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const id = paramId(req);
    const payload = parseJsonField(req, "payload", req.body);
    const fields = validateTourListing(payload);

    const doc = await TourListingModel.findOne({ _id: id, partner: partnerId });
    if (!doc) throw new HttpError(404, "Tour not found");

    doc.set(fields);

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const imageUrls = await uploadManyToCloudinary(
      files.filter((f) => f.fieldname === "images"),
      "spakstrip/tours",
    );
    if (imageUrls.length > 0) doc.images = imageUrls.map((url, i) => ({ url, isPrimary: i === 0 }));

    await doc.save();
    res.json({ item: doc.toJSON() });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/partner/tours/:id
export async function deleteTourListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const partnerId = partnerIdFrom(req);
    const id = paramId(req);
    const result = await TourListingModel.findOneAndDelete({ _id: id, partner: partnerId });
    if (!result) throw new HttpError(404, "Tour not found");
    res.status(204).end();
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
