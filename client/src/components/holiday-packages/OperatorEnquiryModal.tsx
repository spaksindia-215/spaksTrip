"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { submitEnquiry, type PackageOffer, type Operator } from "@/lib/packagesClient";
import { formatINR } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  slug: string;
  packageTitle: string;
  offer: PackageOffer | null;
};

function operatorName(offer: PackageOffer | null): string {
  if (!offer) return "";
  const p = offer.partner as Operator;
  return (typeof p === "object" && (p.companyName || p.name)) || "Operator";
}

// Enquiry against a specific operator offer. Submits to the real marketplace API
// (guests allowed). Replaces the mock EnquiryModal for the detail-page flow.
export default function OperatorEnquiryModal({ open, onClose, slug, packageTitle, offer }: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [travelDate, setTravelDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName(""); setEmail(""); setPhone(""); setAdults("2"); setChildren("0"); setTravelDate(""); setMessage("");
  };

  const onSubmit = async () => {
    if (!offer) return;
    if (!name.trim()) { toast.push({ title: "Enter your name", tone: "warn" }); return; }
    if (!phone.trim()) { toast.push({ title: "Enter your phone number", tone: "warn" }); return; }
    setSubmitting(true);
    try {
      await submitEnquiry(slug, {
        offerId: offer.id,
        contact: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
        travelDate: travelDate || undefined,
        pax: { adults: Number(adults) || 1, children: Number(children) || 0, infants: 0 },
        message: message.trim() || undefined,
      });
      toast.push({ title: "Enquiry sent!", description: "The operator and our team will contact you shortly.", tone: "success" });
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
      title={`Enquire: ${packageTitle}`}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={onSubmit} loading={submitting}>Send Enquiry</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-1">
        {offer && (
          <div className="rounded-lg bg-surface-muted px-3 py-2 text-[12px] text-ink-soft">
            Operator: <span className="font-semibold text-ink">{operatorName(offer)}</span>
            {" · "}
            <span className="font-semibold text-ink">{formatINR(offer.price)}</span>
            {offer.perPerson ? " /person" : ""}
          </div>
        )}
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Travel Date" type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
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
