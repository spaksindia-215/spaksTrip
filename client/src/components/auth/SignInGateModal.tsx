"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { authClient } from "@/lib/authClient";
import { useAuthStore } from "@/state/authStore";

// Sign-in gate shown at the traveller → payment step so a booking is always
// attributed to an account (no orphaned guest bookings). It deliberately handles
// only LOGIN: new accounts require Aadhaar/KYC + email verification before a
// session exists, which can't complete inline — those users register on /auth first.
//
// The parent keeps the traveller form mounted underneath, so the entered details
// survive; onSuccess fires once a real session is established and the caller then
// proceeds to payment.
export default function SignInGateModal({
  open,
  onClose,
  onSuccess,
  prefillEmail,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefillEmail?: string;
}) {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await authClient.login({ email: email.trim(), password });
      login(user);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        // 403 = unverified email / approval-pending account — guide them, don't just say "failed".
        setError(
          err.status === 403
            ? "This account isn't verified yet. Please confirm your email, then sign in."
            : err.status === 401
              ? "Incorrect email or password."
              : err.message,
        );
      } else {
        setError("Couldn't sign you in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sign in to confirm your booking" size="sm">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-[13px] text-ink-muted">
          We attach this trip to your account so it appears in “My trips” and you can manage
          or cancel it later.
        </p>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          error={error ?? undefined}
        />

        <Button type="submit" variant="accent" size="lg" loading={submitting} fullWidth>
          Sign in & continue
        </Button>

        <p className="text-center text-[12px] text-ink-muted">
          New to SpaksTrip?{" "}
          <Link href="/auth" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>{" "}
          — you’ll verify your email, then return to book.
        </p>
      </form>
    </Modal>
  );
}
