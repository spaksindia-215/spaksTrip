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

      {/* Cancellation Policies */}
      {preBook.cancelPolicies && preBook.cancelPolicies.length > 0 && (
        <section className="rounded-xl bg-white border border-border-soft p-4 shadow-(--shadow-xs)">
          <h3 className="text-[13px] font-bold text-ink mb-3">Cancellation Policy</h3>
          <div className="flex flex-col gap-2.5">
            {preBook.cancelPolicies.map((policy, i) => (
              <div
                key={i}
                className="flex justify-between items-start gap-3 pb-2.5 border-b border-border-soft last:pb-0 last:border-0"
              >
                <div>
                  <p className="text-[12px] font-semibold text-ink">Cancel until {policy.fromDate}</p>
                  <p className="text-[11px] text-ink-muted">{policy.chargeType}</p>
                </div>
                <p className="text-[12px] font-bold text-ink whitespace-nowrap">₹{policy.cancellationCharge.toLocaleString()}</p>
              </div>
            ))}
          </div>
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
    </div>
  );
}
