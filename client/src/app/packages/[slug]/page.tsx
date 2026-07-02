"use client";

import { use, useEffect, useMemo, useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/format";
import {
  getPackage,
  submitEnquiry,
  kindLabel,
  type PackageDetail,
  type PackageOffer,
  type PackageImage,
  type Operator,
} from "@/lib/packagesClient";

// Reference detail layout (matches the oyotours national-tour-details pattern):
// left column = gallery carousel → description → location map → tour calendar →
// itinerary → inclusions/exclusions → policies → gallery; right = sticky summary
// + package cost + "Booking Now" (enquiry) form. Themed with the site tokens.

function operatorName(offer: PackageOffer): string {
  const p = offer.partner as Operator;
  return (typeof p === "object" && (p.companyName || p.name)) || "Operator";
}

// ── Image carousel ──────────────────────────────────────────────────────────
function Carousel({ images, title }: { images: PackageImage[]; title: string }) {
  const [i, setI] = useState(0);
  const has = images.length > 0;
  const go = (d: number) => setI((prev) => (prev + d + images.length) % images.length);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-sunken shadow-(--shadow-sm)">
      {has ? (
        <img src={images[i].url} alt={images[i].caption ?? title} className="h-72 w-full object-cover sm:h-[460px]" />
      ) : (
        <div className="flex h-72 w-full items-center justify-center text-ink-muted sm:h-[460px]">No image</div>
      )}
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Previous image" onClick={() => go(-1)}
            className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55">‹</button>
          <button type="button" aria-label="Next image" onClick={() => go(1)}
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55">›</button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, idx) => (
              <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Section shell ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border-soft bg-surface-muted p-5 sm:p-6">
      <h2 className="mb-4 text-[17px] font-extrabold text-ink">{title}</h2>
      {children}
    </section>
  );
}

// ── Collapsible policy row ──────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border-soft bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="text-[14px] font-bold text-brand-700">{title}</span>
        <span className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && <div className="border-t border-border-soft px-4 py-3 text-[13px] leading-relaxed text-ink-soft">{children}</div>}
    </div>
  );
}

// ── Tour calendar (next 3 months; future dates enquirable at the from-price) ──
function monthCells(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1).getDay(); // 0 = Sun
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function TourCalendar({ price, onPick }: { price?: number | null; onPick: (iso: string) => void }) {
  const base = useMemo(() => new Date(), []);
  const months = useMemo(
    () => [0, 1, 2].map((m) => new Date(base.getFullYear(), base.getMonth() + m, 1)),
    [base],
  );
  const [tab, setTab] = useState(0);
  const active = months[tab];
  const cells = monthCells(active.getFullYear(), active.getMonth());
  const todayMid = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  const monthName = active.toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 border-b border-border-soft">
        {months.map((m, idx) => (
          <button key={idx} type="button" onClick={() => setTab(idx)}
            className={`px-4 py-2 text-[13px] font-semibold transition-colors ${tab === idx ? "border-b-2 border-accent-500 text-accent-600" : "text-ink-muted hover:text-ink"}`}>
            {m.toLocaleString("en-IN", { month: "long" })}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border-soft">
        <div className="bg-brand-700 py-2 text-center text-[13px] font-bold text-white">Tour Calendar — {monthName}</div>
        <div className="grid grid-cols-7 bg-brand-900/90 text-center text-[11px] font-bold text-white/90">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 bg-white">
          {cells.map((d, idx) => {
            if (d === null) return <div key={idx} className="min-h-16 border border-border-soft/60" />;
            const iso = `${active.getFullYear()}-${String(active.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isPast = new Date(active.getFullYear(), active.getMonth(), d).getTime() < todayMid;
            return (
              <button key={idx} type="button" disabled={isPast} onClick={() => onPick(iso)}
                className={`min-h-16 border border-border-soft/60 p-1.5 text-center transition-colors ${isPast ? "cursor-not-allowed text-ink-subtle" : "hover:bg-accent-50"}`}>
                <div className="text-[13px] font-semibold text-ink">{String(d).padStart(2, "0")}</div>
                {!isPast && (
                  <>
                    <div className="mx-auto my-1 h-0.5 w-6 rounded bg-success-500" />
                    <div className="text-[10px] font-bold text-success-700">{price ? formatINR(price) : "Enquire"}</div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-ink-muted">Pick an available date to start your enquiry for that departure.</p>
    </div>
  );
}

export default function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const toast = useToast();
  const [data, setData] = useState<{ item: PackageDetail; offers: PackageOffer[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking / enquiry form state (right sidebar).
  const [offerId, setOfferId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPackage(slug)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        // Default to the cheapest operator offer.
        const cheapest = [...res.offers].sort((a, b) => a.price - b.price)[0];
        if (cheapest) setOfferId(cheapest.id);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load package"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const submit = async () => {
    if (!data) return;
    if (data.offers.length === 0) { toast.push({ title: "No operators available yet", tone: "warn" }); return; }
    if (!offerId) { toast.push({ title: "Select an operator", tone: "warn" }); return; }
    if (!name.trim()) { toast.push({ title: "Enter your name", tone: "warn" }); return; }
    if (!phone.trim()) { toast.push({ title: "Enter your phone number", tone: "warn" }); return; }
    setSubmitting(true);
    try {
      await submitEnquiry(slug, {
        offerId,
        contact: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
        travelDate: checkIn || undefined,
        pax: { adults: Number(adults) || 1, children: Number(children) || 0, infants: 0 },
        message: [message.trim(), checkOut ? `Check-out: ${checkOut}` : ""].filter(Boolean).join(" · ") || undefined,
      });
      toast.push({ title: "Enquiry sent!", description: "The operator and our team will contact you shortly.", tone: "success" });
      setName(""); setPhone(""); setEmail(""); setMessage(""); setCheckIn(""); setCheckOut("");
    } catch (e) {
      toast.push({ title: "Could not send enquiry", description: e instanceof Error ? e.message : "Please try again.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && <div className="h-96 animate-pulse rounded-2xl bg-border-soft/60" />}
        {error && <p className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-[14px] text-danger-700">{error}</p>}

        {data && (() => {
          const pkg = data.item;
          const gallery: PackageImage[] = pkg.images?.length ? pkg.images : (pkg.thumbnail ? [{ url: pkg.thumbnail }] : []);
          const duration = pkg.route.durationDays > 0 ? `${pkg.route.durationNights} Night ${pkg.route.durationDays} Days` : undefined;
          const fromPrice = pkg.fromPrice ?? pkg.referencePrice ?? null;
          const mapQuery = encodeURIComponent(pkg.route.destinations[0] || pkg.route.origin || pkg.title);
          const cancellation = typeof pkg.specs?.cancellationPolicy === "string" ? pkg.specs.cancellationPolicy : "";
          const terms = typeof pkg.specs?.terms === "string" ? pkg.specs.terms : "";
          const documents = typeof pkg.specs?.documents === "string" ? pkg.specs.documents : "";

          return (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
              {/* ── Left column ── */}
              <div className="flex flex-col gap-6">
                <Carousel images={gallery} title={pkg.title} />

                {/* Description */}
                <Section title="Description">
                  <span className="mb-3 inline-block w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                    {kindLabel(pkg.kind, pkg.scope)}
                  </span>
                  {pkg.description
                    ? <p className="text-[14px] leading-relaxed text-ink-soft">{pkg.description}</p>
                    : <p className="text-[14px] text-ink-muted">No description provided.</p>}
                  {pkg.highlights.length > 0 && (
                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {pkg.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-[13px] text-ink-soft"><span className="mt-0.5 text-success-500">✓</span> {h}</li>
                      ))}
                    </ul>
                  )}
                </Section>

                {/* Bundle components */}
                {pkg.kind === "bundle" && pkg.components.length > 0 && (
                  <Section title="What's in this bundle">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {pkg.components.map((c, i) => (
                        <div key={`${c.title}-${i}`} className="flex items-start justify-between gap-3 rounded-xl border border-border-soft bg-white p-4">
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-ink">{c.title}{c.quantity > 1 && <span className="text-ink-muted"> × {c.quantity}</span>}</p>
                            <span className="mt-0.5 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">{c.category}</span>
                            {c.description && <p className="mt-1 text-[12px] text-ink-soft">{c.description}</p>}
                          </div>
                          <span className={`shrink-0 text-[11px] font-bold ${c.included ? "text-success-600" : "text-ink-muted"}`}>{c.included ? "Included" : "Add-on"}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Location */}
                {(pkg.route.destinations.length > 0 || pkg.route.origin) && (
                  <Section title="Location">
                    <div className="overflow-hidden rounded-xl border border-border-soft">
                      <iframe
                        title="Map"
                        src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
                        className="h-72 w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    {pkg.route.destinations.length > 0 && (
                      <p className="mt-2 text-[13px] text-ink-soft">📍 {pkg.route.destinations.join(" · ")}</p>
                    )}
                  </Section>
                )}

                {/* Tour calendar */}
                <Section title="Tour Calendar">
                  <TourCalendar
                    price={fromPrice}
                    onPick={(iso) => {
                      setCheckIn(iso);
                      toast.push({ title: "Date selected", description: "Complete the Booking Now form to send your enquiry.", tone: "info" });
                      if (typeof document !== "undefined") document.getElementById("booking-now")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  />
                </Section>

                {/* Itinerary */}
                {pkg.itinerary.length > 0 && (
                  <Section title="Itinerary">
                    <div className="flex flex-col gap-4">
                      {pkg.itinerary.map((d) => (
                        <div key={d.day} className="rounded-xl border border-border-soft bg-white">
                          <div className="flex items-stretch gap-3 border-l-4 border-success-500 bg-brand-50/60 px-4 py-2.5">
                            <p className="text-[14px] font-bold text-ink">Day {String(d.day).padStart(2, "0")}{d.title ? ` — ${d.title}` : ""}</p>
                          </div>
                          {(d.description || d.activities.length > 0 || d.accommodation) && (
                            <div className="px-4 py-3">
                              {d.description && <p className="text-[13px] leading-relaxed text-ink-soft">{d.description}</p>}
                              {d.activities.length > 0 && <p className="mt-2 text-[12px] text-ink-muted">🎯 {d.activities.join(" · ")}</p>}
                              {d.accommodation && <p className="mt-1 text-[12px] text-ink-muted">🏨 {d.accommodation}</p>}
                              {(d.meals.breakfast || d.meals.lunch || d.meals.dinner) && (
                                <p className="mt-1 text-[12px] text-ink-muted">🍽 {[d.meals.breakfast && "Breakfast", d.meals.lunch && "Lunch", d.meals.dinner && "Dinner"].filter(Boolean).join(", ")}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Inclusions / Exclusions */}
                {(pkg.inclusions.length > 0 || pkg.exclusions.length > 0) && (
                  <div className="grid gap-6 rounded-2xl border border-border-soft bg-surface-muted p-5 sm:grid-cols-2 sm:p-6">
                    <div>
                      <h3 className="mb-3 text-[16px] font-extrabold text-ink">Inclusions</h3>
                      <ul className="flex flex-col gap-2">
                        {pkg.inclusions.length ? pkg.inclusions.map((i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-ink-soft">
                            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded bg-success-500 text-[10px] font-bold text-white">✓</span> {i}
                          </li>
                        )) : <li className="text-[13px] text-ink-muted">—</li>}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-3 text-[16px] font-extrabold text-ink">Exclusions</h3>
                      <ul className="flex flex-col gap-2">
                        {pkg.exclusions.length ? pkg.exclusions.map((i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-ink-soft">
                            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded bg-danger-500 text-[10px] font-bold text-white">✕</span> {i}
                          </li>
                        )) : <li className="text-[13px] text-ink-muted">—</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Policies */}
                <Section title="Policies & Terms">
                  <div className="flex flex-col gap-3">
                    <Accordion title={`Documents for ${pkg.scope === "international" ? "International" : "National"} tours`}>
                      {documents || "Carry a valid government photo ID for every traveller. For international trips, a passport valid for at least 6 months and applicable visas are required."}
                    </Accordion>
                    <Accordion title="Tour Cancellation Policy — if the package is cancelled by client">
                      {cancellation || "Cancellation charges apply as per the operator's policy and depend on how far in advance the cancellation is made. The operator will confirm exact charges on your enquiry."}
                    </Accordion>
                    <Accordion title="Terms & Conditions">
                      {terms || "Prices are indicative and confirmed by the operator on enquiry. Rooms and services are subject to availability at the time of booking."}
                    </Accordion>
                  </div>
                </Section>

                {/* Gallery (mandatory images) */}
                <Section title="Tour Gallery">
                  {gallery.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {gallery.map((img, i) => (
                        <img key={i} src={img.url} alt={img.caption ?? `${pkg.title} ${i + 1}`} className="h-32 w-full rounded-xl object-cover sm:h-40" loading="lazy" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-ink-muted">No gallery images available.</p>
                  )}
                </Section>
              </div>

              {/* ── Right sidebar ── */}
              <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
                {/* Summary */}
                <div className="rounded-2xl border border-border-soft bg-surface-muted p-5">
                  <h1 className="text-[20px] font-extrabold text-brand-700">{pkg.title}</h1>
                  {duration && <p className="mt-0.5 text-[13px] font-semibold text-accent-600">{duration}</p>}
                  {fromPrice != null && (
                    <>
                      <p className="mt-2 text-[26px] font-extrabold leading-none text-brand-600">{formatINR(fromPrice)}/-</p>
                      <p className="text-[13px] text-ink-muted">Per Person (from)</p>
                    </>
                  )}
                </div>

                {/* Package cost — operator offers */}
                {data.offers.length > 0 && (
                  <div className="overflow-hidden rounded-2xl bg-brand-700 text-white">
                    <div className="px-5 py-3 text-[15px] font-extrabold tracking-wide">PACKAGE COST</div>
                    <div className="flex flex-col">
                      {[...data.offers].sort((a, b) => a.price - b.price).map((o) => (
                        <div key={o.id} className="flex items-center justify-between gap-3 border-t border-white/15 px-5 py-2.5 text-[13px]">
                          <span className="min-w-0 truncate text-white/90">{operatorName(o)}{o.perPerson ? " · per person" : " · total"}</span>
                          <span className="shrink-0 font-bold">{formatINR(o.price)}/-</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Now (enquiry) */}
                <div id="booking-now" className="rounded-2xl border border-border-soft bg-white p-5 shadow-(--shadow-sm)">
                  <h2 className="mb-3 text-[17px] font-extrabold text-ink">Booking Now</h2>
                  <div className="flex flex-col gap-3">
                    <input value={pkg.title} readOnly className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-[13px] font-semibold text-brand-700" />

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-muted">Check In
                        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink focus:border-brand-500 focus:outline-none" />
                      </label>
                      <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-muted">Check Out
                        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink focus:border-brand-500 focus:outline-none" />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-muted">Adults
                        <input type="number" min={1} value={adults} onChange={(e) => setAdults(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink focus:border-brand-500 focus:outline-none" />
                      </label>
                      <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-muted">Children (2–12 Yrs)
                        <input type="number" min={0} value={children} onChange={(e) => setChildren(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink focus:border-brand-500 focus:outline-none" />
                      </label>
                    </div>

                    {data.offers.length > 1 && (
                      <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-muted">Operator
                        <select value={offerId} onChange={(e) => setOfferId(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink focus:border-brand-500 focus:outline-none">
                          {[...data.offers].sort((a, b) => a.price - b.price).map((o) => (
                            <option key={o.id} value={o.id}>{operatorName(o)} — {formatINR(o.price)}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none" />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none" />
                        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="rounded-lg border border-border px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none" />
                      </div>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Message (optional)" className="resize-none rounded-lg border border-border px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none" />
                    </div>

                    <button type="button" onClick={submit} disabled={submitting || data.offers.length === 0}
                      className="mt-1 w-full rounded-lg bg-accent-500 py-3 text-[14px] font-extrabold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60">
                      {submitting ? "Sending…" : data.offers.length === 0 ? "No operators yet" : "Book Now"}
                    </button>
                    <p className="text-center text-[11px] text-ink-muted">Enquiry only — the operator confirms price &amp; availability.</p>
                  </div>
                </div>
              </aside>
            </div>
          );
        })()}
      </main>
      <Footer />
    </div>
  );
}
