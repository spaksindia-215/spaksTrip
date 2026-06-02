"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { agentClient, type Booking } from "@/lib/agentClient";

export default function AgentPnrPage() {
  const [pnr, setPnr] = useState("");
  const [result, setResult] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = pnr.trim();
    if (!value) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await agentClient.lookupPnr(value));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="mb-3 text-[16px] font-bold text-ink">PNR Tracker</h2>
      <form onSubmit={search} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            id="pnr-search"
            label="PNR"
            type="text"
            value={pnr}
            onChange={(event) => setPnr(event.target.value)}
            placeholder="Enter a PNR"
          />
        </div>
        <Button type="submit" variant="primary" size="md" loading={loading}>
          Search
        </Button>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-600">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-border-soft bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-ink uppercase">{result.productType}</span>
            <Badge tone="brand" size="sm">{result.status}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-ink-muted">
            PNR {result.pnr} · {result.currency} {result.amount.toLocaleString("en-IN")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
