"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BookingStepper from "@/components/flight/BookingStepper";
import ItinerarySummary from "@/components/flight/ItinerarySummary";
import PriceBreakdown from "@/components/flight/PriceBreakdown";
import Button from "@/components/ui/Button";
import Accordion from "@/components/ui/Accordion";
import { useBookingStore } from "@/state/bookingStore";
import { useToast } from "@/components/ui/Toast";
import { fetchFareQuote } from "@/services/flights";
import { useState } from "react";

export default function FlightReviewPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ReviewInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <BookingStepper active="review" />
      <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">
        Loading booking…
      </main>
      <Footer />
    </div>
  );
}

function ReviewInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { current, advanceStatus, setFareQuoteData } = useBookingStore();
  const toast = useToast();
  const [quoting, setQuoting] = useState(false);
  // After a price/time/detail change is surfaced, the user has seen the
  // updated details in PriceBreakdown. Track acknowledgement so the next
  // "Continue" click proceeds instead of looping — TBO keeps returning
  // isPriceChanged:true on every FareQuote until the booking is made.
  const [changeAcknowledged, setChangeAcknowledged] = useState(false);

  useEffect(() => {
    if (!current) {
      toast.push({ title: "Session expired", description: "Please re-select your flight", tone: "warn" });
      router.replace("/flight");
    }
  }, [current, router, toast]);

  if (!current) return null;

  const onContinue = async () => {
    setQuoting(true);
    try {
      // Call FareQuote to re-price the itinerary and capture IsGSTMandatory (§14),
      // FareBreakdown (needed for book/ticket fare nodes), and TraceId.
      // For LCC domestic return, OB+IB are priced in one call (Guideline §6).
      const quote = await fetchFareQuote(
        current.offer.id,
        current.fareQuoteTraceId,
        current.offer.returnResultIndex,
      );

      setFareQuoteData({
        isGSTMandatory: quote.isGSTMandatory,
        isLCC: quote.isLCC,
        fareBreakdown: quote.fareBreakdown,
        traceId: quote.traceId,
        updatedOffer: quote.updatedOffer,
        panRequiredAtBook: quote.isPanRequiredAtBook,
        panRequiredAtTicket: quote.isPanRequiredAtTicket,
        passportRequiredAtBook: quote.isPassportRequiredAtBook,
        passportRequiredAtTicket: quote.isPassportRequiredAtTicket,
        passportFullDetailRequiredAtBook: quote.isPassportFullDetailRequiredAtBook,
        mealMandatory: quote.isMealMandatory,
        seatMandatory: quote.isSeatMandatory,
        flightDetailChangeInfo: quote.flightDetailChangeInfo,
        airlineCode: quote.airlineCode,
        originCode: quote.origin,
        destinationCode: quote.destination,
      });

      // Flight Information Change (§): surface baggage/time changes once.
      // On the second click (changeAcknowledged) fall through and proceed —
      // the updated info is already in the store from setFareQuoteData above.
      if (quote.flightDetailChangeInfo && !changeAcknowledged) {
        toast.push({
          title: "Flight details changed",
          description: `Updated ${quote.flightDetailChangeInfo}. Review the summary below, then click Continue again to proceed.`,
          tone: "warn",
        });
        setChangeAcknowledged(true);
        setQuoting(false);
        return;
      }

      // TBO keeps returning isPriceChanged:true on every FareQuote until
      // booking. Show the updated price once; on the second click proceed.
      if ((quote.isPriceChanged || quote.isTimeChanged) && !changeAcknowledged) {
        toast.push({
          title: quote.isTimeChanged && !quote.isPriceChanged ? "Schedule updated" : "Fare updated",
          description: quote.isPriceChanged
            ? `The price changed to ₹${(quote.totalFare ?? quote.updatedOffer?.basePrice ?? 0).toLocaleString("en-IN")}. Review the summary below, then click Continue again to proceed.`
            : "The flight time changed. Review the summary below, then click Continue again to proceed.",
          tone: "warn",
        });
        setChangeAcknowledged(true);
        setQuoting(false);
        return;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not refresh fare. Please try again.";
      toast.push({ title: "Fare check failed", description: msg, tone: "warn" });
      setQuoting(false);
      return;
    }
    setQuoting(false);
    advanceStatus("TRAVELER");
    router.push(`/flight/${encodeURIComponent(current.offer.id)}/traveler?${sp.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <BookingStepper active="review" />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[22px] font-extrabold text-ink">Review your itinerary</h1>
              <p className="text-[13px] text-ink-muted">Selected fare: {current.fareFamily.name}</p>
            </div>
            <Link href={`/flight/results?${sp.toString()}`} className="text-[13px] font-semibold text-brand-700 hover:underline">
              ← Back to results
            </Link>
          </div>

          <div className="grid md:grid-cols-[1fr_340px] gap-5">
            <div className="flex flex-col gap-4">
              <ItinerarySummary offer={current.offer} />
              <FareRules booking={current} />
              <BaggageInfo booking={current} />
            </div>
            <aside className="flex flex-col gap-4">
              <PriceBreakdown booking={current} />
              <Button variant="accent" size="lg" onClick={onContinue} loading={quoting} fullWidth>
                {quoting ? "Checking fare…" : changeAcknowledged ? "Accept & continue to travellers" : "Continue to travellers"}
              </Button>
              <div className="rounded-xl bg-success-50 text-success-700 text-[12px] font-medium px-4 py-3 flex items-start gap-2">
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2C20 17.5 12 22 12 22z" />
                </svg>
                <span>
                  Secure payment. All prices include taxes and airline fees. Your fare is locked until payment completes.
                </span>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FareRules({ booking }: { booking: ReturnType<typeof useBookingStore.getState>["current"] }) {
  if (!booking) return null;
  const { fareFamily } = booking;
  return (
    <div className="rounded-xl bg-white border border-border-soft p-5 shadow-[var(--shadow-xs)]">
      <h2 className="text-[15px] font-bold text-ink mb-2">Fare rules</h2>
      <Accordion
        defaultOpen={["cancellation"]}
        items={[
          {
            value: "cancellation",
            title: "Cancellation",
            content: (
              <p>
                {fareFamily.refundable
                  ? "Refundable fare. Cancellation fee applies as per airline policy (₹3,000 – ₹4,500 per passenger)."
                  : "This is a non-refundable fare. Only statutory taxes will be refunded upon cancellation."}
              </p>
            ),
          },
          {
            value: "change",
            title: "Date change",
            content: (
              <p>
                {fareFamily.changeable
                  ? "Date changes are permitted. Change fee + fare difference applies."
                  : "Date changes are not permitted on this fare."}
              </p>
            ),
          },
          {
            value: "no-show",
            title: "No-show",
            content: <p>A no-show will forfeit the entire base fare. Only statutory taxes may be refunded.</p>,
          },
          {
            value: "visa",
            title: "Visa & travel documents",
            content: <p>Passengers are responsible for all travel documents and visa requirements.</p>,
          },
        ]}
      />
    </div>
  );
}

function BaggageInfo({ booking }: { booking: ReturnType<typeof useBookingStore.getState>["current"] }) {
  if (!booking) return null;
  const { offer } = booking;
  return (
    <div className="rounded-xl bg-white border border-border-soft p-5 shadow-[var(--shadow-xs)]">
      <h2 className="text-[15px] font-bold text-ink mb-3">Baggage allowance</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <BagBox
          label="Cabin baggage"
          value={`${offer.baggage.cabin} kg`}
          sub="1 hand piece + 1 personal item"
        />
        <BagBox
          label="Check-in baggage"
          value={`${offer.baggage.checkin} kg`}
          sub="Included in fare"
        />
      </div>
    </div>
  );
}

function BagBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg bg-surface-muted p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="text-[18px] font-extrabold text-ink">{value}</div>
      <div className="text-[11px] text-ink-muted">{sub}</div>
    </div>
  );
}
