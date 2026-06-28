"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { servicePublicApi, type ServiceModuleConfig, type ServiceListingApi } from "@/lib/serviceModules";

function operatorName(item: ServiceListingApi): string {
  const p = item.partner;
  if (typeof p === "object" && p) return p.companyName || p.name || "Operator";
  return "Operator";
}

export default function ServiceDetailPage({ config, slug }: { config: ServiceModuleConfig; slug: string }) {
  const apiClient = servicePublicApi(config);
  const toast = useToast();
  const [item, setItem] = useState<ServiceListingApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiClient.get(slug);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function submitEnquiry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.push({ title: "Name and phone are required", tone: "warn" });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.enquire(slug, {
        contact: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
        travelDate: travelDate || undefined,
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
        <main className="mx-auto max-w-6xl px-6 py-12"><div className="h-80 animate-pulse rounded-2xl bg-surface-sunken" /></main>
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
            title="Not available"
            subtitle="This listing may have been removed or is not yet live."
            cta={<Link href={config.detailBase.startsWith("/visa") ? "/visa/pr-visa" : config.detailBase}><Button variant="accent">Browse {config.plural.toLowerCase()}</Button></Link>}
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
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            {item.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
                {item.images.slice(0, 4).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img.url} alt={item.title} className={`h-48 w-full object-cover ${item.images.length === 1 ? "col-span-2 h-72" : ""}`} />
                ))}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-surface-muted text-ink-muted">No image</div>
            )}

            <div>
              <span className="inline-block rounded-full bg-accent-50 px-2.5 py-0.5 text-[11px] font-semibold text-accent-700">{config.label}</span>
              <h1 className="mt-2 text-[26px] font-extrabold">{item.title}</h1>
              <p className="mt-1 text-[13px] text-ink-muted">By {operatorName(item)}</p>
            </div>

            {item.description ? <p className="text-[14px] leading-relaxed text-ink-soft">{item.description}</p> : null}

            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((t, i) => (
                  <span key={i} className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[12px] text-ink-soft">{t}</span>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
              {submitted ? (
                <div className="text-center">
                  <p className="text-[15px] font-bold text-ink">Enquiry sent ✓</p>
                  <p className="mt-1 text-[13px] text-ink-muted">{operatorName(item)} will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={submitEnquiry} className="space-y-3">
                  <p className="text-[15px] font-bold text-ink">Enquire now</p>
                  <Input id="e-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input id="e-phone" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Input id="e-email" label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input id="e-date" label="Preferred date" type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
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
