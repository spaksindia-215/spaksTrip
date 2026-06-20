"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/authClient";
import { ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authClient.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[70vh] place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm" style={{ borderColor: "rgba(12,32,66,.1)" }}>
        <h1 className="mb-2 text-xl font-bold" style={{ color: "#0c2042" }}>Reset your password</h1>
        {sent ? (
          <>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: "#3f5170" }}>
              If an account matches that email, we&apos;ve sent a password reset link. It expires in 30 minutes.
            </p>
            <Link href="/auth" className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "#F2611C" }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <p className="mb-5 text-sm leading-relaxed" style={{ color: "#3f5170" }}>
              Enter your account email and we&apos;ll send you a link to choose a new password.
            </p>
            {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
            <label className="mb-1 block text-[13px] font-medium" style={{ color: "#3f5170" }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-5 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#F2611C]"
              style={{ borderColor: "rgba(12,32,66,.15)" }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "#F2611C" }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <Link href="/auth" className="mt-4 block text-center text-[13px] font-semibold hover:underline" style={{ color: "#F2611C" }}>
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
