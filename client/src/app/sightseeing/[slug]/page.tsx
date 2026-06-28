"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { getSightseeing, enquireSightseeing, type SightseeingDetail } from "@/lib/sightseeingClient";
import { CATEGORY_LABELS, POLICY_LABELS } from "@/lib/sightseeingForm";

function titleCase(value: string): string {
  return value.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function operatorName(item: SightseeingDetail): string {
  const p = item.partner;
  if (typeof p === "object" && p) return p.companyName || p.name || "Operator";
  return "Operator";
}

export default function SightseeingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const toast = useToast();
  const [item, setItem] = useState<SightseeingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Enquiry form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getSightseeing(slug);
        if (active) setItem(res.item);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  async function submitEnquiry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.push({ title: "Name and phone are required", tone: "warn" });
      return;
    }
    setSubmitting(true);
    try {
      await enquireSightseeing(slug, {
        contact: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
        travelDate: travelDate || undefined,
        pax: { adults: Number(adults) || 1, children: Number(children) || 0, infants: 0 },
        message: message.trim() || undefined,
      });
      setSubmitted(true);
      toast.push({ title: "Enquiry sent", description: "The operator will get back to you soon.", tone: "success" });
    } catch (err) {
      toast.push({
        title: "Could not send enquiry",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="h-80 animate-pulse rounded-2xl bg-surface-sunken" />
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <EmptyState
            title="Activity not available"
            subtitle="This activity may have been removed or is not yet live."
            cta={<Link href="/sightseeing"><Button variant="accent">Browse activities</Button></Link>}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/sightseeing" className="text-[13px] text-brand-600 hover:underline">← All activities</Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Left: content */}
          <div className="space-y-6">
            {/* Gallery */}
            {item.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
                {item.images.slice(0, 4).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img.url}
                    alt={item.title}
                    className={`h-48 w-full object-cover ${item.images.length === 1 ? "col-span-2 h-72" : ""}`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-surface-muted text-ink-muted">No image</div>
            )}

            <div>
              <span className="inline-block rounded-full bg-accent-50 px-2.5 py-0.5 text-[11px] font-semibold text-accent-700">
                {CATEGORY_LABELS[item.category] ?? item.category}
              </span>
              <h1 className="mt-2 text-[26px] font-extrabold">{item.title}</h1>
              <p className="mt-1 text-[14px] text-ink-muted">
                {item.location?.island ?? ""}{item.location?.address ? ` · ${item.location.address}` : ""}
              </p>
              <p className="mt-1 text-[13px] text-ink-muted">
                By {operatorName(item)}
                {item.duration?.value ? ` · ${item.duration.value} ${titleCase(item.duration.unit)}` : ""}
                {item.difficulty ? ` · ${titleCase(item.difficulty)}` : ""}
              </p>
            </div>

            {item.description ? <p className="text-[14px] leading-relaxed text-ink-soft">{item.description}</p> : null}

            {item.highlights.length > 0 && (
              <Block title="Highlights">
                <ul className="list-disc space-y-1 pl-5 text-[14px] text-ink-soft">
                  {item.highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </Block>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {item.inclusions.length > 0 && (
                <Block title="Inclusions">
                  <ul className="list-disc space-y-1 pl-5 text-[14px] text-ink-soft">
                    {item.inclusions.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </Block>
              )}
              {item.exclusions.length > 0 && (
                <Block title="Exclusions">
                  <ul className="list-disc space-y-1 pl-5 text-[14px] text-ink-soft">
                    {item.exclusions.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </Block>
              )}
            </div>

            {item.whatToBring.length > 0 && (
              <Block title="What to bring">
                <ul className="list-disc space-y-1 pl-5 text-[14px] text-ink-soft">
                  {item.whatToBring.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </Block>
            )}

            {item.meetingPoint?.instructions && (
              <Block title="Meeting point">
                <p className="text-[14px] text-ink-soft">{item.meetingPoint.instructions}</p>
              </Block>
            )}

            <Block title="Good to know">
              <ul className="space-y-1 text-[14px] text-ink-soft">
                <li>Cancellation: {POLICY_LABELS[item.cancellationPolicy] ?? item.cancellationPolicy}</li>
                <li>Book at least {item.bookingCutoffHours}h in advance</li>
                {item.languages.length > 0 && <li>Languages: {item.languages.join(", ")}</li>}
                {item.availableDays.length > 0 && <li>Available: {item.availableDays.map(titleCase).join(", ")}</li>}
                {item.timeSlots.length > 0 && <li>Time slots: {item.timeSlots.join(", ")}</li>}
              </ul>
            </Block>

            {item.termsAndConditions && (
              <Block title="Terms & conditions">
                <p className="whitespace-pre-line text-[13px] text-ink-muted">{item.termsAndConditions}</p>
              </Block>
            )}
          </div>

          {/* Right: pricing + enquiry */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
              <p className="text-[12px] text-ink-muted">From</p>
              <p className="text-[24px] font-extrabold text-ink">
                {item.currency} {(item.pricing?.adult ?? item.pricing?.groupPrice ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[12px] text-ink-muted">
                {item.pricingModel === "per_group" ? "per group" : "per person"}
              </p>
              {(item.pricing?.child !== undefined || item.pricing?.infant !== undefined) && (
                <div className="mt-2 space-y-0.5 text-[13px] text-ink-soft">
                  {item.pricing?.child !== undefined && <p>Child: {item.currency} {item.pricing.child.toLocaleString("en-IN")}</p>}
                  {item.pricing?.infant !== undefined && <p>Infant: {item.currency} {item.pricing.infant.toLocaleString("en-IN")}</p>}
                </div>
              )}
              {/* Booking is enquiry-first today; the Book button is reserved for the
                  upcoming online-payment phase. */}
              <Button type="button" variant="secondary" fullWidth disabled className="mt-4">
                Instant booking — coming soon
              </Button>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
              {submitted ? (
                <div className="text-center">
                  <p className="text-[15px] font-bold text-ink">Enquiry sent ✓</p>
                  <p className="mt-1 text-[13px] text-ink-muted">{operatorName(item)} will contact you shortly.</p>
                  <Link href="/sightseeing/bookings" className="mt-3 inline-block text-[13px] text-brand-600 hover:underline">
                    View my enquiries
                  </Link>
                </div>
              ) : (
                <form onSubmit={submitEnquiry} className="space-y-3">
                  <p className="text-[15px] font-bold text-ink">Enquire now</p>
                  <Input id="e-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input id="e-phone" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Input id="e-email" label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input id="e-date" label="Preferred date" type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input id="e-adults" label="Adults" type="number" min="1" value={adults} onChange={(e) => setAdults(e.target.value)} />
                    <Input id="e-children" label="Children" type="number" min="0" value={children} onChange={(e) => setChildren(e.target.value)} />
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-ink-soft">Message (optional)</span>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="rounded-md border border-border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </label>
                  <Button type="submit" variant="accent" fullWidth loading={submitting}>Send enquiry</Button>
                </form>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-brand-700">{title}</h3>
      {children}
    </section>
  );
}
