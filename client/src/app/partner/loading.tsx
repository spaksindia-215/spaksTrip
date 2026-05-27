export default function PartnerLoading() {
  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <div className="bg-brand-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-white/15" />
              <div className="h-7 w-56 animate-pulse rounded bg-white/20" />
              <div className="h-3 w-72 animate-pulse rounded bg-white/10" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-7 w-28 animate-pulse rounded-full bg-white/15" />
              <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
            <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-10 w-72 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 h-4 w-80 animate-pulse rounded bg-slate-100" />
          </section>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
