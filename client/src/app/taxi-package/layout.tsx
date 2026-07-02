import type { Metadata } from "next";
import { generateServiceMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateServiceMetadata("taxi");

export default function TaxiPackageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
