import type { ReactNode } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  // Cell renderer. Receives the row.
  cell: (row: T) => ReactNode;
  // Optional right-alignment (amounts, actions).
  align?: "left" | "right";
  // Hide this column on the stacked mobile view.
  hideOnMobile?: boolean;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty: { title: string; subtitle?: string; cta?: ReactNode };
  footer?: ReactNode;
  className?: string;
};

// Clean, header-light data table. Renders a real <table> on md+ and a
// stacked label/value card list below md so it stays readable on phones.
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  footer,
  className,
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className={cn("rounded-md border border-border-soft bg-surface", className)}>
        <EmptyState title={empty.title} subtitle={empty.subtitle} cta={empty.cta} />
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border border-border-soft bg-surface", className)}>
      {/* Desktop / tablet table */}
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-border-soft">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-subtle",
                  col.align === "right" ? "text-right" : "text-left",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border-soft last:border-b-0 transition-colors hover:bg-surface-muted"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-sm text-ink align-middle",
                    col.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile stacked cards */}
      <ul className="divide-y divide-border-soft md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="flex flex-col gap-2 p-4">
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                    {col.header}
                  </span>
                  <span className="text-sm text-ink text-right">{col.cell(row)}</span>
                </div>
              ))}
          </li>
        ))}
      </ul>

      {footer ? (
        <div className="flex items-center justify-between border-t border-border-soft px-4 py-3 text-[13px] text-ink-muted">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
