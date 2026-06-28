"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import {
  servicePublicApi,
  type ServiceModuleConfig,
  type ServiceListingApi,
  type FieldDef,
} from "@/lib/serviceModules";

type Props = {
  config: ServiceModuleConfig;
  // Optional heading override + a forced filter (e.g. visaType for the Visa landing).
  heading?: string;
  blurb?: string;
  forcedFilter?: Record<string, string>;
};

export default function ServiceBrowsePage({ config, heading, blurb, forcedFilter }: Props) {
  const apiClient = servicePublicApi(config);
  const [items, setItems] = useState<ServiceListingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const load = useCallback(
    async (f: Record<string, string>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.browse({ ...forcedFilter, ...f });
        setItems(res.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load listings.");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.basePath, JSON.stringify(forcedFilter)],
  );

  useEffect(() => {
    void load({});
  }, [load]);

  function renderFilter(f: FieldDef) {
    const value = filters[f.key] ?? "";
    const set = (v: string) => setFilters((c) => ({ ...c, [f.key]: v }));
    if (f.kind === "select") {
      return (
        <Select key={f.key} id={`bf-${f.key}`} label={f.label} value={value} onChange={(e) => set(e.target.value)}>
          {f.options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </Select>
      );
    }
    return (
      <Input key={f.key} id={`bf-${f.key}`} label={f.label} value={value} onChange={(e) => set(e.target.value)} />
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-[28px] font-extrabold">{heading ?? config.label}</h1>
        <p className="mt-1 text-[14px] text-ink-muted">{blurb ?? config.blurb}</p>

        <section className="mt-6 grid gap-3 rounded-2xl border border-border-soft bg-surface-muted p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input id="bf-q" label="Search" value={filters.q ?? ""} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value }))} />
          {config.browseFilters.map(renderFilter)}
          <div className="flex items-end">
            <Button type="button" variant="accent" fullWidth onClick={() => load(filters)}>Search</Button>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-sunken" />
              ))}
            </div>
          ) : error ? (
            <EmptyState title="Something went wrong" subtitle={error} />
          ) : items.length === 0 ? (
            <EmptyState title="Nothing found" subtitle="Try a different search or check back soon." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`${config.detailBase}/${item.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border-soft bg-white shadow-(--shadow-xs) transition hover:shadow-(--shadow-pop)"
                >
                  {item.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.images[0].url} alt={item.title} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-surface-muted text-sm text-ink-muted">No image</div>
                  )}
                  <div className="space-y-2 p-4">
                    <h2 className="line-clamp-1 text-[16px] font-bold text-ink">{item.title}</h2>
                    {item.description ? <p className="line-clamp-2 text-[13px] text-ink-muted">{item.description}</p> : null}
                    <p className="pt-1 text-[13px] font-semibold text-brand-700">View details →</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
