"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { City } from "@/lib/mock/hotels";

export type Destination =
  | {
      kind: "country";
      code: string;
      name: string;
      city?: { code: string; name: string };
    }
  | { kind: "postal"; postalCode: string };

type RecentHotelSearch = {
  id: string;
  label: string;
  cityCode: string;
  when: string;
};

type State = {
  city: City | null;
  destination: Destination | null;
  checkIn: string | null;
  checkOut: string | null;
  rooms: number;
  adults: number;
  children: number;
  childrenAges: number[]; // Ages of children (0-17) for TBO pricing
  nationality: string;
  recent: RecentHotelSearch[];
};

type Actions = {
  setCity: (c: City | null) => void;
  setDestination: (d: Destination | null) => void;
  setCheckIn: (d: string | null) => void;
  setCheckOut: (d: string | null) => void;
  setRooms: (n: number) => void;
  setAdults: (n: number) => void;
  setChildren: (n: number) => void;
  setChildrenAges: (ages: number[]) => void;
  setNationality: (n: string) => void;
  pushRecent: (r: RecentHotelSearch) => void;
  reset: () => void;
};

const initial: State = {
  city: null,
  destination: null,
  checkIn: null,
  checkOut: null,
  rooms: 1,
  adults: 2,
  children: 0,
  childrenAges: [],
  nationality: "IN",
  recent: [],
};

export const useHotelSearchStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      setCity: (city) => set({ city }),
      setDestination: (destination) => set({ destination }),
      setCheckIn: (checkIn) => set({ checkIn }),
      setCheckOut: (checkOut) => set({ checkOut }),
      setRooms: (rooms) => set({ rooms }),
      setAdults: (adults) => set({ adults }),
      setChildren: (children) => set({ children }),
      setChildrenAges: (childrenAges) => set({ childrenAges }),
      setNationality: (nationality) => set({ nationality }),
      pushRecent: (r) =>
        set((s) => ({
          recent: [r, ...s.recent.filter((x) => x.id !== r.id)].slice(0, 8),
        })),
      reset: () => {
        const prev = get().recent;
        set({ ...initial, recent: prev });
      },
    }),
    {
      name: "spakstrip.hotel-search",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({ recent: s.recent, rooms: s.rooms, adults: s.adults, nationality: s.nationality }),
    },
  ),
);
