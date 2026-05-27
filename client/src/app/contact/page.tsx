import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | SpaksTrip",
  description: "Reach out to SpaksTrip's support team. We're available via phone, email, or in person at our Badarpur, New Delhi office.",
};

const CONTACT_ITEMS = [
  {
    label: "Email Address",
    value: "spakstrip@gmail.com",
    href: "mailto:spakstrip@gmail.com",
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
        <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v.5l8 5 8-5V8H4Z" />
      </svg>
    ),
  },
  {
    label: "Phone Number",
    value: "+91 922 032 8072  ·  +91 836 874 1739",
    href: "tel:+919220328072",
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
        <path d="M6.6 10.8c1.5 2.9 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 1.7z" />
      </svg>
    ),
  },
  {
    label: "Our Location",
    value: "E-38, Budh Vihar, Badarpur, New Delhi 110044",
    href: "https://maps.google.com/?q=Badarpur,New+Delhi",
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        {/* Page header */}
        <div className="bg-[#f4f6f9] border-b border-zinc-200 py-8 text-center">
          <h1 className="text-3xl font-extrabold text-[#0E1E3A]">Contact Us</h1>
          <p className="mt-2 text-sm text-zinc-500">Home / Contact Us</p>
        </div>

        {/* Main content */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-12 items-start">

            {/* Left — info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-[#0E1E3A] mb-2">
                Reach Out to Our Dedicated Support Team
              </h2>
              <p className="text-sm text-zinc-500 mb-1 font-medium">
                Our team is ready to help. Your satisfaction is our priority.
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed mb-8">
                Got a question, need advice, or looking for help? Our knowledgeable team is here to
                assist you every step of the way. We're just a message or call away, ready to provide
                the guidance you need.
              </p>

              <div className="flex flex-col divide-y divide-zinc-100">
                {CONTACT_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center gap-4 py-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-[13px] text-zinc-500">{item.label}</p>
                      <a
                        href={item.href}
                        className="text-[15px] font-semibold text-[#0E1E3A] hover:text-brand-600 transition-colors"
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {item.value}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <div className="w-full lg:w-[440px] shrink-0">
              <div className="rounded-2xl border border-zinc-200 bg-[#f9fafb] p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#0E1E3A] mb-1">Get in Touch</h2>
                <p className="text-sm text-zinc-500 mb-6">
                  How can we help you? Please write down your query.
                </p>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* Google Maps embed */}
        <div className="w-full">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14023.128244042071!2d77.30298286502692!3d28.516204060033488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce65f77cae949%3A0x7c768dbb3f78e57!2sBadarpur%2C%20New%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1761115714237!5m2!1sen!2sin"
            width="100%"
            height="420"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="SpaksTrip office location — Badarpur, New Delhi"
          />
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
