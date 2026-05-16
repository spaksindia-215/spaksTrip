"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  createEmptyTaxiListingDraft,
  createTaxiListingFromDraft,
  serializeFiles,
  upsertTaxiListing,
  validateTaxiListingDraft,
} from "@/lib/taxiListing";
import { cn } from "@/lib/cn";
import {
  TAXI_AMENITIES,
  TAXI_AVAILABLE_DAYS,
  TAXI_FUEL_TYPES,
  TAXI_TIME_SLOTS,
  TAXI_TRANSMISSION_TYPES,
  TAXI_VEHICLE_TYPES,
  type TaxiAvailableDay,
  type TaxiListingDraft,
  type TaxiListingDraftKey,
  type TaxiListingErrors,
  type TaxiTimeSlot,
} from "@/types/taxiListing";

type SelectionFieldProps = {
  title: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

const PAGE_HIGHLIGHTS = [
  "Get discovered by travelers booking outstation, airport, and sightseeing rides.",
  "Manage your listed taxis with flexible availability and booking request visibility.",
  "Keep submissions fully separate from the current customer taxi booking experience.",
];

export default function TaxiListingForm() {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<TaxiListingDraft>(() => createEmptyTaxiListingDraft());
  const [errors, setErrors] = useState<TaxiListingErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  useEffect(() => {
    if (!submittedName) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/partner/my-taxis");
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [router, submittedName]);

  function setField<Key extends TaxiListingDraftKey>(key: Key, value: TaxiListingDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      return { ...current, [key]: undefined };
    });
  }

  function toggleAvailableDay(day: TaxiAvailableDay) {
    const next = draft.availableDays.includes(day)
      ? draft.availableDays.filter((item) => item !== day)
      : [...draft.availableDays, day];

    setField("availableDays", next);
  }

  function toggleTimeSlot(slot: TaxiTimeSlot) {
    const next = draft.availableTimeSlots.includes(slot)
      ? draft.availableTimeSlots.filter((item) => item !== slot)
      : [...draft.availableTimeSlots, slot];

    setField("availableTimeSlots", next);
  }

  function toggleAmenity(amenity: string) {
    const next = draft.amenities.includes(amenity)
      ? draft.amenities.filter((item) => item !== amenity)
      : [...draft.amenities, amenity];

    setField("amenities", next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateTaxiListingDraft(draft);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.push({
        title: "Please review the form",
        description: "Some required taxi listing details still need attention.",
        tone: "warn",
      });
      return;
    }

    setSubmitting(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      const listing = createTaxiListingFromDraft(draft);
      upsertTaxiListing(listing);
      setSubmittedName(listing.fullName);
      toast.push({
        title: "Taxi listing submitted",
        description: "Redirecting you to your taxi dashboard.",
        tone: "success",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedName) {
    return (
      <section className="rounded-[28px] border border-border-soft bg-white p-8 text-center shadow-(--shadow-md) sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-600">
          <svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="mt-5 text-2xl font-black text-ink">Listing submitted successfully</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-muted">
          Thanks, {submittedName}. Your taxi details have been saved and you&apos;ll be taken to
          `/partner/my-taxis` to review availability and booking requests.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/partner/my-taxis"
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Go to My Taxis
          </Link>
          <button
            type="button"
            onClick={() => {
              setDraft(createEmptyTaxiListingDraft());
              setErrors({});
              setSubmittedName("");
            }}
            className="inline-flex items-center justify-center rounded-xl border border-border-soft px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
          >
            Submit another taxi
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-[28px] border border-border-soft bg-white p-6 shadow-(--shadow-xs) sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            Owner Information
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              id="taxi-owner-name"
              label="Full Name"
              value={draft.fullName}
              onChange={(event) => setField("fullName", event.target.value)}
              error={errors.fullName}
              placeholder="Enter owner name"
            />
            <Input
              id="taxi-owner-mobile"
              label="Mobile Number"
              value={draft.mobileNumber}
              onChange={(event) => setField("mobileNumber", event.target.value)}
              error={errors.mobileNumber}
              placeholder="+91 98765 43210"
            />
            <Input
              id="taxi-owner-email"
              label="Email Address"
              type="email"
              value={draft.emailAddress}
              onChange={(event) => setField("emailAddress", event.target.value)}
              error={errors.emailAddress}
              placeholder="name@example.com"
            />
            <Input
              id="taxi-owner-business"
              label="Business Name"
              value={draft.businessName}
              onChange={(event) => setField("businessName", event.target.value)}
              placeholder="Optional business name"
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-border-soft bg-white p-6 shadow-(--shadow-xs) sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            Vehicle Details
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SelectField
              id="taxi-vehicle-type"
              label="Vehicle Type"
              value={draft.vehicleType}
              onChange={(event) => setField("vehicleType", event.target.value as TaxiListingDraft["vehicleType"])}
              error={errors.vehicleType}
            >
              <option value="">Select vehicle type</option>
              {TAXI_VEHICLE_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
            <Input
              id="taxi-brand"
              label="Brand"
              value={draft.brand}
              onChange={(event) => setField("brand", event.target.value)}
              error={errors.brand}
              placeholder="Toyota"
            />
            <Input
              id="taxi-model"
              label="Model"
              value={draft.model}
              onChange={(event) => setField("model", event.target.value)}
              error={errors.model}
              placeholder="Innova Crysta"
            />
            <Input
              id="taxi-registration-number"
              label="Registration Number"
              value={draft.registrationNumber}
              onChange={(event) => setField("registrationNumber", event.target.value.toUpperCase())}
              error={errors.registrationNumber}
              placeholder="DL01AB1234"
            />
            <Input
              id="taxi-seating-capacity"
              label="Seating Capacity"
              type="number"
              value={draft.seatingCapacity}
              onChange={(event) => setField("seatingCapacity", event.target.value)}
              error={errors.seatingCapacity}
              placeholder="4"
              min="1"
            />
            <SelectField
              id="taxi-fuel-type"
              label="Fuel Type"
              value={draft.fuelType}
              onChange={(event) => setField("fuelType", event.target.value as TaxiListingDraft["fuelType"])}
              error={errors.fuelType}
            >
              <option value="">Select fuel type</option>
              {TAXI_FUEL_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="taxi-transmission"
              label="Transmission"
              value={draft.transmission}
              onChange={(event) =>
                setField("transmission", event.target.value as TaxiListingDraft["transmission"])
              }
              error={errors.transmission}
            >
              <option value="">Select transmission</option>
              {TAXI_TRANSMISSION_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
            <Input
              id="taxi-luggage-capacity"
              label="Luggage Capacity"
              type="number"
              value={draft.luggageCapacity}
              onChange={(event) => setField("luggageCapacity", event.target.value)}
              error={errors.luggageCapacity}
              placeholder="3"
              min="0"
            />
            <Input
              id="taxi-year"
              label="Year of Manufacture"
              type="number"
              value={draft.yearOfManufacture}
              onChange={(event) => setField("yearOfManufacture", event.target.value)}
              error={errors.yearOfManufacture}
              placeholder="2022"
              min="1990"
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <ChoiceBoolean
              title="AC Available"
              value={draft.acAvailable}
              trueLabel="Yes"
              falseLabel="No"
              onChange={(value) => setField("acAvailable", value)}
            />
            <ChoiceBoolean
              title="Driver Included"
              value={draft.driverIncluded}
              trueLabel="Included"
              falseLabel="Not Included"
              onChange={(value) => setField("driverIncluded", value)}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-border-soft bg-white p-6 shadow-(--shadow-xs) sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            Service Details
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              id="taxi-operating-city"
              label="Operating City"
              value={draft.operatingCity}
              onChange={(event) => setField("operatingCity", event.target.value)}
              error={errors.operatingCity}
              placeholder="Delhi"
            />
            <Input
              id="taxi-minimum-fare"
              label="Minimum Fare"
              type="number"
              value={draft.minimumFare}
              onChange={(event) => setField("minimumFare", event.target.value)}
              error={errors.minimumFare}
              placeholder="1800"
              min="1"
            />
            <Input
              id="taxi-price-per-km"
              label="Price Per KM"
              type="number"
              value={draft.pricePerKm}
              onChange={(event) => setField("pricePerKm", event.target.value)}
              error={errors.pricePerKm}
              placeholder="16"
              min="1"
            />
            <ChoiceBoolean
              title="Self Drive Available"
              value={draft.selfDriveAvailable}
              trueLabel="Available"
              falseLabel="No"
              onChange={(value) => setField("selfDriveAvailable", value)}
            />
          </div>
          <div className="mt-4 grid gap-4">
            <TextAreaField
              id="taxi-service-areas"
              label="Service Areas"
              value={draft.serviceAreas}
              onChange={(event) => setField("serviceAreas", event.target.value)}
              error={errors.serviceAreas}
              rows={3}
              placeholder="Add areas separated by commas, e.g. Delhi, Noida, Gurgaon"
            />
            <TextAreaField
              id="taxi-available-routes"
              label="Available Routes"
              value={draft.availableRoutes}
              onChange={(event) => setField("availableRoutes", event.target.value)}
              error={errors.availableRoutes}
              rows={3}
              placeholder="Add routes separated by commas, e.g. Delhi to Agra, Delhi Airport to Jaipur"
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-border-soft bg-white p-6 shadow-(--shadow-xs) sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            Document Uploads
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FileField
              id="taxi-rc-book"
              label="RC Book"
              accept=".pdf,.jpg,.jpeg,.png"
              fileName={draft.rcBook?.name}
              error={errors.rcBook}
              onChange={(event) => setField("rcBook", serializeFiles(event.target.files)[0] ?? null)}
            />
            <FileField
              id="taxi-insurance"
              label="Insurance"
              accept=".pdf,.jpg,.jpeg,.png"
              fileName={draft.insurance?.name}
              error={errors.insurance}
              onChange={(event) =>
                setField("insurance", serializeFiles(event.target.files)[0] ?? null)
              }
            />
            <FileField
              id="taxi-pollution"
              label="Pollution Certificate"
              accept=".pdf,.jpg,.jpeg,.png"
              fileName={draft.pollutionCertificate?.name}
              error={errors.pollutionCertificate}
              onChange={(event) =>
                setField("pollutionCertificate", serializeFiles(event.target.files)[0] ?? null)
              }
            />
            <FileField
              id="taxi-driving-license"
              label="Driving License"
              accept=".pdf,.jpg,.jpeg,.png"
              fileName={draft.drivingLicense?.name}
              error={errors.drivingLicense}
              onChange={(event) =>
                setField("drivingLicense", serializeFiles(event.target.files)[0] ?? null)
              }
            />
          </div>
          <div className="mt-4">
            <FileField
              id="taxi-vehicle-photos"
              label="Vehicle Photos"
              accept="image/*"
              multiple
              fileName={
                draft.vehiclePhotos.length > 0
                  ? `${draft.vehiclePhotos.length} photo${draft.vehiclePhotos.length > 1 ? "s" : ""} selected`
                  : undefined
              }
              error={errors.vehiclePhotos}
              onChange={(event) => setField("vehiclePhotos", serializeFiles(event.target.files))}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-border-soft bg-white p-6 shadow-(--shadow-xs) sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            Availability
          </p>
          <div className="mt-5 grid gap-6">
            <SelectionField title="Available Days" required error={errors.availableDays}>
              <div className="grid gap-3 sm:grid-cols-2">
                {TAXI_AVAILABLE_DAYS.map((day) => (
                  <Checkbox
                    key={day}
                    id={`available-day-${day}`}
                    checked={draft.availableDays.includes(day)}
                    onChange={() => toggleAvailableDay(day)}
                    label={day}
                  />
                ))}
              </div>
            </SelectionField>
            <SelectionField title="Available Time Slots" required error={errors.availableTimeSlots}>
              <div className="grid gap-3 sm:grid-cols-2">
                {TAXI_TIME_SLOTS.map((slot) => (
                  <Checkbox
                    key={slot}
                    id={`available-slot-${slot}`}
                    checked={draft.availableTimeSlots.includes(slot)}
                    onChange={() => toggleTimeSlot(slot)}
                    label={slot}
                  />
                ))}
              </div>
            </SelectionField>
          </div>
        </section>

        <section className="rounded-[28px] border border-border-soft bg-white p-6 shadow-(--shadow-xs) sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            Additional Information
          </p>
          <div className="mt-5 grid gap-6">
            <TextAreaField
              id="taxi-description"
              label="Description"
              value={draft.description}
              onChange={(event) => setField("description", event.target.value)}
              error={errors.description}
              rows={4}
              placeholder="Tell travelers what makes this taxi service reliable and comfortable."
            />
            <SelectionField title="Amenities" required error={errors.amenities}>
              <div className="grid gap-3 sm:grid-cols-2">
                {TAXI_AMENITIES.map((amenity) => (
                  <Checkbox
                    key={amenity}
                    id={`amenity-${amenity}`}
                    checked={draft.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    label={amenity}
                  />
                ))}
              </div>
            </SelectionField>
            <SelectionField title="Terms" required error={errors.acceptTerms}>
              <Checkbox
                id="taxi-terms"
                checked={draft.acceptTerms}
                onChange={(event) => setField("acceptTerms", event.target.checked)}
                label="I accept the terms and conditions for taxi partner onboarding."
              />
            </SelectionField>
          </div>
        </section>

        <div className="rounded-[28px] border border-brand-100 bg-brand-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Ready to list your taxi?</p>
              <p className="mt-1 text-sm text-ink-muted">
                We&apos;ll validate the required details, save the listing, and take you to your partner taxi dashboard.
              </p>
            </div>
            <Button type="submit" size="lg" loading={submitting}>
              {submitting ? "Submitting..." : "Submit Taxi Listing"}
            </Button>
          </div>
        </div>
      </form>

      <aside className="space-y-5">
        <section className="rounded-[28px] border border-border-soft bg-brand-900 p-6 text-white shadow-(--shadow-sm)">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
            Partner Benefits
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight">
            Bring your fleet onto SpaksTrip without changing the current taxi search flow.
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-white/80">
            {PAGE_HIGHLIGHTS.map((highlight) => (
              <li key={highlight} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent-400" aria-hidden />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[28px] border border-border-soft bg-white p-6 shadow-(--shadow-xs)">
          <p className="text-sm font-semibold text-ink">What happens after submission?</p>
          <div className="mt-4 space-y-3 text-sm text-ink-muted">
            <p>1. Your taxi listing is saved locally for the partner dashboard.</p>
            <p>2. You can edit pricing, coverage, and amenities from `My Taxis`.</p>
            <p>3. Availability toggles and booking-request previews stay separate from customer taxi booking APIs.</p>
          </div>
          <Link
            href="/partner/my-taxis"
            className="mt-5 inline-flex items-center text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
          >
            Open partner taxi dashboard
          </Link>
        </section>
      </aside>
    </div>
  );
}

function SelectionField({ title, required, error, children }: SelectionFieldProps) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-1 text-sm font-semibold text-ink-soft">
        <span>{title}</span>
        {required ? <span className="text-danger-600">*</span> : null}
      </div>
      {children}
      {error ? <p className="mt-2 text-xs font-medium text-danger-600">{error}</p> : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  error,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={cn(
          "h-11 rounded-md border bg-white px-3.5 text-[14px] text-ink outline-none transition-colors",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          error ? "border-danger-500" : "border-border",
        )}
      >
        {children}
      </select>
      {error ? <p className="text-[12px] font-medium text-danger-600">{error}</p> : null}
    </label>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  error,
  rows,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  rows: number;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          "rounded-md border bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition-colors",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          error ? "border-danger-500" : "border-border",
        )}
      />
      {error ? <p className="text-[12px] font-medium text-danger-600">{error}</p> : null}
    </label>
  );
}

function FileField({
  id,
  label,
  accept,
  multiple,
  fileName,
  error,
  onChange,
}: {
  id: string;
  label: string;
  accept: string;
  multiple?: boolean;
  fileName?: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className={cn(
          "rounded-md border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-brand-700 hover:file:bg-brand-100",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          error ? "border-danger-500" : "border-border",
        )}
      />
      {fileName ? <p className="text-[12px] text-ink-muted">{fileName}</p> : null}
      {error ? <p className="text-[12px] font-medium text-danger-600">{error}</p> : null}
    </label>
  );
}

function ChoiceBoolean({
  title,
  value,
  trueLabel,
  falseLabel,
  onChange,
}: {
  title: string;
  value: boolean;
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink-soft">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
            value
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-border-soft bg-white text-ink-muted hover:bg-surface-muted",
          )}
        >
          {trueLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
            !value
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-border-soft bg-white text-ink-muted hover:bg-surface-muted",
          )}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  );
}
