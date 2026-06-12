"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import HotelBookingStepper from "@/components/accommodation/HotelBookingStepper";
import HotelAmenitiesGrid from "@/components/accommodation/HotelAmenitiesGrid";
import RoomCard from "@/components/accommodation/RoomCard";
import PriceChangeModal from "@/components/accommodation/PriceChangeModal";
import SessionTimeoutModal from "@/components/accommodation/SessionTimeoutModal";
import { getHotel } from "@/services/hotels";
import { useHotelBookingStore } from "@/state/hotelBookingStore";
import type { HotelPreBookInfo } from "@/state/hotelBookingStore";
import { useToast } from "@/components/ui/Toast";
import type { Hotel, Room } from "@/lib/mock/hotels";
import Skeleton from "@/components/ui/Skeleton";
import { validateSession } from "@/lib/validators/sessionValidation";

export default function HotelDetailPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <HotelDetailInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <HotelBookingStepper active="room" />
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <Skeleton className="h-80 w-full rounded-xl mb-4" />
        <Skeleton className="h-6 w-64 rounded mb-2" />
        <Skeleton className="h-4 w-48 rounded" />
      </main>
      <Footer />
    </div>
  );
}

function HotelDetailInner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { startHotelBooking, setPreBook } = useHotelBookingStore();

  const checkIn = sp.get("checkIn") ?? "";
  const checkOut = sp.get("checkOut") ?? "";
  const rooms = Number(sp.get("rooms") ?? 1);
  const adults = Number(sp.get("adults") ?? 2);
  const children = Number(sp.get("children") ?? 0);
  const childrenAges = (sp.get("childrenAges") ?? "")
    .split(",").map(Number).filter((n) => !isNaN(n) && n >= 0).filter((_, i) => i < children);
  const guestNationality = sp.get("nationality") ?? "IN";

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [priceChangeState, setPriceChangeState] = useState<{
    isOpen: boolean;
    originalPrice: number;
    newPrice: number;
    changePercent: number;
    preBookInfo: HotelPreBookInfo | null;
    hotelId: string;
  }>({
    isOpen: false,
    originalPrice: 0,
    newPrice: 0,
    changePercent: 0,
    preBookInfo: null,
    hotelId: "",
  });
  const [sessionTimeoutState, setSessionTimeoutState] = useState({
    isOpen: false,
    minutesRemaining: 0,
    secondsRemaining: 0,
  });

  useEffect(() => {
    getHotel(decodeURIComponent(id), { checkIn, checkOut, rooms, adults, children, childrenAges }).then((h) => {
      setHotel(h);
      setLoading(false);
    });
  }, [id, checkIn, checkOut, rooms, adults, children, childrenAges.join(",")]);

  const onSelectRoom = async (room: Room) => {
    if (!hotel) return;
    if (!checkIn || !checkOut) {
      toast.push({ title: "Missing check-in or check-out dates", tone: "warn" });
      return;
    }

    // Initialize booking with Search data first
    const bookingData = { hotel, room, checkIn, checkOut, rooms, adults, children, childrenAges, guestNationality };
    startHotelBooking(bookingData);

    // room.id is the BookingCode returned by the TBO Detail/Search call.
    // For a multi-room search TBO encodes ALL rooms into a single compound
    // BookingCode (e.g. "1125776!TB!1!TB!..."). There is exactly ONE PreBook
    // call per booking regardless of room count — the compound code covers
    // every room in the occupancy. Never call PreBook once per room.
    const bookingCode = room.id;
    if (!bookingCode) {
      toast.push({ title: "Invalid room data. Please try again.", tone: "warn" });
      return;
    }

    console.log("SEARCH OCCUPANCY", { rooms, adults, children, childrenAges });
    console.log("SELECTED ROOMS", { roomId: room.id, roomName: room.name, basePrice: room.basePrice });
    console.log("BOOKING CODES", { bookingCode });

    // Call PreBook to lock in rate and get final details
    try {
      const preBookPayload = { bookingCode };
      console.log("PREBOOK PAYLOAD", preBookPayload);

      const preBookRes = await fetch("/api/hotels/prebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preBookPayload),
      });

      if (!preBookRes.ok) {
        const error = await preBookRes.json();
        toast.push({ title: `PreBook failed: ${error.error}`, tone: "warn" });
        return;
      }

      const { data: preBookData } = await preBookRes.json();
      console.log("PREBOOK RESPONSE rooms count", preBookData.rooms?.length, "codes", preBookData.rooms?.map((r: any) => r.bookingCode));
      const firstRoom = preBookData.rooms?.[0];

      if (!firstRoom) {
        toast.push({ title: "PreBook returned invalid data. Please try again.", tone: "warn" });
        return;
      }

      console.log("ROOM OCCUPANCY", { requestedRooms: rooms, preBookRoomCount: preBookData.rooms?.length, netAmount: firstRoom.netAmount ?? firstRoom.totalFare });

      // Store PreBook info in booking store
      const preBookInfo: HotelPreBookInfo = {
        bookingCode: firstRoom.bookingCode,
        inclusion: firstRoom.inclusion,
        roomPromotion: firstRoom.roomPromotion,
        cancelPolicies: firstRoom.cancelPolicies,
        rateConditions: preBookData.rateConditions,
        supplements: firstRoom.supplements,
        netAmount: firstRoom.netAmount || firstRoom.totalFare,
        panMandatory: firstRoom.panMandatory,
        passportMandatory: firstRoom.passportMandatory,
        paxNameMinLength: firstRoom.paxNameMinLength,
        paxNameMaxLength: firstRoom.paxNameMaxLength,
      };

      // Detect price change: compare Search price vs PreBook price
      // Search price: room.basePrice × nights × rooms + taxes
      const searchTotalPrice = Math.round(room.basePrice * nights * rooms * 1.12); // Approx with 12% tax
      const preBookNetAmount = preBookInfo.netAmount;
      const priceChanged = Math.abs(searchTotalPrice - preBookNetAmount) > 100; // Allow 100 INR variance

      if (priceChanged) {
        // Show modal and wait for user confirmation before proceeding
        const changePercent = ((preBookNetAmount - searchTotalPrice) / searchTotalPrice) * 100;
        setPriceChangeState({
          isOpen: true,
          originalPrice: searchTotalPrice,
          newPrice: preBookNetAmount,
          changePercent,
          preBookInfo,
          hotelId: id,
        });
      } else {
        // No price change, proceed directly
        setPreBook(preBookInfo, preBookNetAmount);
        router.push(`/hotel/${encodeURIComponent(id)}/guest?${sp.toString()}`);
      }
    } catch (error) {
      console.error("PreBook error:", error);
      toast.push({ title: "Failed to lock in rate. Please try again.", tone: "warn" });
    }
  };

  const handlePriceChangeAccept = () => {
    if (priceChangeState.preBookInfo) {
      setPreBook(priceChangeState.preBookInfo, priceChangeState.newPrice);
      setPriceChangeState({ ...priceChangeState, isOpen: false });
      router.push(`/hotel/${encodeURIComponent(id)}/guest?${sp.toString()}`);
    }
  };

  const handlePriceChangeReject = () => {
    setPriceChangeState({ ...priceChangeState, isOpen: false });
    // Clear current booking and stay on detail page
    // User can select a different room
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <HotelBookingStepper active="room" />

      {/* Price Change Confirmation Modal */}
      <PriceChangeModal
        isOpen={priceChangeState.isOpen}
        originalPrice={priceChangeState.originalPrice}
        newPrice={priceChangeState.newPrice}
        changePercent={priceChangeState.changePercent}
        onAccept={handlePriceChangeAccept}
        onReject={handlePriceChangeReject}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6">
          {loading && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-6 w-56 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
          )}

          {!loading && !hotel && (
            <div className="rounded-xl bg-white border border-border-soft p-12 text-center">
              <p className="text-[15px] font-semibold text-ink">Hotel not found</p>
            </div>
          )}

          {!loading && hotel && (
            <div className="flex flex-col gap-6">
              {/* Photo gallery */}
              <div className="flex flex-col gap-2">
                <div className="relative h-72 md:h-96 overflow-hidden rounded-xl group">
                  <img
                    src={hotel.images[activeImg]}
                    alt={`${hotel.name} photo ${activeImg + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {hotel.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveImg((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Previous image"
                      >
                        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveImg((prev) => (prev === hotel.images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Next image"
                      >
                        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 bg-black/20 px-2 py-1.5 rounded-full">
                        {hotel.images.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImg(idx)}
                            className={`transition-all ${
                              idx === activeImg ? 'bg-white w-2 h-2' : 'bg-white/60 hover:bg-white/80 w-1.5 h-1.5'
                            } rounded-full`}
                            aria-label={`View image ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {hotel.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      aria-label={`View photo ${i + 1}`}
                      className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === activeImg ? "border-brand-600" : "border-transparent"}`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Hotel header */}
              <div className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-[22px] font-extrabold text-ink">{hotel.name}</h1>
                    {hotel.chain && <p className="text-[13px] text-ink-muted">{hotel.chain}</p>}
                    <p className="text-[13px] text-ink-muted mt-1 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {hotel.address}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-brand-700 px-2 py-0.5 text-[14px] font-bold text-white">
                        {hotel.reviewScore.toFixed(1)}
                      </span>
                      <span className="text-[14px] font-bold text-ink">{hotel.reviewLabel}</span>
                      <span className="text-[12px] text-ink-muted">({hotel.reviewCount.toLocaleString()} reviews)</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <svg key={i} viewBox="0 0 24 24" width={14} height={14}
                          fill={i < hotel.starRating ? "currentColor" : "none"}
                          stroke="currentColor" strokeWidth={1.5}
                          className={i < hotel.starRating ? "text-warn-500" : "text-border"} aria-hidden>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[16px] font-bold text-ink mb-4">Hotel Amenities</h2>
                <HotelAmenitiesGrid amenities={hotel.amenities} />
              </section>

              {/* Rooms */}
              <section>
                <h2 className="text-[18px] font-bold text-ink mb-3">
                  Available Rooms
                  <span className="ml-2 text-[13px] font-normal text-ink-muted">
                    {checkIn} – {checkOut} · {nights} night{nights !== 1 ? "s" : ""} · {rooms} room{rooms !== 1 ? "s" : ""}
                  </span>
                </h2>
                <div className="flex flex-col gap-3">
                  {hotel.rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      nights={nights}
                      rooms={rooms}
                      onSelect={onSelectRoom}
                    />
                  ))}
                </div>
              </section>

              {/* Reviews */}
              {hotel.reviews.length > 0 && (
                <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                  <h2 className="text-[16px] font-bold text-ink mb-4">Guest Reviews</h2>
                  <div className="flex flex-col gap-4">
                    {hotel.reviews.map((review) => (
                      <article key={review.id} className="flex flex-col gap-1.5 pb-4 border-b border-border-soft last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[13px] font-bold text-ink">{review.author}</p>
                            <p className="text-[11px] text-ink-muted">{review.date}</p>
                          </div>
                          <span className="rounded bg-brand-700 px-1.5 py-0.5 text-[12px] font-bold text-white">
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-[13px] font-semibold text-ink">{review.title}</p>
                        <p className="text-[13px] text-ink-soft leading-relaxed">{review.body}</p>
                        {review.verified && (
                          <span className="text-[11px] text-success-600 font-semibold flex items-center gap-1">
                            <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Verified stay
                          </span>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
