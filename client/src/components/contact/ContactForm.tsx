"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { sleep } from "@/services/delay";

export default function ContactForm() {
  const toast = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { toast.push({ title: "Enter your first name", tone: "warn" }); return; }
    if (!email.trim() || !email.includes("@")) { toast.push({ title: "Enter a valid email", tone: "warn" }); return; }
    if (!phone.trim()) { toast.push({ title: "Enter your phone number", tone: "warn" }); return; }
    if (!message.trim()) { toast.push({ title: "Write your message", tone: "warn" }); return; }
    setSubmitting(true);
    await sleep(1200);
    toast.push({ title: "Message sent!", description: "Our team will get back to you within 24 hours.", tone: "success" });
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setMessage("");
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="John"
        />
        <Input
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Doe"
        />
      </div>
      <Input
        label="Email *"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <Input
        label="Phone *"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+91 98765 43210"
      />
      <div>
        <label className="mb-1 block text-[13px] font-semibold text-ink">
          Message *
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="How can we help you?"
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink placeholder:text-ink-muted outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
        />
      </div>
      <Button type="submit" variant="primary" size="md" fullWidth loading={submitting}>
        Send Message
      </Button>
    </form>
  );
}
