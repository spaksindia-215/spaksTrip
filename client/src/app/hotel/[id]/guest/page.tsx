"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import HotelBookingStepper from "@/components/accommodation/HotelBookingStepper";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import GuestDetailsForm from "@/components/accommodation/GuestDetailsForm";
import PreBookDetailsSection from "@/components/accommodation/PreBookDetailsSection";
import SessionTimeoutModal from "@/components/accommodation/SessionTimeoutModal";
import { formatINR } from "@/lib/format";
import { useHotelBookingStore, type HotelGuest } from "@/state/hotelBookingStore";
import { useToast } from "@/components/ui/Toast";
import { useParams } from "next/navigation";
import { validateGuestName, validateGuestAge, validateNoDuplicateFirstNames } from "@/lib/validators/guestValidation";
import { getIdentityRequirement, validatePAN, validatePassport, validatePassportExpiry } from "@/lib/validators/nationalityValidation";
import { validateSession } from "@/lib/validators/sessionValidation";

function buildGuestList(roomCount: number, existingGuests: HotelGuest[] = []): HotelGuest[] {
  if (existingGuests.length > 0) {
    return existingGuests.map((guest) => ({
      title: guest.title ?? "Mr",
      firstName: guest.firstName ?? "",
      lastName: guest.lastName ?? "",
      age: guest.age,
      pan: guest.pan,
      passport: guest.passport,
      passportIssueDate: guest.passportIssueDate,
      passportExpDate: guest.passportExpDate,
    }));
  }
  return Array.from({ length: roomCount }, () => ({
    title: "Mr" as const,
    firstName: "",
    lastName: "",
  }));
}

export default function HotelGuestPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <GuestInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <HotelBookingStepper active="guest" />
      <main className="flex-1 grid place-items-center p-8 text-ink-muted text-[14px]">Loading…</main>
      <Footer />
    </div>
  );
}

function GuestInner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { current, setGuests, setContact, setAddOns } = useHotelBookingStore();
  const initializedBookingIdRef = useRef<string | null>(null);

  const roomCount = current?.rooms ?? 1;

  const [guests, setLocalGuests] = useState<HotelGuest[]>(() =>
    buildGuestList(roomCount, current?.guests ?? []),
  );
  const [email, setEmail] = useState(() => current?.contact.email ?? "");
  const [phone, setPhone] = useState(() => current?.contact.phone ?? "");
  const [breakfast, setBreakfast] = useState(() => current?.addOns.breakfast ?? false);
  const [insurance, setInsurance] = useState(() => current?.addOns.insurance ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [guestErrors, setGuestErrors] = useState<Array<Partial<Record<keyof HotelGuest, string>>>>([]);
  const [sessionStatus, setSessionStatus] = useState(() =>
    current ? validateSession(current.sessionExpiresAt) : null
  );
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!current) router.replace("/hotel");
  }, [current, router]);

  // Monitor session timeout
  useEffect(() => {
    if (!current) return;

    const checkSession = () => {
      const status = validateSession(current.sessionExpiresAt);
      setSessionStatus(status);

      if (status.isExpired) {
        // Session expired, show modal and prevent further actions
        if (sessionCheckIntervalRef.current) {
          clearInterval(sessionCheckIntervalRef.current);
        }
      }
    };

    checkSession();
    sessionCheckIntervalRef.current = setInterval(checkSession, 1000);

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [current]);

  useEffect(() => {
    if (!current) return;
    if (initializedBookingIdRef.current === current.id) return;
    initializedBookingIdRef.current = current.id;
    setLocalGuests(buildGuestList(current.rooms, current.guests));
    setGuestErrors([]);
  }, [current?.id]);

  if (!current) return null;

  const updateGuest = (i: number, updatedGuest: HotelGuest) => {
    setLocalGuests((prev) => prev.map((g, idx) => (idx === i ? updatedGuest : g)));
    // Clear error for this guest when user edits
    setGuestErrors((prev) => prev.map((e, idx) => (idx === i ? {} : e)));
  };

  const validateGuests = (): boolean => {
    const errors: Array<Partial<Record<keyof HotelGuest, string>>> = [];
    const guestNationality = current?.guestNationality ?? "IN";
    const hotelCountry = current?.hotel.country;

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      const guestErr: Partial<Record<keyof HotelGuest, string>> = {};
      const isLeadPassenger = i === 0;

      // Validate title
      if (!guest.title) {
        guestErr.title = "Please select a title";
      }

      // Validate firstName
      const firstNameValidation = validateGuestName(guest.firstName);
      if (!firstNameValidation.valid) {
        guestErr.firstName = firstNameValidation.error;
      }

      // Validate lastName
      const lastNameValidation = validateGuestName(guest.lastName);
      if (!lastNameValidation.valid) {
        guestErr.lastName = lastNameValidation.error;
      }

      // Validate age if provided
      const ageValidation = validateGuestAge(guest.age);
      if (!ageValidation.valid) {
        guestErr.age = ageValidation.error;
      }

      // Validate identity documents for lead passenger
      // Rules: Respect BOTH nationality-based rules AND PreBook response requirements
      if (isLeadPassenger) {
        const identityReq = getIdentityRequirement(guestNationality, hotelCountry);
        const preBookPanMandatory = current?.preBook?.panMandatory || false;
        const preBookPassportMandatory = current?.preBook?.passportMandatory || false;

        // PAN validation: required if nationality rules OR PreBook says mandatory
        const panRequired = identityReq.panRequired || preBookPanMandatory;
        if (panRequired) {
          const panVal = validatePAN(guest.pan ?? "");
          if (!panVal.valid) {
            guestErr.pan = panVal.error;
          }
        }

        // Passport validation: required if nationality rules OR PreBook says mandatory
        const passportRequired = identityReq.passportRequired || preBookPassportMandatory;
        if (passportRequired) {
          const passportVal = validatePassport(guest.passport ?? "");
          if (!passportVal.valid) {
            guestErr.passport = passportVal.error;
          }
          if (guest.passportExpDate) {
            const expiryVal = validatePassportExpiry(guest.passportExpDate);
            if (!expiryVal.valid) {
              guestErr.passportExpDate = expiryVal.error;
            }
          } else {
            guestErr.passportExpDate = "Passport expiry date is required";
          }
          if (!guest.passportIssueDate) {
            guestErr.passportIssueDate = "Passport issue date is required";
          }
        }
      }

      errors.push(guestErr);
    }

    // Check for duplicate first names
    const duplicateCheck = validateNoDuplicateFirstNames(guests);
    if (!duplicateCheck.valid) {
      toast.push({ title: duplicateCheck.error || "Invalid guest names", tone: "warn" });
      return false;
    }

    const hasErrors = errors.some((e) => Object.keys(e).length > 0);
    if (hasErrors) {
      setGuestErrors(errors);
      toast.push({ title: "Please fix errors in guest details", tone: "warn" });
      return false;
    }

    return true;
  };

  const onContinue = () => {
    // Check session before proceeding
    if (!sessionStatus || !sessionStatus.isValid) {
      toast.push({
        title: "Session Expired",
        description: "Your booking session has expired. Please start a new search.",
        tone: "danger",
      });
      return;
    }

    if (!validateGuests()) return;

    if (!email.trim() || !email.includes("@")) {
      toast.push({ title: "Enter a valid email address", tone: "warn" });
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      toast.push({ title: "Enter a valid phone number", tone: "warn" });
      return;
    }
    setSubmitting(true);
    setGuests(guests);
    setContact({ email, phone, countryCode: "+91" });
    setAddOns({ breakfast, insurance });
    router.push(`/hotel/${encodeURIComponent(id)}/payment?${sp.toString()}`);
  };

  const handleSessionTimeout = () => {
    // Clear current booking and redirect to new search
    router.replace("/hotel");
  };

  const addOnTotal = (breakfast ? 650 * current.nights * current.rooms : 0) + (insurance ? 499 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <HotelBookingStepper active="guest" />

      {/* Session Timeout Modal */}
      <SessionTimeoutModal
        isOpen={sessionStatus?.isExpired ?? false}
        minutesRemaining={sessionStatus?.minutesRemaining ?? 0}
        secondsRemaining={sessionStatus?.secondsRemaining ?? 0}
        onNewSearch={handleSessionTimeout}
      />

      {/* Session Warning Banner */}
      {sessionStatus?.isWarning && !sessionStatus?.isExpired && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 md:px-6 py-3">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg
                  viewBox="0 0 24 24"
                  width={20}
                  height={20}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-600"
                  aria-hidden
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-amber-900">
                    Session Timeout Warning
                  </p>
                  <p className="text-[12px] text-amber-800">
                    Your booking session expires in {sessionStatus.minutesRemaining}m {sessionStatus.secondsRemaining}s.
                    Complete your booking quickly or start a new search.
                  </p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-amber-900 shrink-0 font-mono">
                {sessionStatus.minutesRemaining}:{String(sessionStatus.secondsRemaining).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6">
          <div className="grid md:grid-cols-[1fr_320px] gap-5">
            <div className="flex flex-col gap-4">
              {/* PreBook Details */}
              {current.preBook && (
                <PreBookDetailsSection preBook={current.preBook} />
              )}

              {/* Guest names */}
              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[16px] font-bold text-ink mb-4">Guest Details</h2>
                <div className="flex flex-col gap-6">
                  {guests.map((g, i) => (
                    <div key={i} className="flex flex-col gap-3 pb-4 border-b border-border-soft last:pb-0 last:border-0">
                      <GuestDetailsForm
                        roomNumber={i + 1}
                        guest={g}
                        onChange={(updatedGuest) => updateGuest(i, updatedGuest)}
                        errors={guestErrors[i]}
                        guestNationality={current?.guestNationality}
                        hotelCountry={current?.hotel.country}
                        isLeadPassenger={i === 0}
                        preBookPanMandatory={current?.preBook?.panMandatory}
                        preBookPassportMandatory={current?.preBook?.passportMandatory}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Contact */}
              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[16px] font-bold text-ink mb-4">Contact Information</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    hint="Booking confirmation will be sent here"
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </section>

              {/* Add-ons */}
              <section className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[16px] font-bold text-ink mb-4">Add-ons</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4 rounded-lg bg-surface-muted p-3">
                    <Checkbox
                      id="add-breakfast"
                      label="Breakfast for all rooms"
                      description={`${formatINR(650)} per room per night`}
                      checked={breakfast}
                      onChange={(e) => setBreakfast(e.target.checked)}
                    />
                    <span className="text-[13px] font-bold text-ink shrink-0">
                      {formatINR(650 * current.nights * current.rooms)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 rounded-lg bg-surface-muted p-3">
                    <Checkbox
                      id="add-insurance"
                      label="Travel insurance"
                      description="Covers trip cancellation, medical emergencies"
                      checked={insurance}
                      onChange={(e) => setInsurance(e.target.checked)}
                    />
                    <span className="text-[13px] font-bold text-ink shrink-0">{formatINR(499)}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Price summary */}
            <aside className="flex flex-col gap-4">
              <div className="rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
                <h2 className="text-[15px] font-bold text-ink mb-3">Price Summary</h2>
                <div className="flex flex-col gap-2 text-[13px]">
                  {addOnTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Add-ons</span>
                      <span className="font-semibold text-ink">{formatINR(addOnTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border-soft pt-2 mt-1">
                    <span className="font-bold text-ink">Total</span>
                    <span className="font-extrabold text-[16px] text-ink">{formatINR(current.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <Button variant="accent" size="lg" onClick={onContinue} loading={submitting} fullWidth>
                Continue to Payment
              </Button>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
