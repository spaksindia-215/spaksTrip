"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Chip from "@/components/ui/Chip";
import { useToast } from "@/components/ui/Toast";
import { toIsoDate } from "@/lib/format";

const heroImage = "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1800&q=82";

type TripMode = "oneway" | "round";

export default function CabSearchForm() {
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<TripMode>("oneway");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [returnDate, setReturnDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);

  const onSearch = () => {
    if (!from.trim()) { toast.push({ title: "Enter pickup location", tone: "warn" }); return; }
    if (!to.trim()) { toast.push({ title: "Enter drop location", tone: "warn" }); return; }
    if (!date) { toast.push({ title: "Pick a date", tone: "warn" }); return; }
    setSubmitting(true);
    const params = new URLSearchParams({ from: from.trim(), to: to.trim(), date, time, mode });
    if (mode === "round" && returnDate) params.set("return", returnDate);
    router.push(`/cabs/results?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-ink">
      <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/35" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6">
        <Badge tone="accent" className="mb-3 w-fit bg-white/14 text-white ring-1 ring-white/25">
          SpaksTrip Cabs
        </Badge>
        <h1 className="max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl">
          Book a cab for airport runs, city rides and outstation trips
        </h1>
        <p className="mt-3 max-w-xl text-base leading-6 text-white/80">
          Verified drivers, transparent fares and support that stays with you until drop-off.
        </p>
        <div className="mt-7 rounded-2xl bg-white p-5 shadow-(--shadow-lg)">
          <div className="flex gap-2 mb-4">
            <Chip active={mode === "oneway"} onClick={() => setMode("oneway")}>One Way</Chip>
            <Chip active={mode === "round"} onClick={() => setMode("round")}>Round Trip</Chip>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Input
              label="From (Pickup)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="City or area"
              leading={
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-ink-muted">
                  <circle cx="12" cy="10" r="3" /><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z" />
                </svg>
              }
            />
            <Input
              label="To (Drop)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="City or area"
              leading={
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-ink-muted">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              }
            />
            <Input
              label={mode === "round" ? "Departure Date" : "Date"}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {mode === "round" && (
              <Input
                label="Return Date"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            )}
            <Input
              label="Pickup Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button onClick={onSearch} loading={submitting} size="xl" variant="accent" fullWidth>
                Search Cabs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
