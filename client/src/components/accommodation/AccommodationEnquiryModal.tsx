"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createHotelEnquiry } from "@/services/partnerHotels";

type Props = {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
};

// Enquiry against a partner accommodation listing — reuses the existing
// /api/partner-hotels/:id/enquire pipeline (creates a HotelEnquiry + emails the host).
export default function AccommodationEnquiryModal({ open, onClose, hotelId, hotelName }: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName(""); setPhone(""); setEmail(""); setCheckIn(""); setCheckOut(""); setAdults("2"); setChildren("0"); setMessage("");
  };

  const onSubmit = async () => {
    if (!name.trim()) { toast.push({ title: "Enter your name", tone: "warn" }); return; }
    if (!phone.trim()) { toast.push({ title: "Enter your phone number", tone: "warn" }); return; }
    setSubmitting(true);
    try {
      await createHotelEnquiry(hotelId, {
        contact: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        pax: { adults: Number(adults) || 1, children: Number(children) || 0, infants: 0 },
        message: message.trim() || undefined,
      });
      toast.push({ title: "Enquiry sent!", description: "The host and our team will reach out shortly.", tone: "success" });
      reset();
      onClose();
    } catch (e) {
      toast.push({ title: "Could not send enquiry", description: e instanceof Error ? e.message : "Please try again.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Enquire: ${hotelName}`}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={onSubmit} loading={submitting}>Send Enquiry</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-1">
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Check-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <Input label="Check-out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Adults" type="number" value={adults} onChange={(e) => setAdults(e.target.value)} />
          <Input label="Children" type="number" value={children} onChange={(e) => setChildren(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-ink-muted">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Any special requirements or questions…"
            className="resize-none rounded-lg border border-border px-3 py-2 text-[13px] text-ink transition-colors placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  );
}
