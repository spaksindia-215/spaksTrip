"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FlightOffer, FareFamily } from "@/lib/mock/flights";
import type { PaxCounts } from "./flightSearchStore";

export type TravelerType = "ADT" | "CHD" | "INF";
export type Gender = "M" | "F";

export type Traveler = {
  id: string;
  type: TravelerType;
  title: "Mr" | "Ms" | "Mrs" | "Mstr" | "Miss";
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string | null;       // YYYY-MM-DD
  passport?: string;
  nationality?: string;
  meal?: string;
  seat?: string;
};

export type ContactInfo = {
  email: string;
  phone: string;
  countryCode: string;
};

export type GSTInfo = {
  companyName: string;
  gstNumber: string;
  companyAddress: string;
  companyContactNumber: string;
  companyEmail: string;
};

export type FlightBooking = {
  id: string;             // PNR-like id
  offer: FlightOffer;
  fareFamily: FareFamily;
  pax: PaxCounts;
  travelers: Traveler[];
  contact: ContactInfo;
  totalPrice: number;
  taxes: number;
  fees: number;
  addOns: { meals: number; seats: number; baggage: number; insurance: number };
  status: "CART" | "TRAVELER" | "PAYMENT" | "CONFIRMED";
  /** Guideline §14: true when FareQuote returns IsGSTMandatory — UI must collect GST. */
  isGSTMandatory: boolean;
  gst?: GSTInfo;
  createdAt: string;
  confirmedAt?: string;
  bookingReference?: string;
  /** Present for domestic return: PNR for the inbound leg (dual-PNR flow). */
  returnBookingReference?: string;
};

type State = {
  current: FlightBooking | null;
  bookings: FlightBooking[];
};

type Actions = {
  startFlightBooking: (p: { offer: FlightOffer; fareFamily: FareFamily; pax: PaxCounts }) => void;
  setTravelers: (t: Traveler[]) => void;
  setContact: (c: ContactInfo) => void;
  setAddOns: (a: Partial<FlightBooking["addOns"]>) => void;
  setGSTMandatory: (mandatory: boolean) => void;
  setGST: (gst: GSTInfo) => void;
  advanceStatus: (s: FlightBooking["status"]) => void;
  confirm: (ref: string, returnRef?: string) => void;
  clearCurrent: () => void;
};

function computeTotals(offer: FlightOffer, fareFamily: FareFamily, pax: PaxCounts) {
  const base = offer.basePrice + fareFamily.priceDelta;
  const adultsCost = base * pax.adults;
  const childrenCost = Math.round(base * 0.75) * pax.children;
  const infantsCost = Math.round(base * 0.1) * pax.infants;
  const subtotal = adultsCost + childrenCost + infantsCost;
  const taxes = Math.round(subtotal * 0.16);
  const fees = 349 + 99 * (pax.adults + pax.children);
  return { subtotal, taxes, fees, total: subtotal + taxes + fees };
}

export const useBookingStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      current: null,
      bookings: [],
      startFlightBooking: ({ offer, fareFamily, pax }) => {
        const { taxes, fees, total } = computeTotals(offer, fareFamily, pax);
        const id = `${offer.id}-${Date.now().toString(36)}`;
        set({
          current: {
            id,
            offer,
            fareFamily,
            pax,
            travelers: [],
            contact: { email: "", phone: "", countryCode: "+91" },
            addOns: { meals: 0, seats: 0, baggage: 0, insurance: 0 },
            totalPrice: total,
            taxes,
            fees,
            status: "CART",
            isGSTMandatory: false,
            createdAt: new Date().toISOString(),
          },
        });
      },
      setTravelers: (travelers) =>
        set((s) => (s.current ? { current: { ...s.current, travelers } } : s)),
      setContact: (contact) =>
        set((s) => (s.current ? { current: { ...s.current, contact } } : s)),
      setAddOns: (a) =>
        set((s) => {
          if (!s.current) return s;
          const addOns = { ...s.current.addOns, ...a };
          const add = addOns.meals + addOns.seats + addOns.baggage + addOns.insurance;
          const { taxes, fees, total } = computeTotals(s.current.offer, s.current.fareFamily, s.current.pax);
          return { current: { ...s.current, addOns, taxes, fees, totalPrice: total + add } };
        }),
      setGSTMandatory: (mandatory) =>
        set((s) => (s.current ? { current: { ...s.current, isGSTMandatory: mandatory } } : s)),
      setGST: (gst) =>
        set((s) => (s.current ? { current: { ...s.current, gst } } : s)),
      advanceStatus: (status) =>
        set((s) => (s.current ? { current: { ...s.current, status } } : s)),
      confirm: (ref, returnRef?) =>
        set((s) => {
          if (!s.current) return s;
          const done: FlightBooking = {
            ...s.current,
            status: "CONFIRMED",
            confirmedAt: new Date().toISOString(),
            bookingReference: ref,
            ...(returnRef ? { returnBookingReference: returnRef } : {}),
          };
          return { current: done, bookings: [done, ...s.bookings].slice(0, 30) };
        }),
      clearCurrent: () => set({ current: null }),
    }),
    {
      name: "spakstrip.bookings",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({ bookings: s.bookings, current: s.current }),
    },
  ),
);

export { computeTotals };
