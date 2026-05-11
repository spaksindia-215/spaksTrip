"use client";

import { useCallback, useEffect, useState } from "react";

type Preview = {
  count: number;
  sample: string[];
  fetchedAt: number;
};

type ApiResp =
  | { success: true; data: Preview }
  | { success: false; error: string };

function formatRel(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} d ago`;
}

export default function TboHotelCodesAdminPage() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/hotels/all-codes${force ? "?force=true" : ""}`;
      const r = await fetch(url, { cache: "no-store" });
      const j = (await r.json()) as ApiResp;
      if (!j.success) throw new Error(j.error);
      setPreview(j.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch hotel codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const downloadFull = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      const r = await fetch("/api/hotels/all-codes?full=true", { cache: "no-store" });
      const j = (await r.json()) as
        | { success: true; data: { count: number; codes: string[]; fetchedAt: number } }
        | { success: false; error: string };
      if (!j.success) throw new Error(j.error);

      const blob = new Blob(
        [
          JSON.stringify(
            {
              source: "TBOHolidays /hotelcodelist",
              fetchedAt: new Date(j.data.fetchedAt).toISOString(),
              count: j.data.count,
              codes: j.data.codes,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tbo-hotel-codes-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">TBO Hotel Codes</h1>
        <p className="text-sm text-ink-soft">
          Bulk dump of every <code className="rounded bg-slate-100 px-1">HotelCode</code> known to
          TBO Holidays. Multi-MB payload — use this to seed an offline cache, not for
          request-time lookups. Server-side cache TTL: 15 days.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Total codes
            </span>
            <span className="text-3xl font-bold text-ink">
              {loading && !preview ? "—" : preview ? preview.count.toLocaleString() : "—"}
            </span>
            {preview ? (
              <span className="text-[11px] text-ink-muted">
                cached {formatRel(preview.fetchedAt)}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh from TBO"}
            </button>
            <button
              type="button"
              onClick={downloadFull}
              disabled={downloading || !preview}
              className="rounded-lg bg-brand-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "Preparing…" : "Download full JSON"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
          Sample (first {preview?.sample.length ?? 0})
        </h2>
        <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3">
          {preview && preview.sample.length > 0 ? (
            <ul className="grid grid-cols-3 gap-x-4 gap-y-1 font-mono text-[12px] text-ink sm:grid-cols-5">
              {preview.sample.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-ink-soft">
              {loading ? "Loading…" : "No codes loaded yet."}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-[13px] text-ink-soft">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider">Notes</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Endpoint: <code>GET /TBOHolidays_HotelAPI/hotelcodelist</code>, no body.
          </li>
          <li>
            TBO recommends refreshing static data every ~15 days; server cache enforces this. Use
            <span className="px-1 font-semibold">Refresh from TBO</span> to bypass.
          </li>
          <li>
            For city-wise codes (much smaller), use{" "}
            <code>GET /api/hotels/code-list?cityCode=&lt;id&gt;</code> instead.
          </li>
        </ul>
      </section>
    </main>
  );
}
