"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { useAuthStore } from "@/state/authStore";
import { dashboardPathForRole } from "@/lib/roleRoutes";

export default function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const initialMode = searchParams.get("mode") === "register" ? "register" : "signin";
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [hydrate, status]);

  useEffect(() => {
    if (status !== "ready" || !user) return;
    router.replace(redirect ?? dashboardPathForRole(user.role));
  }, [redirect, router, status, user]);

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#071633" }}>
      {/* Navy gradient layers */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: "#071633" }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 80% -10%, #143a7a 0%, transparent 55%), " +
              "radial-gradient(130% 100% at 10% 110%, #102a5e 0%, transparent 50%), " +
              "linear-gradient(160deg, #0a1f44 0%, #071633 60%, #050f24 100%)",
          }}
        />
        {/* Orange glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: "60vw",
            height: "60vw",
            left: "-10vw",
            top: "-18vw",
            background: "radial-gradient(circle, rgba(242,97,28,.55) 0%, transparent 62%)",
            filter: "blur(20px)",
            opacity: 0.5,
          }}
        />
        {/* Dot grid */}
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.5 }} aria-hidden>
          <defs>
            <pattern id="sp-dots" x="0" y="0" width="34" height="34" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,.12)" />
            </pattern>
            <mask id="sp-dot-mask">
              <rect width="100%" height="100%" fill="url(#sp-dots)" />
              <rect
                width="100%"
                height="100%"
                fill="url(#sp-dot-radial)"
              />
            </mask>
            <radialGradient id="sp-dot-radial" cx="70%" cy="20%" r="70%">
              <stop offset="0%" stopColor="black" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#sp-dots)" mask="url(#sp-dot-fade)" />
          <defs>
            <mask id="sp-dot-fade">
              <radialGradient id="sp-dot-fade-grad" cx="70%" cy="20%" r="65%">
                <stop offset="0%" stopColor="white" />
                <stop offset="100%" stopColor="black" />
              </radialGradient>
              <rect width="100%" height="100%" fill="url(#sp-dot-fade-grad)" />
            </mask>
          </defs>
        </svg>
      </div>

      {/* Centered card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <AuthForm
          initialMode={initialMode}
          redirectTo={redirect}
          onSuccess={(authenticatedUser) => {
            router.replace(redirect ?? dashboardPathForRole(authenticatedUser.role));
          }}
        />
      </div>
    </main>
  );
}
