"use client";

import { use, useEffect, useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import OperatorEnquiryModal from "@/components/holiday-packages/OperatorEnquiryModal";
import { formatINR } from "@/lib/format";
import {
  getPackage,
  kindLabel,
  type PackageDetail,
  type PackageOffer,
  type Operator,
} from "@/lib/packagesClient";

function operatorName(offer: PackageOffer): string {
  const p = offer.partner as Operator;
  return (typeof p === "object" && (p.companyName || p.name)) || "Operator";
}

function OperatorRow({ offer, onEnquire }: { offer: PackageOffer; onEnquire: (o: PackageOffer) => void }) {
  const c = offer.directContact;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-ink">{operatorName(offer)}</p>
        {offer.pricingNote && <p className="text-[12px] text-ink-muted">{offer.pricingNote}</p>}
        {offer.showDirectContact && c && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-ink-soft">
            {c.phone && <a href={`tel:${c.phone}`} className="hover:text-brand-600">📞 {c.phone}</a>}
            {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:text-brand-600">WhatsApp</a>}
            {c.email && <a href={`mailto:${c.email}`} className="hover:text-brand-600">{c.email}</a>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[18px] font-extrabold leading-tight text-ink">{formatINR(offer.price)}</p>
          <p className="text-[11px] text-ink-muted">{offer.perPerson ? "per person" : "total"}</p>
        </div>
        <button
          type="button"
          onClick={() => onEnquire(offer)}
          className="rounded-lg bg-accent-500 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-accent-600"
        >
          Enquire
        </button>
      </div>
    </div>
  );
}

export default function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<{ item: PackageDetail; offers: PackageOffer[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enquiryOffer, setEnquiryOffer] = useState<PackageOffer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPackage(slug)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load package"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const openEnquiry = (o: PackageOffer) => { setEnquiryOffer(o); setModalOpen(true); };

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && <div className="h-96 animate-pulse rounded-2xl bg-border-soft/60" />}
        {error && <p className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-[14px] text-danger-700">{error}</p>}

        {data && (() => {
          const pkg = data.item;
          const hero = pkg.thumbnail ?? pkg.images?.[0]?.url;
          const duration = pkg.route.durationDays > 0 ? `${pkg.route.durationNights}N / ${pkg.route.durationDays}D` : undefined;
          return (
            <div className="flex flex-col gap-8">
              {/* Hero */}
              <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="overflow-hidden rounded-2xl">
                  {hero ? (
                    <img src={hero} alt={pkg.title} className="h-72 w-full object-cover sm:h-96" />
                  ) : (
                    <div className="flex h-72 w-full items-center justify-center bg-surface-muted text-ink-muted sm:h-96">No image</div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <span className="w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                    {kindLabel(pkg.kind, pkg.scope)}
                  </span>
                  <h1 className="text-[26px] font-extrabold leading-tight">{pkg.title}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-ink-muted">
                    {duration && <span>🗓 {duration}</span>}
                    {pkg.route.destinations.length > 0 && <span>📍 {pkg.route.destinations.join(" · ")}</span>}
                  </div>
                  {pkg.description && <p className="text-[14px] leading-relaxed text-ink-soft">{pkg.description}</p>}
                  {pkg.highlights.length > 0 && (
                    <ul className="mt-1 flex flex-col gap-1.5">
                      {pkg.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-[13px] text-ink-soft">
                          <span className="mt-0.5 text-success-500">✓</span> {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* Operators */}
              <section className="flex flex-col gap-3">
                <h2 className="text-[18px] font-bold">
                  Operators {data.offers.length > 0 && <span className="text-ink-muted">({data.offers.length})</span>}
                </h2>
                {data.offers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                    <p className="text-[14px] font-semibold text-ink">No operators have priced this package yet</p>
                    <p className="mt-1 text-[13px] text-ink-muted">Check back soon, or contact us to be matched with an operator.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {data.offers.map((o) => (
                      <OperatorRow key={o.id} offer={o} onEnquire={openEnquiry} />
                    ))}
                  </div>
                )}
              </section>

              {/* Itinerary */}
              {pkg.itinerary.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-[18px] font-bold">Itinerary</h2>
                  <ol className="flex flex-col gap-3">
                    {pkg.itinerary.map((d) => (
                      <li key={d.day} className="rounded-xl border border-border-soft bg-white p-4">
                        <p className="text-[14px] font-bold text-ink">Day {d.day}{d.title ? ` · ${d.title}` : ""}</p>
                        {d.description && <p className="mt-1 text-[13px] text-ink-soft">{d.description}</p>}
                        {d.activities.length > 0 && (
                          <p className="mt-1 text-[12px] text-ink-muted">{d.activities.join(" · ")}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Inclusions / exclusions */}
              {(pkg.inclusions.length > 0 || pkg.exclusions.length > 0) && (
                <section className="grid gap-6 sm:grid-cols-2">
                  {pkg.inclusions.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-[15px] font-bold">Inclusions</h3>
                      <ul className="flex flex-col gap-1.5">
                        {pkg.inclusions.map((i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-ink-soft"><span className="mt-0.5 text-success-500">✓</span> {i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pkg.exclusions.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-[15px] font-bold">Exclusions</h3>
                      <ul className="flex flex-col gap-1.5">
                        {pkg.exclusions.map((i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-ink-soft"><span className="mt-0.5 text-danger-500">✕</span> {i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              <OperatorEnquiryModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                slug={slug}
                packageTitle={pkg.title}
                offer={enquiryOffer}
              />
            </div>
          );
        })()}
      </main>
      <Footer />
    </div>
  );
}
