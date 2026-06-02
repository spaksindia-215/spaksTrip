"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Radio from "@/components/ui/Radio";
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { authClient, type ApiAuthUser, type UserRole } from "@/lib/authClient";
import { useAuthStore } from "@/state/authStore";

type Mode = "signin" | "register";

type Props = {
  initialMode?: Mode;
  redirectTo?: string | null;
  onSuccess?: (user: ApiAuthUser) => void | Promise<void>;
};

const MODE_ITEMS = [
  { value: "signin", label: "Login" },
  { value: "register", label: "Register" },
] as const;

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; blurb: string }> = [
  { value: "customer", label: "Customer", blurb: "Book flights, hotels, and packages." },
  { value: "agent", label: "Agent", blurb: "Agent portal with holds, credit limit, and PNR tracker." },
  {
    value: "b2b_agent",
    label: "B2B Agent",
    blurb: "Everything an agent has, plus API access. Needs approval.",
  },
  { value: "partner", label: "Partner", blurb: "List and manage inventory. Needs approval." },
];

// Roles that require GST + PAN and superadmin approval.
const KYC_ROLES: readonly UserRole[] = ["b2b_agent", "partner"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const AADHAR_RE = /^\d{12}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

export default function AuthForm({
  initialMode = "signin",
  redirectTo,
  onSuccess,
}: Props) {
  const toast = useToast();
  const loginToStore = useAuthStore((state) => state.login);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [gst, setGst] = useState("");
  const [pan, setPan] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  const needsKyc = KYC_ROLES.includes(role);

  const submitLabel = useMemo(() => {
    return mode === "register" ? "Create Account" : "Sign In";
  }, [mode]);

  const hintCopy = useMemo(() => {
    if (mode === "register") {
      return "Register once and pick the role your account should behave as. B2B Agent and Partner accounts are activated after approval.";
    }

    return "Sign in with your phone number and password. We will route you based on the role stored on your account.";
  }, [mode]);

  const switchMode = (next: Mode) => {
    setPendingRole(null);
    setMode(next);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedAadhar = aadhar.trim();
    const normalizedGst = gst.trim().toUpperCase();
    const normalizedPan = pan.trim().toUpperCase();

    // Phone is the login identifier in both modes.
    if (!PHONE_RE.test(normalizedPhone)) {
      toast.push({ title: "Enter a valid phone number", tone: "warn" });
      return;
    }

    if (mode === "register") {
      if (normalizedName.length < 2) {
        toast.push({
          title: "Enter your name",
          description: "Please add at least 2 characters for your name.",
          tone: "warn",
        });
        return;
      }
      if (!EMAIL_RE.test(normalizedEmail)) {
        toast.push({ title: "Enter a valid email", tone: "warn" });
        return;
      }
      if (password.length < 8) {
        toast.push({
          title: "Password too short",
          description: "Password must be at least 8 characters.",
          tone: "warn",
        });
        return;
      }
    }

    if (mode === "signin" && password.length === 0) {
      toast.push({ title: "Password required", tone: "warn" });
      return;
    }

    if (mode === "register") {
      if (!AADHAR_RE.test(normalizedAadhar)) {
        toast.push({
          title: "Enter a valid Aadhaar",
          description: "Aadhaar must be a 12-digit number.",
          tone: "warn",
        });
        return;
      }
      if (needsKyc) {
        if (!GST_RE.test(normalizedGst)) {
          toast.push({ title: "Enter a valid GST number", tone: "warn" });
          return;
        }
        if (!PAN_RE.test(normalizedPan)) {
          toast.push({ title: "Enter a valid PAN number", tone: "warn" });
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const result = await authClient.register({
          name: normalizedName,
          phone: normalizedPhone,
          email: normalizedEmail,
          password,
          role,
          aadhar: normalizedAadhar,
          ...(needsKyc ? { gst: normalizedGst, pan: normalizedPan } : {}),
        });

        // Pending roles get no session — show an awaiting-approval notice.
        if (result.status === "pending") {
          setPendingRole(role);
          toast.push({
            title: "Registration submitted",
            description: "Your account is awaiting approval.",
            tone: "success",
          });
          return;
        }

        const user = await authClient.me();
        loginToStore(user, normalizedName);
        toast.push({
          title: "Account created",
          description: `Signed in as ${user.email}`,
          tone: "success",
        });
        await onSuccess?.(user);
        return;
      }

      await authClient.login({ phone: normalizedPhone, password });
      const user = await authClient.me();
      loginToStore(user);
      toast.push({
        title: "Login successful",
        description: `Signed in as ${user.email}`,
        tone: "success",
      });
      await onSuccess?.(user);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";

      toast.push({
        title: mode === "register" ? "Could not create account" : "Could not sign in",
        description: message,
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // Awaiting-approval confirmation (b2b_agent + partner registration).
  if (pendingRole) {
    const label = ROLE_OPTIONS.find((option) => option.value === pendingRole)?.label ?? "account";
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-5">
          <p className="text-[15px] font-semibold text-amber-900">Awaiting approval</p>
          <p className="mt-2 text-[13px] leading-6 text-amber-800">
            Your {label} registration has been submitted and is pending review by our team. You will
            be able to sign in with your phone number once it is approved. We will notify you by
            email.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          fullWidth
          onClick={() => switchMode("signin")}
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={mode}
        onChange={(value) => switchMode(value as Mode)}
        items={MODE_ITEMS as unknown as Array<{ value: Mode; label: string }>}
        variant="underline"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        <p className="text-[13px] text-ink-muted">{hintCopy}</p>

        {mode === "register" ? (
          <Input
            id="auth-name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your full name"
            autoComplete="name"
          />
        ) : null}

        <Input
          id="auth-phone"
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="9876543210"
          autoComplete="tel"
          hint={mode === "register" ? "Your phone number is used to sign in." : undefined}
        />

        {mode === "register" ? (
          <Input
            id="auth-email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        ) : null}

        <Input
          id="auth-password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          hint={mode === "register" ? "Minimum 8 characters." : undefined}
        />

        {mode === "register" ? (
          <>
            <Input
              id="auth-aadhar"
              label="Aadhaar Number"
              type="text"
              inputMode="numeric"
              value={aadhar}
              onChange={(event) => setAadhar(event.target.value)}
              placeholder="12-digit Aadhaar"
              autoComplete="off"
            />

            {needsKyc ? (
              <>
                <Input
                  id="auth-gst"
                  label="GST Number"
                  type="text"
                  value={gst}
                  onChange={(event) => setGst(event.target.value)}
                  placeholder="15-character GSTIN"
                  autoComplete="off"
                />
                <Input
                  id="auth-pan"
                  label="PAN Number"
                  type="text"
                  value={pan}
                  onChange={(event) => setPan(event.target.value)}
                  placeholder="ABCDE1234F"
                  autoComplete="off"
                />
              </>
            ) : null}

            <div className="rounded-xl border border-border-soft bg-surface-muted/60 p-4">
              <div className="mb-3">
                <span className="text-[13px] font-medium text-ink-soft">Choose Role</span>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {ROLE_OPTIONS.find((option) => option.value === role)?.blurb}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {ROLE_OPTIONS.map((option) => (
                  <Radio
                    key={option.value}
                    id={`role-${option.value}`}
                    name="auth-role"
                    checked={role === option.value}
                    onChange={() => setRole(option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </>
        ) : null}

        <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
          {submitLabel}
        </Button>

        <p className="text-center text-[12px] text-ink-muted">
          {redirectTo
            ? "You will return to the page you were trying to open after authentication."
            : "We will route you automatically after authentication based on your role."}
        </p>
      </form>
    </div>
  );
}
