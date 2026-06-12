"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { agentClient, type MarkupRule, type MarkupType } from "@/lib/agentClient";

type Product = "flights" | "hotels" | "taxi";

const PRODUCTS: Array<{ value: Product; label: string; exampleFare: number }> = [
  { value: "flights", label: "Flights", exampleFare: 4500 },
  { value: "hotels", label: "Hotels", exampleFare: 3200 },
  { value: "taxi", label: "Taxi", exampleFare: 1200 },
];

const TYPE_TABS: Array<{ value: MarkupType; label: string }> = [
  { value: "percent", label: "Percentage" },
  { value: "flat", label: "Flat amount" },
];

const PERCENT_WARN = 20;
const PERCENT_MAX = 30;
const FLAT_MAX = 5000;

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function applyMarkupPreview(fare: number, rule: MarkupRule): number {
  const raw =
    rule.type === "percent"
      ? Math.round(fare * (1 + rule.value / 100))
      : fare + rule.value;
  if (rule.cap != null && rule.cap > 0) return Math.min(raw, fare + rule.cap);
  return raw;
}

function validate(rule: MarkupRule): string | null {
  if (!Number.isFinite(rule.value) || rule.value < 0) return "Value must be 0 or greater.";
  if (rule.type === "percent" && rule.value > PERCENT_MAX)
    return `Percentage cannot exceed ${PERCENT_MAX}%.`;
  if (rule.type === "flat" && rule.value > FLAT_MAX)
    return `Flat amount cannot exceed ${inr(FLAT_MAX)}.`;
  if (rule.cap != null && rule.cap < 0) return "Cap must be 0 or greater.";
  return null;
}

const DEFAULT_RULE: MarkupRule = { type: "percent", value: 0 };

function MarkupCard({
  product,
  label,
  exampleFare,
  initial,
  onSaved,
}: {
  product: Product;
  label: string;
  exampleFare: number;
  initial: MarkupRule;
  onSaved: (rule: MarkupRule) => void;
}) {
  const toast = useToast();
  const [rule, setRule] = useState<MarkupRule>(initial);
  const [valueStr, setValueStr] = useState(String(initial.value));
  const [capStr, setCapStr] = useState(initial.cap != null ? String(initial.cap) : "");
  const [saving, setSaving] = useState(false);

  // Keep local state in sync if parent reloads initial
  useEffect(() => {
    setRule(initial);
    setValueStr(String(initial.value));
    setCapStr(initial.cap != null ? String(initial.cap) : "");
  }, [initial]);

  const currentRule: MarkupRule = {
    type: rule.type,
    value: Number(valueStr) || 0,
    cap: capStr.trim() !== "" ? Number(capStr) : undefined,
  };

  const preview = applyMarkupPreview(exampleFare, currentRule);
  const validationError = validate(currentRule);
  const isWarn =
    currentRule.type === "percent" &&
    currentRule.value > PERCENT_WARN &&
    currentRule.value <= PERCENT_MAX;

  const save = async () => {
    if (validationError) {
      toast.push({ title: validationError, tone: "danger" });
      return;
    }
    setSaving(true);
    try {
      await agentClient.updateMarkup(product, currentRule);
      onSaved(currentRule);
      toast.push({ title: `${label} markup saved`, tone: "success" });
    } catch (err) {
      toast.push({
        title: "Save failed",
        description: err instanceof ApiError ? err.message : "Please try again",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-soft bg-white p-5 flex flex-col gap-4">
      <h2 className="text-[15px] font-bold text-ink">{label}</h2>

      <div>
        <p className="mb-2 text-[12px] font-medium text-ink-soft">Markup type</p>
        <Tabs
          value={rule.type}
          onChange={(v) => setRule((r) => ({ ...r, type: v }))}
          items={TYPE_TABS}
          variant="segmented"
        />
      </div>

      <Input
        id={`${product}-value`}
        label={rule.type === "percent" ? "Markup (%)" : "Markup amount (₹)"}
        type="number"
        inputMode="decimal"
        min={0}
        max={rule.type === "percent" ? PERCENT_MAX : FLAT_MAX}
        value={valueStr}
        onChange={(e) => setValueStr(e.target.value)}
        placeholder="0"
      />

      <Input
        id={`${product}-cap`}
        label="Cap per booking (₹) — optional"
        type="number"
        inputMode="decimal"
        min={0}
        value={capStr}
        onChange={(e) => setCapStr(e.target.value)}
        placeholder="No cap"
        hint="Maximum markup added per booking, regardless of fare."
      />

      {isWarn && (
        <p className="rounded-lg bg-warn-50 border border-warn-200 px-3 py-2 text-[12px] text-warn-700">
          Markup above {PERCENT_WARN}% may affect competitiveness.
        </p>
      )}

      {validationError && (
        <p className="text-[12px] text-danger-600">{validationError}</p>
      )}

      <div className="rounded-lg bg-surface-muted px-4 py-3">
        <p className="text-[12px] text-ink-muted">Live preview</p>
        <p className="mt-0.5 text-[13px] text-ink">
          Example: {inr(exampleFare)} fare →{" "}
          <span className="font-bold text-brand-700">{inr(preview)}</span> shown to client
        </p>
      </div>

      <Button
        type="button"
        variant="primary"
        size="sm"
        loading={saving}
        onClick={save}
        disabled={!!validationError}
      >
        Save {label} markup
      </Button>
    </div>
  );
}

export default function AgentMarkupPage() {
  const [config, setConfig] = useState<Record<Product, MarkupRule>>({
    flights: { ...DEFAULT_RULE },
    hotels: { ...DEFAULT_RULE },
    taxi: { ...DEFAULT_RULE },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const markup = await agentClient.getMarkup();
        if (active && markup) {
          setConfig({
            flights: markup.flights ?? DEFAULT_RULE,
            hotels: markup.hotels ?? DEFAULT_RULE,
            taxi: markup.taxi ?? DEFAULT_RULE,
          });
        }
      } catch (err) {
        if (active)
          setError(err instanceof ApiError ? err.message : "Unable to load markup settings.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const handleSaved = (product: Product) => (rule: MarkupRule) => {
    setConfig((prev) => ({ ...prev, [product]: rule }));
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-muted">Loading markup settings…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-600">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[20px] font-bold text-ink">Markup Settings</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Set your markup per product. Clients see the marked-up price — net fares are never
          disclosed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PRODUCTS.map(({ value, label, exampleFare }) => (
          <MarkupCard
            key={value}
            product={value}
            label={label}
            exampleFare={exampleFare}
            initial={config[value]}
            onSaved={handleSaved(value)}
          />
        ))}
      </div>
    </div>
  );
}
