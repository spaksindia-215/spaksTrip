"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ApiError } from "@/lib/api";
import { authClient, type ApiAuthUser, type UserRole } from "@/lib/authClient";
import { toDisplayName } from "@/lib/displayName";

export type { UserRole } from "@/lib/authClient";

export type AuthStatus = "idle" | "loading" | "ready";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

type State = {
  user: AuthUser | null;
  status: AuthStatus;
};

type Actions = {
  login: (user: ApiAuthUser, displayNameOverride?: string) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};

export type AuthStore = State & Actions;

function mapUser(user: ApiAuthUser, displayNameOverride?: string): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: displayNameOverride?.trim() || user.name?.trim() || toDisplayName(user.email),
    role: user.role,
  };
}

export const selectIsAuthenticated = (state: AuthStore) => Boolean(state.user);

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      status: "idle",
      login: (user, displayNameOverride) => set({ user: mapUser(user, displayNameOverride) }),
      hydrate: async () => {
        if (get().status === "loading") return;

        set({ status: "loading" });

        try {
          const user = await authClient.me();
          set({ user: mapUser(user), status: "ready" });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            set({ user: null, status: "ready" });
            return;
          }

          set({ status: "ready" });
        }
      },
      logout: async () => {
        try {
          await authClient.logout();
        } finally {
          set({ user: null, status: "ready" });
        }
      },
    }),
    {
      name: "spakstrip.auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
