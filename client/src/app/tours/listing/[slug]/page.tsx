"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import {
  getTourListing,
  categoryLabel,
  operatorName,
  fromPrice,
  durationLabel,
  type TourListingDetail,
} from "@/lib/tourListingsClient";
import { formatINR } from "@/lib/format";
import { api } from "@/lib/api";

// ── Enquiry form ──────────────────────────────────────────────────────────────

type EnquiryState = "idle" | "submitting" | "done" | "error";

function EnquiryForm({ listing }: { listing: TourListingDetail }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [adults, setAdults] = useState("1");
  const [travelDate, setTravelDate] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<EnquiryState>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setState("submitting");
    setErrMsg(null);
    try {
      await api("/api/sightseeing/enquire", {
        method: "POST",
        body: {
          listingId: listing.id,
          listingTitle: listing.title,
          contact: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
          pax: { adults: parseInt(adults, 10) || 1 },
          travelDate: travelDate || undefined,
          message: message.trim() || undefined,
        },
      });
      setState("done");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Could not send enquiry. Please try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-success-200 bg-success-50 p-6 text-center">
        <p className="text-[28px]">✅</p>
        <p className="mt-2 text-[15px] font-bold text-success-700">Enquiry sent!</p>
        <p className="mt-1 text-[13px] text-success-600">
          The operator will contact you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h3 className="text-[16px] font-bold text-ink">Book / Enquire</h3>

      {errMsg && (
        <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">
          {errMsg}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-ink-soft">Your name *</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-ink-soft">Phone *</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-ink-soft">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-ink-soft">Adults</span>
          <input
            type="number"
            min="1"
            max="50"
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[12px] font-semibold text-ink-soft">Travel date</span>
          <input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[12px] font-semibold text-ink-soft">Message (optional)</span>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Any special requirements or questions…"
            className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-xl bg-accent-500 py-3 text-[15px] font-bold text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
      >
        {state === "submitting" ? "Sending…" : "Send Enquiry"}
      </button>

      <p className="text-center text-[11px] text-ink-muted">
        Free to enquire · No booking fee
      </p>
    </form>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function Gallery({ images }: { images: { url: string }[] }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={images[active].url}
          alt="Tour gallery"
          className="h-72 w-full object-cover sm:h-96"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((a) => (a === 0 ? images.length - 1 : a - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActive((a) => (a + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === active ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TourListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [listing, setListing] = useState<TourListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const enquiryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTourListing(slug)
      .then((r) => setListing(r.item))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load tour"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-12">
          <div className="h-96 animate-pulse rounded-2xl bg-border-soft/60" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-12">
          <p className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-[14px] text-danger-700">
            {error ?? "Tour not found."}
          </p>
          <Link href="/tours" className="mt-4 inline-block text-[14px] text-brand-600 hover:underline">
            ← Back to Tours
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const price = fromPrice(listing);
  const dur = durationLabel(listing);
  const operator = operatorName(listing);

  // Group pricing tiers
  const pricingRows = listing.pricing;

  return (
    <div className="min-h-screen bg-white text-ink">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-2 text-[13px] text-ink-muted">
          <Link href="/tours" className="hover:text-brand-600">Tours</Link>
          <span>›</span>
          <Link href={`/tours/${encodeURIComponent(listing.basedIn)}`} className="hover:text-brand-600">
            {listing.basedIn}
          </Link>
          <span>›</span>
          <span className="text-ink">{listing.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            {/* Gallery */}
            <Gallery images={listing.images} />

            {/* Title + meta */}
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-0.5 text-[11px] font-bold text-brand-700">
                  {categoryLabel(listing.category)}
                </span>
                {listing.operatingDays.length > 0 && (
                  <span className="rounded-full bg-surface-muted px-3 py-0.5 text-[11px] font-semibold text-ink-muted">
                    {listing.operatingDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
                  </span>
                )}
              </div>
              <h1 className="text-[28px] font-extrabold leading-tight sm:text-[32px]">{listing.title}</h1>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-soft">
                <span className="flex items-center gap-1.5">📍 {listing.basedIn}</span>
                {dur && <span className="flex items-center gap-1.5">🕐 {dur}</span>}
                {listing.minGroupSize > 1 && (
                  <span className="flex items-center gap-1.5">👥 Min {listing.minGroupSize} people</span>
                )}
                {listing.languages.length > 0 && (
                  <span className="flex items-center gap-1.5">🗣 {listing.languages.join(", ")}</span>
                )}
                <span className="flex items-center gap-1.5">🏢 {operator}</span>
              </div>

              {listing.description && (
                <p className="text-[14px] leading-relaxed text-ink-soft">{listing.description}</p>
              )}
            </section>

            {/* Highlights */}
            {listing.highlights.length > 0 && (
              <section>
                <h2 className="mb-3 text-[17px] font-bold">Highlights</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {listing.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-[13px] text-ink-soft">
                      <span className="mt-0.5 text-accent-500">✦</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Itinerary */}
            {listing.itinerary.length > 0 && (
              <section>
                <h2 className="mb-4 text-[17px] font-bold">Itinerary</h2>
                <ol className="relative flex flex-col gap-0 pl-5">
                  {/* Timeline line */}
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-brand-100" />
                  {listing.itinerary.map((stop, i) => (
                    <li key={i} className="relative pb-5 last:pb-0">
                      <div className="absolute -left-3 top-0.5 h-3 w-3 rounded-full border-2 border-brand-500 bg-white" />
                      <div className="ml-3">
                        {stop.time && (
                          <span className="text-[11px] font-bold uppercase tracking-wide text-brand-500">
                            {stop.time}
                          </span>
                        )}
                        {stop.title && (
                          <p className="text-[14px] font-semibold text-ink">{stop.title}</p>
                        )}
                        {stop.description && (
                          <p className="mt-0.5 text-[13px] text-ink-soft">{stop.description}</p>
                        )}
                        {stop.location && (
                          <p className="mt-0.5 text-[12px] text-ink-muted">📍 {stop.location}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Inclusions / Exclusions */}
            {(listing.inclusions.length > 0 || listing.exclusions.length > 0) && (
              <section className="grid gap-6 sm:grid-cols-2">
                {listing.inclusions.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-[17px] font-bold">Inclusions</h2>
                    <ul className="flex flex-col gap-1.5">
                      {listing.inclusions.map((inc) => (
                        <li key={inc} className="flex items-start gap-2 text-[13px] text-ink-soft">
                          <span className="mt-0.5 text-success-500">✓</span> {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {listing.exclusions.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-[17px] font-bold">Exclusions</h2>
                    <ul className="flex flex-col gap-1.5">
                      {listing.exclusions.map((exc) => (
                        <li key={exc} className="flex items-start gap-2 text-[13px] text-ink-soft">
                          <span className="mt-0.5 text-danger-500">✕</span> {exc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Pickup points */}
            {listing.pickupIncluded && listing.pickupPoints.length > 0 && (
              <section>
                <h2 className="mb-3 text-[17px] font-bold">Pickup Points</h2>
                <div className="flex flex-wrap gap-3">
                  {listing.pickupPoints.map((pp, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-xl border border-border-soft bg-surface-muted px-4 py-2.5 text-[13px]"
                    >
                      <span className="text-brand-500">📍</span>
                      <span className="font-semibold text-ink">{pp.name}</span>
                      {pp.time && <span className="text-ink-muted">· {pp.time}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mobile enquiry anchor */}
            <div className="lg:hidden">
              <div ref={enquiryRef} />
            </div>
          </div>

          {/* Right column — sticky sidebar */}
          <aside className="flex flex-col gap-5">
            {/* Pricing card */}
            <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-(--shadow-sm)">
              <div className="mb-4">
                {price != null ? (
                  <>
                    <p className="text-[12px] font-semibold text-ink-muted">Starting from</p>
                    <p className="text-[32px] font-extrabold leading-tight text-brand-700">
                      {formatINR(price)}
                    </p>
                    <p className="text-[12px] text-ink-muted">Per person</p>
                  </>
                ) : (
                  <p className="text-[15px] font-semibold text-ink-muted">Contact for pricing</p>
                )}
              </div>

              {/* Pricing tiers */}
              {pricingRows.length > 1 && (
                <div className="mb-5 rounded-xl bg-brand-900 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-white/60">
                    Package Cost
                  </p>
                  <div className="flex flex-col gap-2">
                    {pricingRows.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-[13px]">
                        <span className="text-white/80">{t.label}</span>
                        <span className="font-bold text-white">{formatINR(t.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Private option */}
              {listing.privateAvailable && listing.privatePrice != null && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-accent-200 bg-accent-50 px-4 py-3">
                  <div>
                    <p className="text-[12px] font-bold text-accent-700">Private Tour</p>
                    <p className="text-[11px] text-accent-600">Exclusive for your group</p>
                  </div>
                  <p className="text-[15px] font-extrabold text-accent-700">
                    {formatINR(listing.privatePrice)}
                  </p>
                </div>
              )}

              <EnquiryForm listing={listing} />
            </div>

            {/* Quick info card */}
            <div className="rounded-2xl border border-border-soft bg-surface-muted p-5">
              <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink-muted">
                Tour Info
              </h3>
              <div className="flex flex-col gap-2.5 text-[13px]">
                {dur && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Duration</span>
                    <span className="font-semibold text-ink">{dur}</span>
                  </div>
                )}
                {listing.coversCities.length > 0 && (
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0 text-ink-muted">Covers</span>
                    <span className="text-right font-semibold text-ink">
                      {listing.coversCities.join(", ")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-muted">Min group</span>
                  <span className="font-semibold text-ink">{listing.minGroupSize} person{listing.minGroupSize === 1 ? "" : "s"}</span>
                </div>
                {listing.advanceBookingHrs > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Book ahead</span>
                    <span className="font-semibold text-ink">{listing.advanceBookingHrs}h before</span>
                  </div>
                )}
                {listing.startTimes.length > 0 && (
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0 text-ink-muted">Start times</span>
                    <span className="text-right font-semibold text-ink">
                      {listing.startTimes.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
