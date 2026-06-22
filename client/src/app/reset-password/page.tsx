"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/authClient";
import { ApiError } from "@/lib/api";

function isStrong(pw: string): boolean {
  return pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
}

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) { setError("This reset link is missing its token."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!isStrong(password)) {
      setError("Password must be 8+ characters with uppercase, lowercase, a number, and a symbol.");
      return;
    }
    setLoading(true);
    try {
      await authClient.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.replace("/auth"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[70vh] place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm" style={{ borderColor: "rgba(12,32,66,.1)" }}>
        <h1 className="mb-2 text-xl font-bold" style={{ color: "#0c2042" }}>Choose a new password</h1>
        {done ? (
          <p className="text-sm leading-relaxed" style={{ color: "#3f5170" }}>
            Your password has been reset. Redirecting you to sign in…
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <p className="mb-5 text-sm leading-relaxed" style={{ color: "#3f5170" }}>
              Pick a strong password you don&apos;t use anywhere else.
            </p>
            {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
            <label className="mb-1 block text-[13px] font-medium" style={{ color: "#3f5170" }}>New password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#F2611C]"
              style={{ borderColor: "rgba(12,32,66,.15)" }}
            />
            <label className="mb-1 block text-[13px] font-medium" style={{ color: "#3f5170" }}>Confirm password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mb-5 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#F2611C]"
              style={{ borderColor: "rgba(12,32,66,.15)" }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "#F2611C" }}
            >
              {loading ? "Resetting…" : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="grid min-h-[70vh] place-items-center px-4 text-sm text-ink-muted">Loading…</main>}>
      <ResetInner />
    </Suspense>
  );
}
