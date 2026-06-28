"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError } from "@/lib/api";
import { customerClient, type CustomerEnquiry } from "@/lib/customerClient";

function listingTitle(e: CustomerEnquiry): string {
  return typeof e.listing === "string" ? "Activity" : e.listing.title ?? "Activity";
}
function listingSlug(e: CustomerEnquiry): string | undefined {
  return typeof e.listing === "string" ? undefined : e.listing.slug;
}

export default function SightseeingBookingsPage() {
  const [items, setItems] = useState<CustomerEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const enquiries = await customerClient.enquiries("sightseeing");
        if (active) setItems(enquiries);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) setNeedsAuth(true);
        else setError(err instanceof Error ? err.message : "Could not load your enquiries.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-[28px] font-extrabold">My SightSeeing Enquiries</h1>
        <p className="mt-1 text-[14px] text-ink-muted">Track the activities you’ve enquired about.</p>

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-sunken" />
              ))}
            </div>
          ) : needsAuth ? (
            <EmptyState
              title="Sign in to view your enquiries"
              subtitle="Your enquiries are saved to your account once you’re signed in."
              cta={<Link href="/auth"><Button variant="accent">Sign in</Button></Link>}
            />
          ) : error ? (
            <EmptyState title="Something went wrong" subtitle={error} />
          ) : items.length === 0 ? (
            <EmptyState
              title="No enquiries yet"
              subtitle="Browse activities and send an enquiry to get started."
              cta={<Link href="/sightseeing"><Button variant="accent">Browse activities</Button></Link>}
            />
          ) : (
            <ul className="space-y-3">
              {items.map((e) => {
                const slug = listingSlug(e);
                return (
                  <li key={e.id} className="rounded-2xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-bold text-ink">{listingTitle(e)}</p>
                        <p className="mt-1 text-[13px] text-ink-muted">
                          {e.pax.adults} adults · {e.pax.children} children
                          {e.travelDate ? ` · ${new Date(e.travelDate).toLocaleDateString()}` : ""}
                        </p>
                        <p className="mt-1 text-[12px] text-ink-muted">
                          Sent {new Date(e.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge tone="info" size="sm">{e.status}</Badge>
                        {slug ? (
                          <Link href={`/sightseeing/${slug}`} className="text-[13px] text-brand-600 hover:underline">
                            View activity
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    {e.message ? <p className="mt-3 text-[13px] text-ink-soft">{e.message}</p> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
