"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import HotelBookingStepper from "@/components/accommodation/HotelBookingStepper";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Radio from "@/components/ui/Radio";
import { formatINR } from "@/lib/format";
import { useHotelBookingStore } from "@/state/hotelBookingStore";
import { useToast } from "@/components/ui/Toast";
import { useBook } from "@/hooks/useBook";

type Method = "card" | "upi" | "netbanking" | "wallet";

export default function HotelPaymentPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <PaymentInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <HotelBookingStepper active="payment" />
      <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">Loading…</main>
      <Footer />
    </div>
  );
}

function PaymentInner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { current, confirm } = useHotelBookingStore();
  const { loading, error, makeBooking } = useBook();

  const [method, setMethod] = useState<Method>("upi");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [upi, setUpi] = useState("");
  const [netBank, setNetBank] = useState("HDFC");
  const [wallet, setWallet] = useState("Paytm");

  useEffect(() => {
    if (!current) router.replace("/hotel");
  }, [current, router]);

  if (!current) return null;

  const validate = (): string | null => {
    if (current.guestNationality !== "IN") {
      return "Only Indian nationals (IN) can book through SpaksTrip per TBO India requirements";
    }
    if (!current.preBook?.bookingCode) {
      return "Booking data missing. Please try again.";
    }
    if (method === "card") {
      if (cardNumber.replace(/\s/g, "").length < 14) return "Enter a valid card number";
      if (!cardName.trim()) return "Name on card is required";
      if (!/^(\d{2})\/(\d{2})$/.test(exp)) return "Expiry must be MM/YY";
      if (!/^\d{3,4}$/.test(cvv)) return "CVV must be 3 or 4 digits";
    }
    if (method === "upi" && !/^[\w.-]+@[\w]+$/.test(upi)) return "Enter a valid UPI ID";
    return null;
  };

  const onPay = async () => {
    const err = validate();
    if (err) { toast.push({ title: err, tone: "warn" }); return; }

    const result = await makeBooking({
      bookingCode: current.preBook!.bookingCode,
      netAmount: current.preBook!.netAmount,
      isVoucherBooking: false,
      guests: current.guests,
      guestNationality: current.guestNationality,
      clientReferenceId: current.id,
    });

    if (!result) {
      toast.push({ title: error || "Booking failed. Please try again.", tone: "warn" });
      return;
    }

    confirm(result.bookingRefNo || result.bookingId?.toString() || current.id);
    toast.push({
      title: "Booking confirmed!",
      description: `Ref: ${result.bookingRefNo || result.bookingId}`,
      tone: "success",
    });
    router.push(`/hotel/${encodeURIComponent(id)}/confirmation?${sp.toString()}`);
  };

  const METHODS: Array<{ v: Method; label: string }> = [
    { v: "upi", label: "UPI" },
    { v: "card", label: "Credit / Debit card" },
    { v: "netbanking", label: "Net banking" },
    { v: "wallet", label: "Wallet" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <HotelBookingStepper active="payment" />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6">
          <div className="grid md:grid-cols-[1fr_340px] gap-5">
            <div className="flex flex-col gap-4">
              {/* Hotel summary */}
              <div className="rounded-xl bg-white border border-border-soft p-4 shadow-(--shadow-xs) flex gap-4">
                <img
                  src={current.hotel.images[0]}
                  alt={current.hotel.name}
                  className="h-20 w-28 shrink-0 rounded-lg object-cover"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-[15px] font-bold text-ink truncate">{current.hotel.name}</p>
                  <p className="text-[12px] text-ink-muted">{current.room.name}</p>
                  <p className="text-[12px] text-ink-muted">
                    {current.checkIn} → {current.checkOut} · {current.nights} night{current.nights !== 1 ? "s" : ""} · {current.rooms} room{current.rooms !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Payment methods */}
              <section className="rounded-xl bg-white border border-border-soft shadow-(--shadow-xs) overflow-hidden">
                <div className="px-5 py-4 border-b border-border-soft">
                  <h2 className="text-[16px] font-bold text-ink">Payment</h2>
                  <p className="text-[12px] text-ink-muted">All payments are 256-bit SSL encrypted.</p>
                </div>
                <div className="grid md:grid-cols-[200px_1fr]">
                  <div className="bg-surface-muted p-3 md:p-4 flex md:flex-col gap-2 overflow-x-auto">
                    {METHODS.map((m) => (
                      <button
                        key={m.v}
                        type="button"
                        onClick={() => setMethod(m.v)}
                        className={
                          "flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold whitespace-nowrap transition-colors " +
                          (m.v === method ? "bg-white text-brand-700 shadow-(--shadow-xs)" : "text-ink-soft hover:bg-white/60")
                        }
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-5">
                    {method === "card" && (
                      <div className="flex flex-col gap-3">
                        <Input label="Card number" placeholder="1234 5678 9012 3456" value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))} />
                        <Input label="Name on card" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="As printed" />
                        <div className="grid grid-cols-2 gap-3">
                          <Input label="Expiry (MM/YY)" value={exp} placeholder="12/28"
                            onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 4); setExp(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v); }} />
                          <Input label="CVV" value={cvv} type="password" placeholder="•••"
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                        </div>
                      </div>
                    )}
                    {method === "upi" && (
                      <Input label="UPI ID" placeholder="name@bank" value={upi}
                        onChange={(e) => setUpi(e.target.value)} hint="e.g. yourname@okhdfc" />
                    )}
                    {method === "netbanking" && (
                      <div className="flex flex-col gap-2">
                        {["HDFC", "ICICI", "SBI", "Axis", "Kotak", "Yes Bank"].map((b) => (
                          <Radio key={b} id={`bank-${b}`} name="bank" label={b} checked={netBank === b} onChange={() => setNetBank(b)} />
                        ))}
                      </div>
                    )}
                    {method === "wallet" && (
                      <div className="grid sm:grid-cols-3 gap-2">
                        {["Paytm", "PhonePe", "Amazon Pay", "MobiKwik", "Freecharge", "Airtel Money"].map((w) => (
                          <button key={w} type="button" onClick={() => setWallet(w)}
                            className={"rounded-md border px-3 h-11 text-[13px] font-semibold transition-colors " +
                              (wallet === w ? "bg-brand-50 border-brand-600 text-brand-700" : "bg-white border-border text-ink-soft hover:bg-surface-muted")}>
                            {w}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="rounded-xl bg-blue-50 text-blue-600 text-[12px] font-medium px-4 py-3 flex items-start gap-2">
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Your booking will be confirmed with TBO Hotels upon payment completion.
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[15px] font-bold text-ink mb-3">Price Breakdown</h2>
                <div className="flex flex-col gap-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Room ({current.nights}N × {current.rooms}R)</span>
                    <span className="font-semibold">{formatINR(current.room.basePrice * current.nights * current.rooms)}</span>
                  </div>
                  {current.addOns.breakfast && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Breakfast</span>
                      <span className="font-semibold">{formatINR(650 * current.nights * current.rooms)}</span>
                    </div>
                  )}
                  {current.addOns.insurance && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Travel insurance</span>
                      <span className="font-semibold">{formatINR(499)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Taxes (12%)</span>
                    <span className="font-semibold">{formatINR(current.taxes)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border-soft pt-2 mt-1">
                    <span className="font-bold text-ink">Total</span>
                    <span className="font-extrabold text-[17px] text-ink">{formatINR(current.totalPrice)}</span>
                  </div>
                </div>
              </div>
              <Button variant="accent" size="lg" onClick={onPay} loading={loading} fullWidth>
                Pay {formatINR(current.totalPrice)}
              </Button>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
