"use client";

import type { HotelPreBookInfo } from "@/state/hotelBookingStore";
import Badge from "@/components/ui/Badge";

type Props = {
  preBook: HotelPreBookInfo;
  priceChanged?: {
    originalPrice: number;
    newPrice: number;
    changePercent: number;
  };
};

export default function PreBookDetailsSection({ preBook, priceChanged }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Price change notice */}
      {priceChanged && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-[13px] font-semibold text-amber-900 mb-2">Price Updated</p>
          <p className="text-[12px] text-amber-800 leading-relaxed">
            The hotel price has changed since you selected it.
            <br />
            Original: ₹{priceChanged.originalPrice.toLocaleString()} →{" "}
            <strong>New: ₹{priceChanged.newPrice.toLocaleString()}</strong>
            {" "}
            ({priceChanged.changePercent > 0 ? "+" : ""}
            {priceChanged.changePercent.toFixed(1)}%)
          </p>
        </div>
      )}

      {/* Inclusions */}
      {preBook.inclusion && (
        <section className="rounded-xl bg-white border border-border-soft p-4 shadow-(--shadow-xs)">
          <h3 className="text-[13px] font-bold text-ink mb-2">What's Included</h3>
          <p className="text-[12px] text-ink-soft leading-relaxed">{preBook.inclusion}</p>
        </section>
      )}

      {/* Rate Conditions */}
      {preBook.rateConditions && preBook.rateConditions.length > 0 && (
        <section className="rounded-xl bg-white border border-border-soft p-4 shadow-(--shadow-xs)">
          <h3 className="text-[13px] font-bold text-ink mb-3">Rate Conditions</h3>
          <ul className="flex flex-col gap-2">
            {preBook.rateConditions.map((condition, i) => (
              <li key={i} className="text-[12px] text-ink-soft flex gap-2">
                <span className="text-brand-600 font-bold">•</span>
                <span>{condition}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Room Promotions */}
      {preBook.roomPromotion && preBook.roomPromotion.length > 0 && (
        <section className="rounded-xl bg-white border border-border-soft p-4 shadow-(--shadow-xs)">
          <h3 className="text-[13px] font-bold text-ink mb-3">Promotions</h3>
          <div className="flex flex-wrap gap-2">
            {preBook.roomPromotion.map((promo, i) => (
              <Badge key={i} tone="success" size="sm">
                {promo}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Mandatory Supplements */}
      {preBook.supplements && preBook.supplements.length > 0 && (
        <section className="rounded-xl bg-orange-50 border border-orange-200 p-4 shadow-(--shadow-xs)">
          <h3 className="text-[13px] font-bold text-orange-900 mb-3">Mandatory Charges at Hotel</h3>
          <div className="flex flex-col gap-2.5 mb-3">
            {preBook.supplements.map((supplement, i) => (
              <div
                key={i}
                className="flex justify-between items-start gap-3 pb-2.5 border-b border-orange-200 last:pb-0 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-orange-900">{supplement.description}</p>
                  <p className="text-[11px] text-orange-800">{supplement.type}</p>
                </div>
                <p className="text-[12px] font-bold text-orange-900 whitespace-nowrap">
                  {supplement.currency} {supplement.price != null ? supplement.price.toLocaleString() : "—"}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-orange-800 leading-relaxed italic border-t border-orange-200 pt-2">
            ⚠ These charges are collected directly at the hotel during check-in. Currency shown may differ from your booking currency.
          </p>
        </section>
      )}

      {/* Cancellation Policies & Hold/Voucher Deadlines - FINAL from PreBook */}
      {preBook.cancelPolicies && preBook.cancelPolicies.length > 0 && (
        <section className="rounded-xl bg-blue-50 border border-blue-200 p-4 shadow-(--shadow-xs)">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-[13px] font-bold text-blue-900">Cancellation Policy & Hold Deadlines (Final)</h3>
            <span className="rounded bg-blue-600 text-white text-[10px] font-bold px-2 py-1 shrink-0">PRE-BOOK</span>
          </div>
          <div className="flex flex-col gap-2.5 mb-4">
            {preBook.cancelPolicies.map((policy, i) => (
              <div
                key={i}
                className="flex justify-between items-start gap-3 pb-2.5 border-b border-blue-200 last:pb-0 last:border-0"
              >
                <div>
                  <p className="text-[12px] font-semibold text-blue-900">Cancel until {policy.fromDate}</p>
                  <p className="text-[11px] text-blue-800">{policy.chargeType}</p>
                </div>
                <p className="text-[12px] font-bold text-blue-900 whitespace-nowrap">₹{policy.cancellationCharge.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded px-3 py-2.5 border border-blue-100 mb-3">
            <p className="text-[11px] text-blue-900 font-semibold">⏰ Hold Booking Deadline</p>
            <p className="text-[12px] text-blue-800 mt-1">
              If you choose to hold this booking, you must generate the voucher before <span className="font-bold">{preBook.cancelPolicies[0]?.fromDate}</span>
            </p>
          </div>
          <p className="text-[11px] text-blue-800 leading-relaxed italic border-t border-blue-200 pt-2">
            These are the final cancellation policies locked by TBO during PreBook. If you hold the booking, ensure you generate the voucher before the deadline to avoid losing the booking. TBO will not take liability if you miss the voucher deadline.
          </p>
        </section>
      )}

      {/* Document Requirements */}
      {(preBook.panMandatory || preBook.passportMandatory) && (
        <section className="rounded-xl bg-blue-50 border border-blue-200 p-4 shadow-(--shadow-xs)">
          <h3 className="text-[13px] font-bold text-blue-900 mb-2">Required Documents</h3>
          <ul className="flex flex-col gap-1.5">
            {preBook.panMandatory && (
              <li className="text-[12px] text-blue-800 flex items-center gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                PAN (Permanent Account Number) required for all guests
              </li>
            )}
            {preBook.passportMandatory && (
              <li className="text-[12px] text-blue-800 flex items-center gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                Passport number required for all guests
              </li>
            )}
          </ul>
        </section>
      )}

      {/* TBO Liability Disclaimers */}
      {(preBook.inclusion || preBook.rateConditions?.length || preBook.roomPromotion?.length || preBook.supplements?.length || preBook.panMandatory || preBook.passportMandatory) && (
        <section className="rounded-xl bg-red-50 border border-red-200 p-4 shadow-(--shadow-xs)">
          <h3 className="text-[13px] font-bold text-red-900 mb-3">⚠ Important Disclaimers</h3>
          <div className="flex flex-col gap-2.5 text-[11px] text-red-800 leading-relaxed">
            {(preBook.inclusion || preBook.rateConditions?.length || preBook.roomPromotion?.length || preBook.supplements?.length) && (
              <p>
                The information about Inclusions, Rate Conditions, Room Promotions, and Mandatory Supplements has been clearly displayed above.
                TBO will not take any liability for any loss that may arise if this information was not clearly understood or if it was missed before completing the booking.
              </p>
            )}
            {(preBook.panMandatory || preBook.passportMandatory) && (
              <p>
                <span className="font-semibold">PAN/Passport Validation:</span> The identity document requirements (PAN/Passport) shown above are mandatory per TBO Hotel API specifications.
                TBO will not take any liability for any financial loss if mandatory documents are not provided or if incorrect/invalid documents are submitted during booking.
                Ensure all required documents are valid before completing your booking.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
