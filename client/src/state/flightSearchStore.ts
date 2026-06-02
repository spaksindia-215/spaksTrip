"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CabinClass } from "@/lib/mock/flights";
import type { Airport } from "@/lib/mock/airports";

export type TripType = "ONEWAY" | "ROUND" | "MULTI";

export type FareCategory = "regular" | "student" | "armed_forces" | "senior_citizen";

export type PaxCounts = {
  adults: number;
  children: number;
  infants: number;
};

export type FlightLeg = {
  from: Airport | null;
  to: Airport | null;
  date: string | null; // YYYY-MM-DD
};

type State = {
  tripType: TripType;
  legs: FlightLeg[];              // index 0 = outbound; for round, [0]=out, [1]=return
  returnDate: string | null;       // also duplicated here for ROUND trips
  cabin: CabinClass;
  pax: PaxCounts;
  preferredStops: (0 | 1 | 2)[];
  fareCategory: FareCategory;
  recent: Array<{
    id: string;
    label: string;
    when: string;
    from: string;
    to: string;
    date: string;
  }>;
};

type Actions = {
  setTripType: (t: TripType) => void;
  setLeg: (index: number, patch: Partial<FlightLeg>) => void;
  addLeg: () => void;
  removeLeg: (index: number) => void;
  swapLeg: (index: number) => void;
  setReturnDate: (d: string | null) => void;
  setCabin: (c: CabinClass) => void;
  setPax: (p: Partial<PaxCounts>) => void;
  setPreferredStops: (v: (0 | 1 | 2)[]) => void;
  setFareCategory: (c: FareCategory) => void;
  pushRecent: (r: State["recent"][number]) => void;
  reset: () => void;
};

const initialLeg = (): FlightLeg => ({ from: null, to: null, date: null });

const initial: State = {
  tripType: "ONEWAY",
  legs: [initialLeg()],
  returnDate: null,
  cabin: "ECONOMY",
  pax: { adults: 1, children: 0, infants: 0 },
  preferredStops: [],
  fareCategory: "regular",
  recent: [],
};

export const useFlightSearchStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      setTripType: (t) =>
        set((s) => {
          if (t === "MULTI" && s.legs.length < 2) {
            return { tripType: t, legs: [...s.legs, initialLeg()], returnDate: null };
          }
          if (t !== "MULTI" && s.legs.length > 1) {
            return { tripType: t, legs: [s.legs[0]] };
          }
          if (t !== "ROUND") return { tripType: t, returnDate: null };
          return { tripType: t };
        }),
      setLeg: (i, patch) =>
        set((s) => ({
          legs: s.legs.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
        })),
      addLeg: () =>
        set((s) => (s.legs.length >= 5 ? s : { legs: [...s.legs, initialLeg()] })),
      removeLeg: (i) =>
        set((s) => ({ legs: s.legs.filter((_, idx) => idx !== i) })),
      swapLeg: (i) =>
        set((s) => ({
          legs: s.legs.map((l, idx) =>
            idx === i ? { from: l.to, to: l.from, date: l.date } : l,
          ),
        })),
      setReturnDate: (d) => set({ returnDate: d }),
      setCabin: (c) => set({ cabin: c }),
      setPax: (p) => set((s) => ({ pax: { ...s.pax, ...p } })),
      setPreferredStops: (v) => set({ preferredStops: v }),
      setFareCategory: (c) => set({ fareCategory: c }),
      pushRecent: (r) =>
        set((s) => {
          const next = [r, ...s.recent.filter((x) => x.id !== r.id)].slice(0, 8);
          return { recent: next };
        }),
      reset: () => {
        const prev = get().recent;
        set({ ...initial, recent: prev });
      },
    }),
    {
      name: "spakstrip.flight-search",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({ recent: s.recent, cabin: s.cabin, pax: s.pax, fareCategory: s.fareCategory }),
    },
  ),
);
