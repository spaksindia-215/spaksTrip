"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { createHotelEnquiry, type PartnerHotel } from "@/services/partnerHotels";

type Props = {
  hotel: PartnerHotel | null;
  open: boolean;
  onClose: () => void;
  // Prefill from the active search context.
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  childrenCount?: number;
};

export default function PartnerHotelEnquiryModal({
  hotel,
  open,
  onClose,
  checkIn = "",
  checkOut = "",
  adults = 2,
  childrenCount = 0,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [inDate, setInDate] = useState(checkIn);
  const [outDate, setOutDate] = useState(checkOut);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setMessage("");
    setError(null);
    setDone(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!hotel) return;
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createHotelEnquiry(hotel.id, {
        contact: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
        checkIn: inDate || undefined,
        checkOut: outDate || undefined,
        pax: { adults, children: childrenCount, infants: 0 },
        message: message.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={done ? "Enquiry sent" : `Enquire · ${hotel?.name ?? ""}`}
      footer={
        done ? (
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="accent" size="sm" loading={submitting} onClick={handleSubmit}>
              Send enquiry
            </Button>
          </div>
        )
      }
    >
      {done ? (
        <div className="py-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
            <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[14px] text-ink">
            Thanks! Your enquiry for <span className="font-semibold">{hotel?.name}</span> has been
            sent to the hotel. They&rsquo;ll reach out to you shortly to confirm availability and pricing.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-ink-muted">
            This hotel is booked directly with our partner. Share your details and they&rsquo;ll get
            back to you — no payment now.
          </p>
          <Input id="enq-name" label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="enq-phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
            <Input id="enq-email" label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="enq-checkin" label="Check-in" type="date" value={inDate} onChange={(e) => setInDate(e.target.value)} />
            <Input id="enq-checkout" label="Check-out" type="date" value={outDate} onChange={(e) => setOutDate(e.target.value)} />
          </div>
          <Textarea id="enq-message" label="Message (optional)" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Number of guests, room preference, anything else…" />
          {error && (
            <div role="alert" className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-[13px] text-danger-700">
              {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
