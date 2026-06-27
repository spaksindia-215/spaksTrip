"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import ErrorState from "@/components/ui/ErrorState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { partnerClient, type HotelListingDetail } from "@/lib/partnerClient";

const HOTEL_TYPES = ["hotel", "resort", "villa", "homestay", "apartment", "guest_house"];
const STAR_RATINGS = ["1", "2", "3", "3.5", "4", "4.5", "5"];
const CURRENCIES = ["INR", "USD", "EUR", "AED", "GBP"];

type FormState = {
  name: string;
  description: string;
  type: string;
  starRating: string;
  amenities: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  checkIn: string;
  checkOut: string;
  cancellation: string;
  basePricePerNight: string;
  taxPercentage: string;
  currency: string;
};

function toForm(h: HotelListingDetail): FormState {
  return {
    name: h.name ?? "",
    description: h.description ?? "",
    type: h.type ?? "hotel",
    starRating: h.starRating != null ? String(h.starRating) : "",
    amenities: (h.amenities ?? []).join(", "),
    street: h.address?.street ?? "",
    city: h.address?.city ?? "",
    state: h.address?.state ?? "",
    country: h.address?.country ?? "",
    postalCode: h.address?.postalCode ?? "",
    phone: h.contact?.phone ?? "",
    email: h.contact?.email ?? "",
    checkIn: h.policies?.checkIn ?? "",
    checkOut: h.policies?.checkOut ?? "",
    cancellation: h.policies?.cancellation ?? "",
    basePricePerNight: h.pricing?.basePricePerNight != null ? String(h.pricing.basePricePerNight) : "",
    taxPercentage: h.pricing?.taxPercentage != null ? String(h.pricing.taxPercentage) : "",
    currency: h.pricing?.currency ?? "INR",
  };
}

export default function PartnerHotelEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [listing, setListing] = useState<HotelListingDetail | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const item = await partnerClient.hotels.get(id);
        if (active) {
          setListing(item);
          setForm(toForm(item));
        }
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Unable to load this listing.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!form) return;
    if (!form.name.trim()) {
      toast.push({ title: "Name is required", tone: "warn" });
      return;
    }
    if (!form.city.trim()) {
      toast.push({ title: "City is required", tone: "warn" });
      return;
    }
    const basePrice = Number(form.basePricePerNight);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      toast.push({ title: "Enter a valid base price per night", tone: "warn" });
      return;
    }
    setSaving(true);
    try {
      const updated = await partnerClient.hotels.update(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        starRating: form.starRating ? Number(form.starRating) : undefined,
        amenities: form.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          country: form.country.trim(),
          postalCode: form.postalCode.trim(),
        },
        contact: { phone: form.phone.trim(), email: form.email.trim() },
        policies: {
          checkIn: form.checkIn.trim(),
          checkOut: form.checkOut.trim(),
          cancellation: form.cancellation.trim(),
        },
        pricing: {
          basePricePerNight: basePrice,
          taxPercentage: form.taxPercentage ? Number(form.taxPercentage) : 0,
          currency: form.currency,
        },
      });
      setListing(updated);
      toast.push({ title: "Changes saved", tone: "success" });
    } catch (err) {
      toast.push({
        title: "Save failed",
        description: err instanceof ApiError ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      const updated = await partnerClient.hotels.submit(id);
      setListing(updated);
      toast.push({
        title: "Submitted for review",
        description: "Your listing is now pending admin approval.",
        tone: "success",
      });
      router.push("/partner/hotels");
    } catch (err) {
      toast.push({
        title: "Could not submit",
        description: err instanceof ApiError ? err.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-9 w-64 animate-pulse rounded-md bg-surface-sunken" />
        <div className="h-96 animate-pulse rounded-md bg-surface-sunken" />
      </div>
    );
  }

  if (error || !form || !listing) {
    return <ErrorState message={error ?? "Listing not found."} onRetry={reload} />;
  }

  const canSubmit = listing.status === "draft" || listing.status === "paused" || listing.status === "suspended";
  const images = (listing.images ?? []).map((i) => i.url).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/partner/hotels" className="text-sm text-ink-muted hover:underline">
            ← My Hotels
          </Link>
          <h1 className="text-xxl font-semibold text-ink">{listing.name}</h1>
          <StatusBadge status={listing.status} />
        </div>
        <div className="flex gap-2">
          {canSubmit && (
            <Button variant="primary" size="sm" loading={submitting} onClick={handleSubmitForReview}>
              Submit for review
            </Button>
          )}
          <Button variant="accent" size="sm" loading={saving} onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border-soft bg-white p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Property details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="name" label="Hotel name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Select id="type" label="Property type" value={form.type} onChange={(e) => set("type", e.target.value)}>
            {HOTEL_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </Select>
          <Select id="star" label="Star rating" value={form.starRating} onChange={(e) => set("starRating", e.target.value)}>
            <option value="">Unrated</option>
            {STAR_RATINGS.map((s) => (
              <option key={s} value={s}>{s} star</option>
            ))}
          </Select>
          <Input id="amenities" label="Amenities (comma separated)" value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="WiFi, Pool, Parking" />
        </div>
        <div className="mt-4">
          <Textarea id="description" label="Description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border border-border-soft bg-white p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="street" label="Street / area" value={form.street} onChange={(e) => set("street", e.target.value)} />
          <Input id="city" label="City" value={form.city} onChange={(e) => set("city", e.target.value)} hint="Must match the city travellers search by." />
          <Input id="state" label="State" value={form.state} onChange={(e) => set("state", e.target.value)} />
          <Input id="country" label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} />
          <Input id="postalCode" label="Postal code" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border border-border-soft bg-white p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Contact & policies</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="phone" label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input id="checkIn" label="Check-in time" value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} placeholder="14:00" />
          <Input id="checkOut" label="Check-out time" value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} placeholder="11:00" />
        </div>
        <div className="mt-4">
          <Textarea id="cancellation" label="Cancellation policy" rows={2} value={form.cancellation} onChange={(e) => set("cancellation", e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border border-border-soft bg-white p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="basePrice" label="Base price / night" type="number" inputMode="numeric" value={form.basePricePerNight} onChange={(e) => set("basePricePerNight", e.target.value)} />
          <Input id="tax" label="Tax %" type="number" inputMode="numeric" value={form.taxPercentage} onChange={(e) => set("taxPercentage", e.target.value)} />
          <Select id="currency" label="Currency" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border-soft bg-white p-6">
        <h2 className="mb-1 text-[15px] font-semibold text-ink">Photos & rooms</h2>
        <p className="mb-4 text-[13px] text-ink-muted">
          {listing.rooms?.length ?? 0} room type(s) · {images.length} photo(s). Rooms and photos are
          managed in the listing wizard — re-add them from{" "}
          <Link href="/partner/hotels/new" className="text-brand-700 hover:underline">Add hotel</Link>{" "}
          if you need to change them.
        </p>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.slice(0, 8).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="h-20 w-28 rounded-lg object-cover" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
