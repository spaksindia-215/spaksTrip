import { Schema, model, Types, HydratedDocument } from "mongoose";
import { ROLES, type Role } from "./User";

export const PRODUCT_TYPES = ["flight", "hotel", "taxi", "tour", "cruise", "package"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const BOOKING_STATUSES = ["active", "held", "cancelled", "completed"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface IBooking {
  ownerId: Types.ObjectId;
  ownerRole: Role;
  // Inventory owner (the partner whose listing was booked), when applicable.
  partnerId?: Types.ObjectId;
  productType: ProductType;
  status: BookingStatus;
  pnr?: string;
  amount: number;
  currency: string;
  holdExpiresAt?: Date;
  cancelRequestedAt?: Date;
  details: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    // Owner scoping — every query filters by ownerId for data isolation.
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerRole: { type: String, enum: ROLES, required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    productType: { type: String, enum: PRODUCT_TYPES, required: true },
    status: { type: String, enum: BOOKING_STATUSES, required: true, default: "active" },
    pnr: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", trim: true },
    holdExpiresAt: { type: Date },
    cancelRequestedAt: { type: Date },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

bookingSchema.index({ ownerId: 1, status: 1 });

bookingSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const out = ret as unknown as Record<string, unknown>;
    out.id = String(out._id);
    delete out._id;
    delete out.__v;
    return out;
  },
});

export type BookingDoc = HydratedDocument<IBooking>;
export const BookingModel = model<IBooking>("Booking", bookingSchema);
