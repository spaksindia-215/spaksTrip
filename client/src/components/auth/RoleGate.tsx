"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/state/authStore";

export default function RoleGate() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    if (status === "idle") {
      void hydrate();
    }
  }, [hydrate, status]);

  useEffect(() => {
    if (status !== "ready") return;
    if (pathname === "/auth" && user) {
      router.replace(user.role === "partner" ? "/partner/dashboard" : "/");
    }
  }, [pathname, router, status, user]);

  return null;
}
