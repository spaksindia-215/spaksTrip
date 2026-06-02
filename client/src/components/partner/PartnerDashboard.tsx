"use client";

import Link from "next/link";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  status: "available" | "coming-soon";
}

const MODULES: Module[] = [
  {
    id: "hotels",
    name: "Hotels",
    description: "List and manage your hotel properties",
    icon: "🏨",
    href: "/partner/hotels",
    status: "available",
  },
  {
    id: "flights",
    name: "Flights",
    description: "Add and manage flight services",
    icon: "✈️",
    href: "/partner/flights",
    status: "coming-soon",
  },
  {
    id: "taxis",
    name: "Taxis",
    description: "Manage your taxi fleet and services",
    icon: "🚕",
    href: "/partner/taxis",
    status: "available",
  },
  {
    id: "packages",
    name: "Tour Packages",
    description: "Create and sell travel packages",
    icon: "🎒",
    href: "/partner/packages",
    status: "coming-soon",
  },
  {
    id: "buses",
    name: "Buses",
    description: "Manage bus services and bookings",
    icon: "🚌",
    href: "/partner/buses",
    status: "coming-soon",
  },
];

export default function PartnerDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-brand-950">Partner Dashboard</h1>
        <p className="mt-2 text-lg text-ink-muted">
          Manage your properties and services across SpaksTrip
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <div
            key={module.id}
            className={`rounded-2xl border-2 p-6 transition ${
              module.status === "available"
                ? "border-brand-200 bg-white hover:shadow-lg hover:border-brand-400"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="mb-4 text-5xl">{module.icon}</div>

            <h3 className="mb-2 text-2xl font-bold text-brand-950">
              {module.name}
            </h3>

            <p className="mb-6 text-ink-muted">{module.description}</p>

            {module.status === "available" ? (
              <Link
                href={module.href}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700"
              >
                Get Started →
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-600 cursor-not-allowed"
              >
                Coming Soon
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 font-semibold text-blue-900">✨ Tips</h3>
        <ul className="space-y-2 text-sm text-blue-900">
          <li>
            • Complete your partner verification first to unlock all features
          </li>
          <li>
            • You can manage multiple properties across different service types
          </li>
          <li>
            • Your partner information is shared across all modules
          </li>
          <li>
            • More modules coming soon to expand your business opportunities
          </li>
        </ul>
      </div>
    </div>
  );
}
