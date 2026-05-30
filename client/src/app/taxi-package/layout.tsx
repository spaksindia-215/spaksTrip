import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taxi Packages | SpaksTrip",
  description: "Book local cabs, outstation taxi packages and airport transfers with verified drivers and transparent fares on SpaksTrip.",
  openGraph: {
    title: "Taxi Packages | SpaksTrip",
    description: "Premium taxi packages for local, outstation and airport transfers across India.",
    type: "website",
  },
};

export default function TaxiPackageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
