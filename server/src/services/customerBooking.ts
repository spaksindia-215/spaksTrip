import mongoose from "mongoose";
import { BookingModel, type ProductType } from "../models/Booking";
import type { Role } from "../models/User";
import type { AnyBookingDetails } from "../models/bookingDetails";

// Persists a Booking owned by the END CUSTOMER so the trip shows up on their
// customer dashboard (GET /api/customer/bookings filters by ownerId). This is the
// counterpart to recordSubdomainBooking — that one stamps the AGENT as owner for
// settlement; this one stamps the logged-in customer for their own trip history.
//
// Fire-and-forget by contract: the TBO booking is already confirmed by the time
// this runs, so a failure here must never bubble up and fail the booking response.
// Errors are swallowed and logged.

export interface RecordCustomerBookingInput {
  ownerId: string;
  ownerRole: Role;
  productType: ProductType;
  pnr?: string;
  amount: number;
  currency?: string;
  details?: AnyBookingDetails;
}

export async function recordCustomerBooking(input: RecordCustomerBookingInput): Promise<void> {
  try {
    const { ownerId, ownerRole, productType, pnr, amount, currency, details } = input;

    if (!mongoose.isValidObjectId(ownerId)) return;
    if (typeof amount !== "number" || amount <= 0) return;

    await BookingModel.create({
      ownerId: new mongoose.Types.ObjectId(ownerId),
      ownerRole,
      productType,
      status: "active",
      pnr,
      amount,
      currency: currency ?? "INR",
      customerPaid: amount,
      details: details ?? {},
    });
  } catch (e) {
    console.error("[customer-booking] recording failed:", e instanceof Error ? e.message : String(e));
  }
}
