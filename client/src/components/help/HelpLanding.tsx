"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

export default function HelpLanding() {
  const { push: toast } = useToast();
  const [form, setForm] = useState<FormState>(initialFormState);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.message.trim()
    ) {
      toast({
        title: "Please complete all required fields.",
        description: "Fill in your name, email, phone, and message before submitting.",
        tone: "danger",
      });
      return;
    }

    toast({
      title: "Message sent successfully.",
      description: "Our support team will get back to you soon.",
      tone: "success",
    });
    setForm(initialFormState);
  }

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-[1820px] px-4 py-10 sm:px-6 lg:px-[66px] lg:py-16">
        <section className="grid gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div className="max-w-[860px] pt-4 lg:pt-16">
            <h1 className="max-w-[620px] text-[42px] font-black leading-[1.12] tracking-tight text-[#0E1E3A] sm:text-[54px]">
              Reach Out to Our Dedicated Support Team
            </h1>

            <p className="mt-8 text-[22px] font-bold leading-[1.45] text-[#0E1E3A]">
              Our team is ready to help. Your satisfaction is our priority
            </p>

            <p className="mt-4 max-w-[980px] text-[20px] leading-[1.7] text-[#475569]">
              Got a question, need advice, or looking for help? Our
              knowledgeable team is here to assist you every step of the way.
              We&apos;re just a message or call away, ready to provide the
              guidance you need.
            </p>

            <div className="mt-14 divide-y divide-slate-200/90">
              <ContactInfoRow
                icon={<MailIcon />}
                label="Email Address"
                value="spakstrip@gmail.com"
              />
              <ContactInfoRow
                icon={<PhoneIcon />}
                label="Phone Number"
                value="+91 922 032 8072 , +91 836 874 1739"
              />
              <ContactInfoRow
                icon={<LocationIcon />}
                label="Our Location"
                value="E-38, Budh Vihar, Badarpur, New Delhi 110044"
              />
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-[#F8FAFC] p-7 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.22)] sm:p-8">
            <h2 className="text-[34px] font-black tracking-tight text-[#0E1E3A]">
              Get in Touch
            </h2>
            <p className="mt-3 text-[18px] leading-[1.65] text-[#475569]">
              How we can help you? Please write down your query
            </p>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="first-name"
                  label="First Name"
                  value={form.firstName}
                  onChange={(value) => updateField("firstName", value)}
                />
                <Field
                  id="last-name"
                  label="Last Name"
                  value={form.lastName}
                  onChange={(value) => updateField("lastName", value)}
                />
              </div>

              <Field
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
              />

              <Field
                id="phone"
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
              />

              <div>
                <label
                  htmlFor="message"
                  className="mb-3 block text-[17px] font-semibold text-[#334155]"
                >
                  Message <span className="text-[#E14A3B]">*</span>
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  className="w-full rounded-[8px] border border-slate-300 bg-white px-4 py-3 text-[17px] text-[#0E1E3A] outline-none transition focus:border-[#E14A3B] focus:ring-2 focus:ring-[#E14A3B]/10"
                />
              </div>

              <button
                type="submit"
                className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#DE4B3B] px-9 text-[18px] font-bold text-white transition hover:bg-[#c93d2f]"
              >
                Send Message
              </button>
            </form>
          </div>
        </section>

        <section className="mt-16 sm:mt-20">
          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_24px_-18px_rgba(15,23,42,0.22)]">
            <iframe
              title="SpaksTrip location map"
              src="https://www.google.com/maps?q=E-38,%20Budh%20Vihar,%20Badarpur,%20New%20Delhi%20110044&z=14&output=embed"
              className="h-[360px] w-full border-0 sm:h-[460px] lg:h-[540px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-3 block text-[17px] font-semibold text-[#334155]">
        {label} <span className="text-[#E14A3B]">*</span>
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[56px] w-full rounded-[8px] border border-slate-300 bg-white px-4 text-[17px] text-[#0E1E3A] outline-none transition focus:border-[#E14A3B] focus:ring-2 focus:ring-[#E14A3B]/10"
      />
    </div>
  );
}

function ContactInfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 py-8 first:pt-0 last:pb-0">
      <span className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full bg-[#E8EEF5] text-[#51637C]">
        {icon}
      </span>
      <div className="pt-1">
        <p className="text-[17px] text-[#475569]">{label}</p>
        <p className="mt-1 text-[20px] font-bold leading-[1.5] text-[#42526B]">
          {value}
        </p>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="currentColor" aria-hidden="true">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v.5l8 5 8-5V8H4Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8c1.5 2.9 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 1.7z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={28}
      height={28}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7.5 9 4l6 3.5L21 4v12.5L15 20l-6-3.5L3 20V7.5Z" />
      <path d="M9 4v12.5" />
      <path d="M15 7.5V20" />
    </svg>
  );
}
