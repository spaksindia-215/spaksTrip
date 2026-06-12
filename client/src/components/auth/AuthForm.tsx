"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { authClient, type ApiAuthUser, type UserRole, type UserStatus } from "@/lib/authClient";
import { useAuthStore } from "@/state/authStore";
import Image from "next/image";

// ── Inline SVG icon helper ────────────────────────────────────────────────────
function Ic({ d, size = 18, stroke = 1.9 }: { d: React.ReactNode; size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: "block", flexShrink: 0 }}
    >
      {d}
    </svg>
  );
}

// ── Icon paths ────────────────────────────────────────────────────────────────
const I = {
  customer:   <><circle cx="12" cy="8" r="3.2" /><path d="M5 19a7 7 0 0 1 14 0" /></>,
  agent:      <><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /></>,
  b2b_agent:  <><path d="M4 20V6a2 2 0 0 1 2-2h6v16" /><path d="M12 20V9h6a2 2 0 0 1 2 2v9" /><path d="M7 8h2M7 12h2M15 13h2M15 16h2" /></>,
  partner:    <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  user:       <><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>,
  phone:      <path d="M6.62 10.79a15.91 15.91 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02z" />,
  mail:       <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" /></>,
  lock:       <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  lockOpen:   <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0" /></>,
  scan:       <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="3" y1="12" x2="21" y2="12" /></>,
  building:   <><path d="M4 20V6a2 2 0 0 1 2-2h6v16" /><path d="M12 20V9h6a2 2 0 0 1 2 2v9" /></>,
  receipt:    <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="16" y2="14" /></>,
  id:         <><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M14 10h4M14 14h4" /></>,
  coins:      <><circle cx="8" cy="14" r="5" /><path d="M8 9a5 5 0 0 1 5-5" /><circle cx="16" cy="10" r="5" /></>,
  wallet:     <><rect x="1" y="6" width="22" height="14" rx="2" /><path d="M1 10h22" /></>,
  layers:     <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  eye:        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff:     <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>,
  chevDown:   <path d="M6 9l6 6 6-6" />,
  arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
  arrowLeft:  <path d="M19 12H5M12 19l-7-7 7-7" />,
  userPlus:   <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>,
  logIn:      <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></>,
  shield:     <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>,
  badge:      <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /><polyline points="9 12 11 14 15 10" /></>,
  headset:    <><path d="M3 11V9a9 9 0 0 1 18 0v2" /><path d="M3 11a3 3 0 0 1 6 0v2a3 3 0 0 1-6 0z" /><path d="M15 11a3 3 0 0 1 6 0v2a3 3 0 0 1-6 0z" /></>,
  plane:      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5 18 1 16 1 14.5 2.5L11 6 2.8 4.2 1 6l8 4-4 4-4-1-1 1 3 3 3 3 1-1-1-4 4-4 4 8z" />,
  globe:      <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  warn:       <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />,
  close:      <path d="M18 6L6 18M6 6l12 12" />,
};

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES: { id: UserRole; label: string; blurb: string; icon: React.ReactNode }[] = [
  { id: "customer",  label: "Customer",  blurb: "Book your trips",  icon: I.customer },
  { id: "agent",     label: "Agent",     blurb: "Sell for clients", icon: I.agent },
  { id: "b2b_agent", label: "B2B Agent", blurb: "Credit booking",   icon: I.b2b_agent },
  { id: "partner",   label: "Partner",   blurb: "List inventory",   icon: I.partner },
];

// ── Field definitions ─────────────────────────────────────────────────────────
type FieldDef = {
  key: string;
  label: string;
  type: "text" | "tel" | "email" | "password" | "number" | "select";
  icon: React.ReactNode;
  ph?: string;
  prefix?: string;
  options?: string[];
};

const F: Record<string, FieldDef> = {
  name:      { key: "name",      label: "Full name",            type: "text",     icon: I.user,     ph: "Rishi Kumar" },
  phone:     { key: "phone",     label: "Phone number",         type: "tel",      icon: I.phone,    ph: "+91 98765 43210" },
  email:     { key: "email",     label: "Email",                type: "email",    icon: I.mail,     ph: "you@email.com" },
  aadhar:    { key: "aadhar",    label: "Aadhaar number",       type: "text",     icon: I.scan,     ph: "XXXX XXXX XXXX" },
  company:   { key: "company",   label: "Company name",         type: "text",     icon: I.building, ph: "Acme Travels" },
  gstin:     { key: "gstin",     label: "GSTIN",                type: "text",     icon: I.receipt,  ph: "22AAAAA0000A1Z" },
  pan:       { key: "pan",       label: "PAN number",           type: "text",     icon: I.id,       ph: "ABCDE1234F" },
  credit:    { key: "credit",    label: "Credit limit request", type: "number",   icon: I.coins,    prefix: "₹", ph: "0" },
  wallet:    { key: "wallet",    label: "Opening balance",      type: "number",   icon: I.wallet,   prefix: "₹", ph: "0" },
  inventory: { key: "inventory", label: "Inventory type",       type: "select",   icon: I.layers,
    options: ["Hotel", "Flight", "Holiday Package", "Transport", "Cruise", "Activity"] },
  password:  { key: "password",  label: "Password",             type: "password", icon: I.lock,     ph: "••••••••" },
  confirm:   { key: "confirm",   label: "Confirm password",     type: "password", icon: I.lockOpen, ph: "••••••••" },
};

type Group = { title: string | null; fields: FieldDef[] };
type Flow = { cta: string; groups: Group[] };

const REGISTER: Record<UserRole, Flow> = {
  customer: {
    cta: "Create customer account",
    groups: [
      { title: null,                fields: [F.name, F.phone, F.email, F.aadhar] },
      { title: "Login credentials", fields: [F.password, F.confirm] },
    ],
  },
  agent: {
    cta: "Register as agent",
    groups: [
      { title: "Personal details",  fields: [F.name, F.phone, F.email, F.aadhar] },
      { title: "KYC & credentials", fields: [F.pan, F.credit, F.password, F.confirm] },
    ],
  },
  b2b_agent: {
    cta: "Register as B2B agent",
    groups: [
      { title: "Personal details",  fields: [F.name, F.phone, F.email] },
      { title: "Business details",  fields: [F.company, F.gstin, F.pan, F.aadhar, F.credit, F.wallet] },
      { title: "Login credentials", fields: [F.password, F.confirm] },
    ],
  },
  partner: {
    cta: "Register as partner",
    groups: [
      { title: "Contact details",   fields: [F.name, F.phone, F.email] },
      { title: "Business & KYC",    fields: [F.company, F.gstin, F.pan, F.aadhar, F.inventory] },
      { title: "Login credentials", fields: [F.password, F.confirm] },
    ],
  },
};

function signInFlow(role: UserRole): Flow {
  const label = role === "b2b_agent" ? "B2B agent" : ROLES.find((r) => r.id === role)!.label.toLowerCase();
  return { cta: `Sign in as ${label}`, groups: [{ title: null, fields: [F.phone, F.password] }] };
}

// ── Single field ──────────────────────────────────────────────────────────────
function Field({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPw = def.type === "password";
  const isSelect = def.type === "select";
  const inputType = isPw ? (show ? "text" : "password") : def.type;

  return (
    <label className="flex flex-col gap-1">
      <span className="pl-0.5 text-[12px] font-semibold" style={{ color: "#3f5170" }}>
        {def.label}
      </span>
      <div
        className="relative flex items-center rounded-[13px] border transition-all duration-150"
        style={{
          background: focused ? "#fff" : "#f4f6fa",
          borderColor: focused ? "#F2611C" : "rgba(12,32,66,.10)",
          boxShadow: focused ? "0 0 0 4px rgba(242,97,28,.14)" : "none",
        }}
      >
        <span
          className="flex shrink-0 items-center pl-3 transition-colors duration-150"
          style={{ color: focused ? "#F2611C" : "#8294ad" }}
        >
          <Ic d={def.icon} size={16} stroke={1.9} />
        </span>
        {def.prefix && (
          <span className="pl-2 text-[14px] font-semibold" style={{ color: "#3f5170" }}>
            {def.prefix}
          </span>
        )}
        {isSelect ? (
          <select
            className="flex-1 cursor-pointer appearance-none bg-transparent py-2.5 pl-2 pr-8 text-[14px] outline-none"
            style={{ color: "#0c2042" }}
            value={value || def.options![0]}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => onChange(e.target.value)}
          >
            {def.options!.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            className="flex-1 bg-transparent py-2.5 pl-2 pr-3 text-[14px] outline-none placeholder:text-[#8294ad]"
            style={{ color: "#0c2042" }}
            type={inputType}
            placeholder={def.ph}
            value={value}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            inputMode={def.type === "number" ? "numeric" : undefined}
          />
        )}
        {isPw && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "#8294ad" }}
            onClick={() => setShow((s) => !s)}
          >
            <Ic d={show ? I.eyeOff : I.eye} size={16} stroke={1.9} />
          </button>
        )}
        {isSelect && (
          <span className="pointer-events-none absolute right-2 flex items-center" style={{ color: "#8294ad" }}>
            <Ic d={I.chevDown} size={15} stroke={2} />
          </span>
        )}
      </div>
    </label>
  );
}

// ── Field group with section divider ──────────────────────────────────────────
function FieldGroup({ group, values, setValue }: { group: Group; values: Record<string, string>; setValue: (k: string, v: string) => void }) {
  return (
    <div className="mb-1">
      {group.title && (
        <div className="my-2.5 flex items-center gap-3">
          <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[.09em]" style={{ color: "#94a3bb" }}>
            {group.title}
          </span>
          <span className="h-px flex-1" style={{ background: "rgba(12,32,66,.09)" }} />
        </div>
      )}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 [@media(max-width:820px)]:grid-cols-2 [@media(max-width:560px)]:grid-cols-1">
        {group.fields.map((f) => (
          <Field key={f.key} def={f} value={values[f.key] ?? ""} onChange={(v) => setValue(f.key, v)} />
        ))}
      </div>
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────────────────────
function ModeTabs({ mode, onChange }: { mode: "signin" | "register"; onChange: (m: "signin" | "register") => void }) {
  const idx = mode === "signin" ? 0 : 1;
  return (
    <div
      role="tablist"
      aria-label="Mode"
      className="relative mb-3 grid grid-cols-2 gap-1 rounded-full p-1"
      style={{ background: "rgba(12,32,66,.05)" }}
    >
      <span
        aria-hidden
        className="absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-white transition-transform duration-[280ms]"
        style={{
          boxShadow: "0 2px 8px rgba(7,22,51,.12)",
          transform: `translateX(${idx * 100}%)`,
        }}
      />
      {(["signin", "register"] as const).map((m, i) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          className="relative z-10 rounded-full py-2 text-[13.5px] font-semibold transition-colors duration-200"
          style={{ color: mode === m ? "#0c2042" : "#8294ad" }}
        >
          {i === 0 ? "Sign in" : "Create account"}
        </button>
      ))}
    </div>
  );
}

// ── Role pills ────────────────────────────────────────────────────────────────
function RolePills({ role, onChange }: { role: UserRole; onChange: (r: UserRole) => void }) {
  return (
    <div role="tablist" aria-label="Account type" className="mb-4 grid grid-cols-4 gap-2 [@media(max-width:560px)]:grid-cols-2">
      {ROLES.map((r) => {
        const active = role === r.id;
        return (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r.id)}
            className="flex flex-col items-center gap-1 rounded-[14px] border px-1.5 py-2 text-[12px] font-semibold transition-all duration-150 hover:-translate-y-px"
            style={{
              background: active ? "color-mix(in srgb, #F2611C 9%, white)" : "#f4f6fa",
              borderColor: active ? "#F2611C" : "rgba(12,32,66,.10)",
              color: active ? "#F2611C" : "#3f5170",
              boxShadow: active ? "0 6px 16px -8px rgba(242,97,28,.7)" : "none",
            }}
          >
            <Ic d={r.icon} size={18} stroke={1.9} />
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Result panel (success / pending) ─────────────────────────────────────────
function ResultPanel({ mode, role, status, onBack }: { mode: "signin" | "register"; role: UserRole; status: UserStatus; onBack: () => void }) {
  const roleName = ROLES.find((r) => r.id === role)?.label ?? role;
  const isPending = status === "pending";

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div
        className="mb-5 flex h-[74px] w-[74px] items-center justify-center rounded-full text-white"
        style={{
          background: "linear-gradient(180deg, #f96f34 0%, #F2611C 100%)",
          boxShadow: "0 16px 34px -12px rgba(242,97,28,.8)",
        }}
      >
        <Ic d={I.plane} size={30} stroke={1.8} />
      </div>
      <h2
        className="mb-2 text-2xl font-bold tracking-tight"
        style={{ fontFamily: "'Poppins',system-ui,sans-serif", color: "#0c2042" }}
      >
        {mode === "signin" ? "Welcome back!" : isPending ? "Application received!" : "You're all set!"}
      </h2>
      <p className="mb-6 max-w-[38ch] text-[14px] leading-relaxed" style={{ color: "#3f5170" }}>
        {mode === "signin" ? (
          <>Signing you into your <strong style={{ color: "#0c2042" }}>{roleName}</strong> dashboard…</>
        ) : isPending ? (
          <>Your <strong style={{ color: "#0c2042" }}>{roleName}</strong> application is under review. We&apos;ll notify you once it&apos;s approved.</>
        ) : (
          <>Your <strong style={{ color: "#0c2042" }}>{roleName}</strong> account is ready. Redirecting to your dashboard…</>
        )}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold"
        style={{ background: "rgba(12,32,66,.05)", color: "#0c2042" }}
      >
        <Ic d={I.arrowLeft} size={16} stroke={2} />
        Back to {mode === "signin" ? "sign in" : "form"}
      </button>
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <span className="mt-0.5 shrink-0 text-red-500"><Ic d={I.warn} size={16} stroke={2} /></span>
      <p className="flex-1 text-[13px] text-red-700">{message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 text-red-400 hover:text-red-600" aria-label="Dismiss">
        <Ic d={I.close} size={15} stroke={2} />
      </button>
    </div>
  );
}

// ── Trust badges ──────────────────────────────────────────────────────────────
const TRUST = [
  { icon: I.shield,  text: "Bank-grade encryption" },
  { icon: I.badge,   text: "IATA-verified partners" },
  { icon: I.headset, text: "24×7 travel support" },
];

// ── Form reducer ──────────────────────────────────────────────────────────────
type FormValues = Record<string, string>;
type FormAction = { key: string; value: string } | { reset: true };

function formReducer(state: FormValues, action: FormAction): FormValues {
  if ("reset" in action) return {};
  return { ...state, [action.key]: action.value };
}

// ── AuthForm ──────────────────────────────────────────────────────────────────
type Mode = "signin" | "register";

type Props = {
  initialMode?: Mode;
  initialRole?: UserRole;
  redirectTo?: string | null;
  onSuccess?: (user: ApiAuthUser) => void | Promise<void>;
};

export default function AuthForm({ initialMode = "signin", initialRole = "customer", onSuccess }: Props) {
  const loginToStore = useAuthStore((state) => state.login);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [values, dispatch] = useReducer(formReducer, {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resultStatus, setResultStatus] = useState<UserStatus>("active");

  // Floating scroll hint — shown when the card has more content below the fold.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const updateScrollHint = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const remaining = el.scrollHeight - el.clientHeight - el.scrollTop;
    setShowScrollHint(remaining > 24);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollHint();
    el.addEventListener("scroll", updateScrollHint, { passive: true });
    window.addEventListener("resize", updateScrollHint);
    return () => {
      el.removeEventListener("scroll", updateScrollHint);
      window.removeEventListener("resize", updateScrollHint);
    };
  }, [updateScrollHint]);

  // Content height changes when switching mode/role or toggling the result panel.
  useEffect(() => {
    updateScrollHint();
  }, [mode, role, done, error, updateScrollHint]);

  const scrollDown = () => {
    scrollRef.current?.scrollBy({ top: scrollRef.current.clientHeight * 0.7, behavior: "smooth" });
  };

  const setValue = (k: string, v: string) => dispatch({ key: k, value: v });
  const reset = () => { dispatch({ reset: true }); setError(null); };

  const flow = useMemo(
    () => (mode === "signin" ? signInFlow(role) : REGISTER[role]),
    [mode, role],
  );

  const switchMode = (m: Mode) => { setMode(m); reset(); };
  const switchRole = (r: UserRole) => { setRole(r); reset(); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        if (!values.name?.trim()) { setError("Full name is required."); setLoading(false); return; }
        if (!values.phone?.trim()) { setError("Phone number is required."); setLoading(false); return; }
        if (values.password !== values.confirm) { setError("Passwords do not match."); setLoading(false); return; }
        if ((values.password ?? "").length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }

        const result = await authClient.register({
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email?.trim() ?? "",
          password: values.password,
          role,
          aadhar: values.aadhar?.trim() ?? "",
          gst: values.gstin?.trim() || undefined,
          pan: values.pan?.trim() || undefined,
        });

        setResultStatus(result.status);
        setDone(true);
        if (result.status === "active") {
          loginToStore(result.user);
          await onSuccess?.(result.user);
        }
      } else {
        if (!values.phone?.trim()) { setError("Phone number is required."); setLoading(false); return; }
        if (!values.password) { setError("Password is required."); setLoading(false); return; }

        const user = await authClient.login({ phone: values.phone.trim(), password: values.password });
        loginToStore(user);
        setResultStatus(user.status);
        setDone(true);
        await onSuccess?.(user);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full" style={{ maxWidth: 880 }}>
    <div
      ref={scrollRef}
      className="max-h-[calc(100dvh-3rem)] w-full overflow-y-auto rounded-[22px] border bg-white px-5 py-5 sm:rounded-[26px] sm:px-8 sm:py-6"
      style={{
        borderColor: "rgba(12,32,66,.08)",
        boxShadow: "0 30px 80px -30px rgba(7,22,51,.45), 0 2px 8px rgba(7,22,51,.06)",
      }}
    >
      {done ? (
        <ResultPanel
          mode={mode}
          role={role}
          status={resultStatus}
          onBack={() => { setDone(false); reset(); }}
        />
      ) : (
        <>
          {/* Card header */}
          <div className="mb-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #1c4fa3, #0e2a5c)" }}
                aria-hidden
              >
                <Image src={"/logo.png"} alt="logo" width={100} height={100} />
              </div>
              <span
                className="text-[19px] font-bold tracking-tight"
                style={{ fontFamily: "'Poppins',system-ui,sans-serif", color: "#0c2042" }}
              >
                Spaks<span style={{ color: "#2563eb" }}>Trip</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-gray-100"
                style={{ background: "rgba(12,32,66,.05)", color: "#3f5170" }}
              >
                <Ic d={I.arrowLeft} size={13} stroke={2} />
                Browse
              </Link>
              <span
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: "rgba(12,32,66,.05)", color: "#3f5170" }}
              >
                <Ic d={I.globe} size={14} stroke={2} />
                India &amp; worldwide
              </span>
            </div>
          </div>

          {/* Intro */}
          <div className="mb-3">
            <h1
              className="mb-1 text-[21px] font-bold leading-tight tracking-tight sm:text-[24px]"
              style={{ fontFamily: "'Poppins',system-ui,sans-serif", color: "#0c2042" }}
            >
              {mode === "signin" ? "Sign in to SpaksTrip" : "Create your account"}
            </h1>
            <p className="hidden max-w-[42ch] text-[13px] leading-relaxed sm:block" style={{ color: "#3f5170" }}>
              {mode === "signin"
                ? "Pick up where you left off and manage every booking in one place."
                : "Join thousands of travellers and trade partners booking smarter."}
            </p>
          </div>

          <ModeTabs mode={mode} onChange={switchMode} />
          <RolePills role={role} onChange={switchRole} />

          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          <form
            onSubmit={handleSubmit}
            className={mode === "signin" ? "mx-auto max-w-[560px]" : ""}
          >
            {mode === "signin" ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 max-[560px]:grid-cols-1">
                {flow.groups[0].fields.map((f) => (
                  <Field key={f.key} def={f} value={values[f.key] ?? ""} onChange={(v) => setValue(f.key, v)} />
                ))}
              </div>
            ) : (
              flow.groups.map((g, i) => (
                <FieldGroup key={`${role}-${i}`} group={g} values={values} setValue={setValue} />
              ))
            )}

            {mode === "signin" && (
              <div className="mt-3 flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-[13px]" style={{ color: "#3f5170" }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: "#F2611C", width: 15, height: 15 }} />
                  Keep me signed in
                </label>
                <button type="button" className="text-[13px] font-semibold hover:underline" style={{ color: "#F2611C" }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] font-bold text-white transition-all duration-150 hover:-translate-y-0.5 active:scale-[.99] disabled:pointer-events-none"
              style={{
                background: "linear-gradient(180deg, #f96f34 0%, #F2611C 100%)",
                boxShadow: "0 12px 26px -10px rgba(242,97,28,.8), 0 1px 0 rgba(255,255,255,.3) inset",
              }}
            >
              {loading ? (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-white/40 border-t-white"
                  aria-label="Loading"
                />
              ) : (
                <>
                  <Ic d={mode === "signin" ? I.logIn : I.userPlus} size={18} stroke={2} />
                  <span>{flow.cta}</span>
                  <Ic d={I.arrowRight} size={18} stroke={2} />
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[13px]" style={{ color: "#3f5170" }}>
              {mode === "signin" ? (
                <>
                  New to SpaksTrip?{" "}
                  <button type="button" onClick={() => switchMode("register")} className="font-semibold hover:underline" style={{ color: "#F2611C" }}>
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("signin")} className="font-semibold hover:underline" style={{ color: "#F2611C" }}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>

          {/* Trust badges */}
          <div className="mt-4 hidden flex-wrap justify-center gap-4 border-t pt-3 sm:flex" style={{ borderColor: "rgba(12,32,66,.09)" }}>
            {TRUST.map((t) => (
              <span key={t.text} className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: "#8294ad" }}>
                <span style={{ color: "rgba(242,97,28,.75)" }}>
                  <Ic d={t.icon} size={14} stroke={2} />
                </span>
                {t.text}
              </span>
            ))}
          </div>
        </>
      )}
    </div>

    {showScrollHint && (
      <button
        type="button"
        onClick={scrollDown}
        aria-label="Scroll down for more"
        className="absolute bottom-4 left-1/2 z-20 flex h-10 w-10 -translate-x-1/2 animate-bounce items-center justify-center rounded-full text-white transition-opacity"
        style={{
          background: "linear-gradient(180deg, #f96f34 0%, #F2611C 100%)",
          boxShadow: "0 8px 20px -6px rgba(242,97,28,.85), 0 1px 0 rgba(255,255,255,.3) inset",
        }}
      >
        <Ic d={I.chevDown} size={20} stroke={2.4} />
      </button>
    )}
    </div>
  );
}
