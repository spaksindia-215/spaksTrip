"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Payment History", href: "/account/payment-history" },
  { label: "Invoice History", href: "/account/invoice-history" },
  { label: "Flight Credit Note", href: "/account/credit-notes/flight" },
  { label: "Hotel Credit Note", href: "/account/credit-notes/hotel" },
  { label: "Car Credit Note", href: "/account/credit-notes/car" },
  { label: "Bus Credit Note", href: "/account/credit-notes/bus" },
  { label: "Insurance Credit Note", href: "/account/credit-notes/insurance" },
  { label: "Transfer Credit Note", href: "/account/credit-notes/transfer" },
  { label: "Bank Account", href: "/account/bank-account" },
  { label: "GST Details", href: "/account/gst-details" },
  { label: "Agency ITR Declaration", href: "/account/itr-declaration" },
  { label: "Agency PAN Declaration", href: "/account/pan-declaration" },
  { label: "Spakstrip Bank Details", href: "/account/spakstrip-bank" },
  { label: "PG Failure Queue", href: "/account/pg-failure-queue" },
  { label: "Daily Sales Report", href: "/account/daily-sales-report" },
  { label: "Sales Report", href: "/account/sales-report" },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-60 shrink-0">
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="bg-[#0E1E3A] px-4 py-3">
          <h2 className="text-sm font-bold text-white">Account</h2>
        </div>
        <nav className="p-2">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : "text-ink-soft hover:bg-zinc-50 hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
