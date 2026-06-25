"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useAuthStore } from "@/state/authStore";
import { formatINR } from "@/lib/format";
import { eventsService, type EventBooking, type EventDetail } from "@/services/events";

// ── Razorpay browser types (checkout.js) ──────────────────────────────────────
interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler(response: RazorpaySuccess): void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
}
type RazorpayCtor = new (options: RazorpayOptions) => { open(): void };

// Read the checkout.js global without redeclaring Window.Razorpay (the flight /
// hotel payment pages already declare it; a second global decl would conflict).
function getRazorpay(): RazorpayCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
}

function fmtDateTime(iso?: string, time?: string): string {
  if (!iso) return "Date to be announced";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date to be announced";
  const date = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return time ? `${date} · ${time}` : date;
}

export default function EventDetailView({ slug }: { slug: string }) {
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [qty, setQty] = useState<Record<string, number>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await eventsService.get(slug);
        if (alive) setEvent(res.item);
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const setQuantity = (ticketId: string, value: number, max: number) => {
    setQty((prev) => ({ ...prev, [ticketId]: Math.max(0, Math.min(value, max)) }));
  };

  const selection = useMemo(() => {
    if (!event) return { lines: [] as { ticketTypeId: string; quantity: number }[], subtotal: 0 };
    const lines: { ticketTypeId: string; quantity: number }[] = [];
    let subtotal = 0;
    for (const t of event.tickets) {
      const q = qty[t._id] ?? 0;
      if (q > 0) {
        lines.push({ ticketTypeId: t._id, quantity: q });
        subtotal += t.price * q;
      }
    }
    return { lines, subtotal };
  }, [event, qty]);

  const handleBook = useCallback(async () => {
    if (!event || selection.lines.length === 0) return;
    setWorking(true);
    setMsg(null);
    try {
      const res = await eventsService.book(slug, { tickets: selection.lines });
      if (res.free) {
        setBooking(res.booking);
        return;
      }
      if (!res.payment) {
        setMsg("Could not start payment. Please try again.");
        return;
      }
      const RazorpayCtor = getRazorpay();
      if (!RazorpayCtor) {
        setMsg("Payment is still loading — please try again in a moment.");
        return;
      }
      const rzp = new RazorpayCtor({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        order_id: res.payment.orderId,
        amount: res.payment.amount,
        currency: res.payment.currency,
        name: "SpaksTrip Events",
        description: event.title,
        theme: { color: "#0E1E3A" },
        modal: {
          ondismiss: () => {
            setWorking(false);
            setMsg("Payment cancelled. Your tickets are held briefly — you can try again.");
          },
        },
        handler: (response) => {
          void (async () => {
            try {
              const verified = await eventsService.verifyPayment({
                bookingReference: res.booking.bookingReference,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setBooking(verified.booking);
            } catch {
              setMsg("Payment received but confirmation failed. Please check My Bookings or contact support.");
            } finally {
              setWorking(false);
            }
          })();
        },
      });
      // Paid path: keep `working` true while the Razorpay modal is open; the
      // handler/ondismiss callbacks reset it.
      rzp.open();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Booking failed. Please try again.");
      setWorking(false);
    }
  }, [event, slug, selection]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#0E1E3A]">Event not found</h1>
        <p className="mt-2 text-gray-500">This event may have ended or been unpublished.</p>
        <Link href="/events" className="mt-6 inline-block rounded-full bg-[#0E1E3A] px-5 py-2.5 text-sm font-semibold text-white">
          Browse all events
        </Link>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (booking) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-green-100 bg-green-50 p-8">
          <h1 className="text-2xl font-bold text-green-800">Booking confirmed 🎉</h1>
          <p className="mt-2 text-sm text-green-700">
            Reference <span className="font-mono font-semibold">{booking.bookingReference}</span> for{" "}
            <span className="font-semibold">{event.title}</span>.
          </p>
          {booking.qrCode && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={booking.qrCode} alt="Entry QR code" className="mx-auto mt-6 h-44 w-44 rounded-xl border bg-white p-2" />
          )}
          <p className="mt-4 text-sm text-gray-600">Show this QR code at entry. We've emailed your confirmation too.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/account" className="rounded-full bg-[#0E1E3A] px-5 py-2.5 text-sm font-semibold text-white">
              My Bookings
            </Link>
            <Link href="/events" className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#0E1E3A]">
              More events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = event.images.length > 0 ? event.images : [{ url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80" }];
  const venueLine = [event.venue?.name, event.venue?.address, event.venue?.city].filter(Boolean).join(", ");
  const canBook = user?.role === "customer";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/events" className="text-sm font-semibold text-[#C5A572]">
          ← Back to events
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: gallery + info */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[activeImage]?.url} alt={event.title} className="h-80 w-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.url + i}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImage ? "border-[#C5A572]" : "border-transparent"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <h1 className="mt-6 text-3xl font-bold text-[#0E1E3A]">{event.title}</h1>
            <p className="mt-2 text-[#C5A572]">{fmtDateTime(event.startDate, event.startTime)}</p>
            {venueLine && <p className="mt-1 text-gray-600">📍 {venueLine}</p>}

            <div className="mt-6 whitespace-pre-line leading-relaxed text-gray-700">{event.description}</div>

            <div className="mt-8 rounded-2xl bg-[#F4F6F9] p-5 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Organizer:</span> {event.organizer.name}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Cancellation:</span> {event.cancellationPolicy.replace(/_/g, " ")}
              </p>
              {event.ageRestriction?.hasRestriction && event.ageRestriction.minimumAge ? (
                <p className="mt-1">
                  <span className="font-semibold">Age:</span> {event.ageRestriction.minimumAge}+ only
                </p>
              ) : null}
              {event.termsAndConditions && <p className="mt-3 text-xs text-gray-500">{event.termsAndConditions}</p>}
            </div>
          </div>

          {/* Right: ticket selector */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#0E1E3A]">Tickets</h2>

              {event.isSoldOut ? (
                <p className="mt-4 rounded-xl bg-red-50 p-4 text-center text-sm font-semibold text-red-700">Sold out</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {event.tickets.filter((t) => t.isActive).map((t) => {
                    const remaining = t.availableQuantity;
                    const cap = Math.min(t.maxPerOrder, remaining);
                    const q = qty[t._id] ?? 0;
                    return (
                      <div key={t._id} className="rounded-xl border border-gray-100 p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-[#0E1E3A]">{t.name}</p>
                            {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                            <p className="mt-1 text-sm font-bold text-[#0E1E3A]">{t.price === 0 ? "Free" : formatINR(t.price)}</p>
                          </div>
                          {remaining <= 0 ? (
                            <span className="text-xs font-semibold text-red-600">Sold out</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setQuantity(t._id, q - 1, cap)}
                                disabled={q <= 0}
                                className="h-7 w-7 rounded-full border border-gray-200 text-[#0E1E3A] disabled:opacity-40"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-sm font-semibold">{q}</span>
                              <button
                                onClick={() => setQuantity(t._id, q + 1, cap)}
                                disabled={q >= cap}
                                className="h-7 w-7 rounded-full border border-gray-200 text-[#0E1E3A] disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                        {remaining > 0 && remaining <= 10 && (
                          <p className="mt-1 text-xs text-amber-600">Only {remaining} left</p>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-sm text-gray-500">Subtotal</span>
                    <span className="text-lg font-bold text-[#0E1E3A]">{formatINR(selection.subtotal)}</span>
                  </div>
                  <p className="text-xs text-gray-400">A platform fee + GST applies at checkout.</p>

                  {msg && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">{msg}</p>}

                  {canBook ? (
                    <button
                      onClick={handleBook}
                      disabled={selection.lines.length === 0 || working}
                      className="w-full rounded-xl bg-[#0E1E3A] py-3 text-sm font-semibold text-white transition hover:bg-[#0E1E3A]/90 disabled:opacity-50"
                    >
                      {working ? "Processing…" : selection.subtotal === 0 && selection.lines.length > 0 ? "Get free tickets" : "Book now"}
                    </button>
                  ) : (
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/events/${slug}`)}`}
                      className="block w-full rounded-xl bg-[#0E1E3A] py-3 text-center text-sm font-semibold text-white"
                    >
                      Log in to book
                    </Link>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
