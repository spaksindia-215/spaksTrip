"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/authClient";
import { dashboardPathForRole } from "@/lib/roleRoutes";
import { useAuthStore } from "@/state/authStore";
import { ApiError } from "@/lib/api";

type Phase = "verifying" | "success" | "error";

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const token = params.get("token") ?? "";
  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState("");
  // Guard against React 18 double-invoke in dev (token is single-use).
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setPhase("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    authClient
      .verifyEmail(token)
      .then((res) => {
        setPhase("success");
        if (res.status === "active") {
          login(res.user);
          setMessage("Email verified! Taking you to your dashboard…");
          setTimeout(() => router.replace(dashboardPathForRole(res.user.role)), 1200);
        } else {
          setMessage("Email verified. Your account is still under review — we'll email you once it's approved.");
        }
      })
      .catch((err) => {
        setPhase("error");
        setMessage(
          err instanceof ApiError
            ? err.message
            : "We couldn't verify your email. The link may have expired.",
        );
      });
  }, [token, login, router]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm" style={{ borderColor: "rgba(12,32,66,.1)" }}>
        <h1 className="mb-3 text-xl font-bold" style={{ color: "#0c2042" }}>
          {phase === "verifying" ? "Verifying your email…" : phase === "success" ? "You're verified" : "Verification failed"}
        </h1>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: "#3f5170" }}>
          {phase === "verifying" ? "Just a moment while we confirm your link." : message}
        </p>
        {phase === "error" && (
          <Link href="/auth" className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "#F2611C" }}>
            Back to sign in
          </Link>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="grid min-h-[70vh] place-items-center px-4 text-sm text-ink-muted">Loading…</main>}>
      <VerifyInner />
    </Suspense>
  );
}
